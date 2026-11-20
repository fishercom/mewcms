<?php

use App\Models\CmsConfig;
use App\Models\User;
use App\Support\AdminBrand;
use App\Support\SvgSanitizer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\get;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    Storage::fake('public');
});

it('shows the MewCMS logo until the client has one', function (): void {
    get('/login')->assertInertia(fn (Assert $page): Assert => $page->where('brand', null));
});

it('saves the client logo and shares it with the panel and the login screen', function (): void {
    $user = User::factory()->superAdmin()->create();

    actingAs($user)->post('/settings/brand', [
        'name' => 'EMSAL',
        'logo' => 'https://cdn.example.com/emsal.png',
        'icon_file' => UploadedFile::fake()->createWithContent('icon.svg', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10"/></svg>'),
    ])->assertSessionHasNoErrors()->assertRedirect('/settings/brand');

    $brand = AdminBrand::all();
    expect($brand['name'])->toBe('EMSAL')
        ->and($brand['logo'])->toBe('https://cdn.example.com/emsal.png')
        ->and($brand['logo_dark'])->toBe('')
        ->and($brand['icon'])->toEndWith('.svg')
        ->and(CmsConfig::where('alias', 'admin_brand_name')->value('site_id'))->toBeNull();

    $iconPath = 'brand/'.basename($brand['icon']);
    Storage::disk('public')->assertExists($iconPath);

    $this->app['auth']->guard()->logout();
    get('/login')->assertInertia(fn (Assert $page): Assert => $page
        ->where('brand.name', 'EMSAL')
        ->where('brand.logo', 'https://cdn.example.com/emsal.png')
        ->where('brand.logo_dark', null)
        ->where('brand.tagline', null)
        ->where('brand.icon', $brand['icon'])
    );

    actingAs($user)->get('/admin/layout')->assertInertia(fn (Assert $page): Assert => $page->where('brand.name', 'EMSAL'));

    // A tall logo goes in as the icon alone: it is shown next to the name
    actingAs($user)->post('/settings/brand', ['name' => 'EMSAL', 'tagline' => 'Gestor de contenidos', 'logo' => ''])->assertSessionHasNoErrors();
    actingAs($user)->get('/admin/layout')->assertInertia(fn (Assert $page): Assert => $page
        ->where('brand.logo', null)
        ->where('brand.icon', $brand['icon'])
        ->where('brand.tagline', 'Gestor de contenidos')
    );

    // Removing both brings MewCMS's back, and the uploaded icon file is deleted
    actingAs($user)->post('/settings/brand', ['name' => 'EMSAL', 'logo' => '', 'icon' => ''])->assertSessionHasNoErrors();
    Storage::disk('public')->assertMissing($iconPath);
    $this->app['auth']->guard()->logout();
    get('/login')->assertInertia(fn (Assert $page): Assert => $page->where('brand', null));
});

it('cleans scripts and external references out of uploaded SVG logos', function (): void {
    $user = User::factory()->superAdmin()->create();

    $svg = <<<'SVG'
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 10 10" onload="alert(1)">
      <script>alert(1)</script>
      <foreignObject><iframe xmlns="http://www.w3.org/1999/xhtml" src="https://evil.test"/></foreignObject>
      <defs><linearGradient id="g"><stop offset="0" stop-color="#f86801"/></linearGradient></defs>
      <a href="javascript:alert(1)"><rect width="5" height="5"/></a>
      <rect width="10" height="10" fill="url(#g)" style="fill:url(https://evil.test/x)" onclick="alert(1)"/>
      <use xlink:href="https://evil.test/sprite.svg#x"/>
      <use href="#g"/>
    </svg>
    SVG;

    actingAs($user)->post('/settings/brand', [
        'logo_file' => UploadedFile::fake()->createWithContent('logo.svg', $svg),
    ])->assertSessionHasNoErrors();

    $saved = Storage::disk('public')->get('brand/'.basename(AdminBrand::all()['logo']));

    expect($saved)->toContain('<linearGradient id="g">')
        ->toContain('fill="url(#g)"')
        ->toContain('<use href="#g"/>')
        ->not->toContain('script')
        ->not->toContain('onload')
        ->not->toContain('onclick')
        ->not->toContain('foreignObject')
        ->not->toContain('evil.test')
        ->not->toContain('javascript:');
});

it('rejects other file types and unreadable SVG', function (): void {
    $user = User::factory()->superAdmin()->create();

    actingAs($user)->post('/settings/brand', ['logo_file' => UploadedFile::fake()->createWithContent('logo.html', '<b>hi</b>')])
        ->assertSessionHasErrors('logo_file');

    actingAs($user)->post('/settings/brand', ['logo_file' => UploadedFile::fake()->createWithContent('logo.svg', '<!DOCTYPE svg [<!ENTITY x SYSTEM "file:///etc/passwd">]><svg>&x;</svg>')])
        ->assertSessionHasErrors('logo_file');

    expect(AdminBrand::all()['logo'])->toBe('')
        ->and(SvgSanitizer::clean('<html/>'))->toBeNull();
});

it('lets only super admins see and change the brand', function (): void {
    // Even full rights on the layout are not enough
    $admin = User::factory()->create();
    grantPermissions($admin, ['layout' => 'administrar']);

    actingAs($admin)->get('/settings/brand')->assertForbidden();
    actingAs($admin)->post('/settings/brand', ['name' => 'Nope'])->assertForbidden();
    expect(AdminBrand::all()['name'])->toBe('');

    $superAdmin = User::factory()->superAdmin()->create();
    actingAs($superAdmin)->get('/settings/brand')->assertOk()
        ->assertInertia(fn (Assert $page): Assert => $page->component('settings/brand')->where('auth.permissions.super_admin', true));
});

it('removes the sidebar entry an earlier version added', function (): void {
    $menu = DB::table('adm_menus')->insertGetId(['name' => 'Administración', 'position' => 0, 'visible' => true]);
    $module = DB::table('adm_modules')->insertGetId(['menu_id' => $menu, 'name' => 'Marca del panel', 'url' => '/admin/configs/brand', 'route' => 'configs.brand', 'position' => 1, 'visible' => true]);

    (require database_path('migrations/2026_11_20_200000_remove_brand_menu_entry.php'))->up();

    expect(DB::table('adm_modules')->where('id', $module)->exists())->toBeFalse();
});
