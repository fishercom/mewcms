<?php

use App\Models\AdmModule;
use App\Models\CmsConfig;
use App\Models\User;
use App\Support\AdminBrand;
use App\Support\SvgSanitizer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
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
    $user = User::factory()->create();
    grantPermissions($user, ['configs' => 'administrar']);

    actingAs($user)->post('/admin/configs/brand', [
        'name' => 'EMSAL',
        'logo' => 'https://cdn.example.com/emsal.png',
        'icon_file' => UploadedFile::fake()->createWithContent('icon.svg', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10"/></svg>'),
    ])->assertSessionHasNoErrors()->assertRedirect('/admin/configs/brand');

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

    actingAs($user)->get('/admin/configs')->assertInertia(fn (Assert $page): Assert => $page->where('brand.name', 'EMSAL'));

    // A tall logo goes in as the icon alone: it is shown next to the name
    actingAs($user)->post('/admin/configs/brand', ['name' => 'EMSAL', 'tagline' => 'Gestor de contenidos', 'logo' => ''])->assertSessionHasNoErrors();
    actingAs($user)->get('/admin/configs')->assertInertia(fn (Assert $page): Assert => $page
        ->where('brand.logo', null)
        ->where('brand.icon', $brand['icon'])
        ->where('brand.tagline', 'Gestor de contenidos')
    );

    // Removing both brings MewCMS's back, and the uploaded icon file is deleted
    actingAs($user)->post('/admin/configs/brand', ['name' => 'EMSAL', 'logo' => '', 'icon' => ''])->assertSessionHasNoErrors();
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

    actingAs($user)->post('/admin/configs/brand', [
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

    actingAs($user)->post('/admin/configs/brand', ['logo_file' => UploadedFile::fake()->createWithContent('logo.html', '<b>hi</b>')])
        ->assertSessionHasErrors('logo_file');

    actingAs($user)->post('/admin/configs/brand', ['logo_file' => UploadedFile::fake()->createWithContent('logo.svg', '<!DOCTYPE svg [<!ENTITY x SYSTEM "file:///etc/passwd">]><svg>&x;</svg>')])
        ->assertSessionHasErrors('logo_file');

    expect(AdminBrand::all()['logo'])->toBe('')
        ->and(SvgSanitizer::clean('<html/>'))->toBeNull();
});

it('lets only users with the Configuración module change the brand', function (): void {
    $viewer = User::factory()->create();
    grantPermissions($viewer, ['configs' => 'listar']);

    actingAs($viewer)->get('/admin/configs/brand')->assertOk();
    actingAs($viewer)->post('/admin/configs/brand', ['name' => 'Nope'])->assertForbidden();

    $other = User::factory()->create();
    grantPermissions($other, ['articles' => 'administrar']);
    actingAs($other)->get('/admin/configs/brand')->assertForbidden();
});

it('adds a "Marca del panel" entry to the sidebar for users with Configuración', function (): void {
    $editor = User::factory()->create();
    grantPermissions($editor, ['configs' => 'listar']);
    $other = User::factory()->create();
    grantPermissions($other, ['articles' => 'listar']);

    (require database_path('migrations/2026_11_20_100000_add_brand_menu_entry.php'))->up();

    $entry = AdmModule::where('route', 'configs.brand')->firstOrFail();
    expect($entry->visible)->toBeTruthy()
        ->and($entry->events()->count())->toBe(0);

    $urls = fn (User $user): array => collect(actingAs($user)->get('/admin/configs/brand')->viewData('page')['props']['adm_menu'] ?? [])
        ->flatMap(fn (array $group): array => array_column($group['items'], 'url'))->all();

    expect($urls($editor))->toContain('/admin/configs/brand');
    expect(collect(actingAs($other)->get('/admin/articles')->viewData('page')['props']['adm_menu'] ?? [])
        ->flatMap(fn (array $group): array => array_column($group['items'], 'url'))->all())->not->toContain('/admin/configs/brand');

    // Running it again adds nothing
    (require database_path('migrations/2026_11_20_100000_add_brand_menu_entry.php'))->up();
    expect(AdmModule::where('route', 'configs.brand')->count())->toBe(1);
});
