<?php

use App\Models\AdmLog;
use App\Models\CmsLang;
use App\Models\CmsTaxonomy;
use App\Models\CmsTaxonomyTerm;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    Storage::fake('public');
});

test('users without an admin profile cannot enter the admin', function (): void {
    $user = User::factory()->withoutProfile()->create();

    $this->actingAs($user)->get('/admin')->assertForbidden();
    $this->actingAs($user)->get('/admin/articles')->assertForbidden();
    $this->actingAs($user)->get('/laravel-filemanager/jsonitems?type=Images&working_dir=/')->assertForbidden();
});

test('deactivated users cannot enter the admin even with a super admin profile', function (): void {
    $user = User::factory()->superAdmin()->create(['active' => false]);

    $this->actingAs($user)->get('/admin')->assertForbidden();
    $this->actingAs($user)->get('/admin/articles')->assertForbidden();
});

test('users without an admin profile are sent home after logging in', function (): void {
    $user = User::factory()->withoutProfile()->create();

    $this->post('/login', ['email' => $user->email, 'password' => 'password'])
        ->assertRedirect(route('home', absolute: false));
});

test('the list permission allows reading but not writing', function (): void {
    $user = User::factory()->create();
    grantPermissions($user, ['articles' => 'listar']);
    CmsLang::create(['name' => 'Español', 'iso' => 'es', 'active' => true]);

    $this->actingAs($user)->get('/admin/articles')->assertOk();
    $this->actingAs($user)->get('/admin/articles/create')->assertForbidden();
    $this->actingAs($user)->post('/admin/articles', ['title' => 'Nope'])->assertForbidden();
    $this->actingAs($user)->get('/admin/users')->assertForbidden();
});

test('the manage permission allows writing', function (): void {
    $user = User::factory()->create();
    grantPermissions($user, ['articles' => 'administrar']);
    CmsLang::create(['name' => 'Español', 'iso' => 'es', 'active' => true]);

    $this->actingAs($user)->get('/admin/articles')->assertOk();
    $this->actingAs($user)->get('/admin/articles/create')->assertOk();
});

test('shallow taxonomy term routes are protected by the taxonomies module', function (): void {
    $taxonomy = CmsTaxonomy::create(['name' => 'Categorías', 'slug' => 'categorias', 'active' => true]);
    $term = CmsTaxonomyTerm::create(['taxonomy_id' => $taxonomy->id, 'name' => 'News', 'active' => true]);

    $reader = User::factory()->create();
    grantPermissions($reader, ['taxonomies' => 'listar']);
    $this->actingAs($reader)->get("/admin/terms/{$term->id}/edit")->assertForbidden();

    $editor = User::factory()->create();
    grantPermissions($editor, ['taxonomies' => 'administrar']);
    $this->actingAs($editor)->get("/admin/terms/{$term->id}/edit")->assertOk();
});

test('the file manager requires the media manage permission to change files', function (): void {
    $user = User::factory()->create();
    grantPermissions($user, ['media' => 'listar']);

    $this->actingAs($user)->get('/laravel-filemanager/jsonitems?type=Images&working_dir=/')->assertOk();
    $this->actingAs($user)->get('/laravel-filemanager/newfolder?name=nope&type=Images')->assertForbidden();
    $this->actingAs($user)->get('/laravel-filemanager/delete?items[]=a.jpg&type=Files&working_dir=/')->assertForbidden();
});

test('the admin sidebar only lists permitted modules', function (): void {
    $user = User::factory()->create();
    grantPermissions($user, ['articles' => 'listar']);

    // A module the user has no permission for
    $other = User::factory()->superAdmin()->create();
    grantPermissions($other, ['users' => 'listar']);

    $this->actingAs($user)->get('/admin')->assertInertia(fn (Assert $page): Assert => $page
        ->has('adm_menu', 1)
        ->where('adm_menu.0.items', fn ($items): bool => collect($items)->pluck('url')->all() === ['/admin/articles'])
        ->where('auth.permissions.super_admin', false)
    );
});

test('admins who are not super administrators cannot grant or edit super admin access', function (): void {
    $admin = User::factory()->create();
    grantPermissions($admin, ['users' => 'administrar', 'profiles' => 'administrar']);

    $superProfile = Profile::factory()->superAdmin()->create();
    $superUser = User::factory()->create(['profile_id' => $superProfile->id]);

    $this->actingAs($admin)->post('/admin/users', [
        'name' => 'Sneaky',
        'email' => 'sneaky@example.com',
        'password' => 'password',
        'profile_id' => $superProfile->id,
    ])->assertForbidden();

    $this->actingAs($admin)->put("/admin/users/{$superUser->id}", [
        'name' => 'Renamed',
        'email' => $superUser->email,
    ])->assertForbidden();

    $this->actingAs($admin)->delete("/admin/users/{$superUser->id}")->assertForbidden();

    $this->actingAs($admin)->put("/admin/profiles/{$superProfile->id}", ['name' => 'Hijacked'])->assertForbidden();

    expect(User::where('email', 'sneaky@example.com')->exists())->toBeFalse();
});

test('user management validates input and hashes passwords', function (): void {
    $admin = User::factory()->superAdmin()->create();

    $this->actingAs($admin)->post('/admin/users', [
        'name' => 'Editor',
        'email' => 'not-an-email',
        'password' => 'password',
    ])->assertSessionHasErrors('email');

    $this->actingAs($admin)->post('/admin/users', [
        'name' => 'Editor',
        'email' => 'editor@example.com',
        'password' => 'password',
    ])->assertRedirect('/admin/users');

    $editor = User::where('email', 'editor@example.com')->first();
    expect($editor->password)->not->toBe('password');
});

test('audit log entries cannot be created or edited through the admin', function (): void {
    $admin = User::factory()->superAdmin()->create();

    $this->actingAs($admin)->post('/admin/logs', ['event_id' => 1, 'comment' => 'fake'])->assertStatus(405);

    expect(AdmLog::count())->toBe(0);
});

test('admin changes and logins are written to the audit log', function (): void {
    $admin = User::factory()->superAdmin()->create();
    grantPermissions($admin, ['taxonomies' => 'administrar', 'login' => 'login']);

    $this->post('/login', ['email' => $admin->email, 'password' => 'password']);

    $this->post('/admin/taxonomies', ['name' => 'Categorías', 'active' => true])->assertRedirect();

    $comments = AdmLog::where('user_id', $admin->id)->pluck('comment');

    expect($comments)->toContain('Inicio de sesión')
        ->and($comments->contains(fn (string $comment): bool => str_contains($comment, 'Creado en Taxonomies') && str_contains($comment, 'Categorías')))->toBeTrue();
});
