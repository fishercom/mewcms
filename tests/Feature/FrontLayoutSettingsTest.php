<?php

use App\Models\CmsArticle;
use App\Models\CmsConfig;
use App\Models\CmsLang;
use App\Models\Profile;
use App\Models\User;
use App\Support\FrontCache;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->profile = Profile::create([
        'name' => 'Super Admin',
        'sa' => 1,
        'active' => 1,
    ]);

    $this->user = User::create([
        'username' => 'testadmin',
        'name' => 'Test Admin',
        'email' => 'admin@test.com',
        'password' => bcrypt('password'),
        'profile_id' => $this->profile->id,
        'active' => 1,
    ]);

    // Ensure config variables exist
    $configs = [
        ['type' => 'string', 'name' => 'Logo Header', 'alias' => 'layout_header_logo', 'value' => null],
        ['type' => 'string', 'name' => 'Logo Footer', 'alias' => 'layout_footer_logo', 'value' => null],
        ['type' => 'string', 'name' => 'Copyright', 'alias' => 'layout_copyright', 'value' => '© MewCMS'],
        ['type' => 'json', 'name' => 'Redes sociales', 'alias' => 'layout_social_links', 'value' => '[]'],
        ['type' => 'text', 'name' => 'Custom CSS', 'alias' => 'layout_custom_css', 'value' => ''],
    ];

    foreach ($configs as $config) {
        CmsConfig::updateOrCreate(['alias' => $config['alias']], $config);
    }
});

it('prevents guests from accessing layout settings customizer', function (): void {
    $response = $this->get('/admin/layout');
    $response->assertRedirect('/login');
});

it('allows authenticated admin to view layout customizer dashboard page', function (): void {
    $response = $this->actingAs($this->user)->get('/admin/layout');

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page): AssertableInertia => $page
        ->component('admin/layout/index')
        ->has('settings')
        ->where('settings.layout_copyright', '© MewCMS')
    );
});

it('allows updating layout settings and changes configs in db', function (): void {
    $response = $this->actingAs($this->user)->post('/admin/layout', [
        'layout_header_logo' => 'https://site.com/header.png',
        'layout_copyright' => 'Updated Copyright 2026',
        'social_links' => [['network' => 'facebook', 'url' => 'https://facebook.com/mewcms', 'label' => '']],
        'layout_custom_css' => 'body { background: #000; }',
    ]);

    $response->assertRedirect('/admin/layout');

    $this->assertDatabaseHas('cms_configs', [
        'alias' => 'layout_header_logo',
        'value' => 'https://site.com/header.png',
    ]);

    $this->assertDatabaseHas('cms_configs', [
        'alias' => 'layout_copyright',
        'value' => 'Updated Copyright 2026',
    ]);

    $this->assertDatabaseHas('cms_configs', [
        'alias' => 'layout_social_links',
        'value' => '[{"network":"facebook","url":"https://facebook.com/mewcms","label":""}]',
    ]);

    $this->assertDatabaseHas('cms_configs', [
        'alias' => 'layout_custom_css',
        'value' => 'body { background: #000; }',
    ]);
});

it('shares layout configurations globally in Inertia', function (): void {
    // Modify one config first
    CmsConfig::where('alias', 'layout_copyright')->update(['value' => 'Testing Global Inertia Share']);

    $response = $this->actingAs($this->user)->get('/admin/layout');

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page): AssertableInertia => $page
        ->has('layout_settings')
        ->where('layout_settings.layout_copyright', 'Testing Global Inertia Share')
    );
});

function footerTestPage(): void
{
    CmsArticle::create(['lang_id' => CmsLang::create(['name' => 'Español', 'iso' => 'es', 'active' => true])->id, 'title' => 'Inicio', 'slug' => 'home', 'active' => true]);
}

it('keeps simple links in the footer credit and strips anything else', function (): void {
    footerTestPage();
    $this->actingAs($this->user)->post('/admin/layout', [
        'layout_copyright' => '© MewCMS. Desarrollado por <a href="https://deepsoft.lat" target="_blank" onclick="steal()">DeepSoft</a>.<script>alert(1)</script><a href="javascript:alert(1)">x</a>',
    ])->assertRedirect();

    $stored = CmsConfig::where('alias', 'layout_copyright')->value('value');
    expect($stored)
        ->toContain('<a href="https://deepsoft.lat" target="_blank" rel="noopener noreferrer">DeepSoft</a>')
        ->not->toContain('<script')
        ->not->toContain('onclick')
        ->not->toContain('javascript:');

    // The save flushes the cached settings, so the public footer shows it right away
    $this->get('/home')->assertInertia(fn (Assert $page): AssertableInertia => $page
        ->where('layout_settings.layout_copyright', $stored));
});

it('sanitizes a footer credit written straight to the database before showing it', function (): void {
    footerTestPage();
    DB::table('cms_configs')->where('alias', 'layout_copyright')->update(['value' => 'Hola <img src=x onerror="alert(1)"><b>mundo</b>']);
    FrontCache::flush();

    $this->get('/home')->assertInertia(fn (Assert $page): AssertableInertia => $page
        ->where('layout_settings.layout_copyright', 'Hola <b>mundo</b>'));
});

it('replaces only the old default credit in existing sites', function (): void {
    $migration = require database_path('migrations/2026_10_30_110000_update_default_footer_credit.php');

    CmsConfig::where('alias', 'layout_copyright')->update(['value' => '© 2026 MewCMS. Powered by Laravel, Inertia, and React.']);
    $migration->up();
    expect(CmsConfig::where('alias', 'layout_copyright')->value('value'))
        ->toBe('© 2026 MewCMS. Desarrollado por <a href="https://deepsoft.lat" target="_blank" rel="noopener noreferrer">DeepSoft</a>.');

    CmsConfig::where('alias', 'layout_copyright')->update(['value' => '© Mi Empresa']);
    $migration->up();
    expect(CmsConfig::where('alias', 'layout_copyright')->value('value'))->toBe('© Mi Empresa');
});
