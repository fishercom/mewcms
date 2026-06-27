<?php

use App\Models\CmsConfig;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
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
        ['type' => 'string', 'name' => 'Facebook', 'alias' => 'layout_facebook', 'value' => ''],
        ['type' => 'string', 'name' => 'Instagram', 'alias' => 'layout_instagram', 'value' => ''],
        ['type' => 'string', 'name' => 'Twitter', 'alias' => 'layout_twitter', 'value' => ''],
        ['type' => 'string', 'name' => 'LinkedIn', 'alias' => 'layout_linkedin', 'value' => ''],
        ['type' => 'string', 'name' => 'YouTube', 'alias' => 'layout_youtube', 'value' => ''],
        ['type' => 'text', 'name' => 'Custom CSS', 'alias' => 'layout_custom_css', 'value' => ''],
    ];

    foreach ($configs as $config) {
        CmsConfig::updateOrCreate(['alias' => $config['alias']], $config);
    }
});

it('prevents guests from accessing layout settings customizer', function () {
    $response = $this->get('/admin/layout');
    $response->assertRedirect('/login');
});

it('allows authenticated admin to view layout customizer dashboard page', function () {
    $response = $this->actingAs($this->user)->get('/admin/layout');

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page) => $page
        ->component('admin/layout/index')
        ->has('settings')
        ->where('settings.layout_copyright', '© MewCMS')
    );
});

it('allows updating layout settings and changes configs in db', function () {
    $response = $this->actingAs($this->user)->post('/admin/layout', [
        'layout_header_logo' => 'https://site.com/header.png',
        'layout_copyright' => 'Updated Copyright 2026',
        'layout_facebook' => 'https://facebook.com/mewcms',
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
        'alias' => 'layout_facebook',
        'value' => 'https://facebook.com/mewcms',
    ]);

    $this->assertDatabaseHas('cms_configs', [
        'alias' => 'layout_custom_css',
        'value' => 'body { background: #000; }',
    ]);
});

it('shares layout configurations globally in Inertia', function () {
    // Modify one config first
    CmsConfig::where('alias', 'layout_copyright')->update(['value' => 'Testing Global Inertia Share']);

    $response = $this->actingAs($this->user)->get('/admin/layout');

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page) => $page
        ->has('layout_settings')
        ->where('layout_settings.layout_copyright', 'Testing Global Inertia Share')
    );
});
