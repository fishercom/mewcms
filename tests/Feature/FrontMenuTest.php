<?php

use App\Models\CmsArticle;
use App\Models\CmsSchema;
use App\Models\CmsSchemaGroup;
use App\Models\CmsLang;
use App\Models\CmsMenu;
use App\Models\CmsMenuItem;
use App\Models\User;
use App\Models\Profile;
use Inertia\Testing\AssertableInertia as Assert;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

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

    $this->group = CmsSchemaGroup::create([
        'name' => 'Default Group',
        'layout' => 'layout',
        'default' => 1,
        'active' => 1,
    ]);

    $this->lang = CmsLang::create([
        'name' => 'English',
        'iso' => 'en',
        'active' => 1,
    ]);

    $this->schema = CmsSchema::create([
        'group_id' => $this->group->id,
        'name' => 'Home Schema',
        'type' => 'HOME',
        'active' => 1,
        'fields' => [],
        'front_view' => 'front/templates/home'
    ]);
});

it('allows authenticated users to view menus list', function () {
    $response = $this->actingAs($this->user)->get('/admin/menus');
    $response->assertStatus(200);
});

it('allows authenticated users to create a menu', function () {
    $response = $this->actingAs($this->user)->post('/admin/menus', [
        'name' => 'Main Navigation',
        'slug' => 'main-nav',
        'description' => 'Top header links',
        'active' => 1
    ]);

    $response->assertRedirect('/admin/menus');
    $this->assertDatabaseHas('cms_menus', [
        'name' => 'Main Navigation',
        'slug' => 'main-nav'
    ]);
});

it('allows managing individual menu items', function () {
    $menu = CmsMenu::create([
        'name' => 'Header Menu',
        'slug' => 'header',
        'active' => 1,
    ]);

    // Add item
    $response = $this->actingAs($this->user)->post("/admin/menus/{$menu->id}/items", [
        'title' => 'Services',
        'url' => '/services',
        'target' => '_self',
        'active' => 1,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('cms_menu_items', [
        'menu_id' => $menu->id,
        'title' => 'Services',
        'url' => '/services'
    ]);

    $item = CmsMenuItem::where('menu_id', $menu->id)->first();

    // Sort items
    $response2 = $this->actingAs($this->user)->post("/admin/menus/{$menu->id}/items/sort", [
        'items' => [
            ['id' => $item->id, 'parent_id' => null, 'position' => 0]
        ]
    ]);
    $response2->assertStatus(200);

    // Delete item
    $response3 = $this->actingAs($this->user)->delete("/admin/menus/items/{$item->id}");
    $response3->assertRedirect();
    $this->assertDatabaseMissing('cms_menu_items', ['id' => $item->id]);
});

it('eager resolves cms article slug in public layout shared menus', function () {
    $menu = CmsMenu::create([
        'name' => 'Header Menu',
        'slug' => 'header',
        'active' => 1,
    ]);

    $article = CmsArticle::create([
        'schema_id' => $this->schema->id,
        'lang_id' => $this->lang->id,
        'title' => 'About Us Page',
        'slug' => 'about_us_page',
        'active' => 1,
        'metadata' => [],
    ]);

    $item = CmsMenuItem::create([
        'menu_id' => $menu->id,
        'title' => 'About Us',
        'article_id' => $article->id,
        'active' => 1,
        'position' => 0,
    ]);

    // Visit home page and verify menu resolved_url is shared
    $response = $this->get('/');
    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page) => $page
        ->has('menus')
        ->where('menus.0.slug', 'header')
        ->where('menus.0.items.0.resolved_url', '/about/us/page')
    );
});
