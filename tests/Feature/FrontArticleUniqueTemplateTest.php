<?php

use App\Models\User;
use App\Models\Profile;
use App\Models\CmsSchema;
use App\Models\CmsSchemaGroup;
use App\Models\CmsArticle;
use App\Models\CmsLang;

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
        'name' => 'Global Layout Group',
        'active' => 1,
        'layout' => 'front/layout',
        'default' => 0,
    ]);

    $this->lang = CmsLang::create([
        'name' => 'Spanish',
        'code' => 'es',
        'active' => 1,
    ]);

    // Create a schema that maps to the unique Home Page template
    $this->homeSchema = CmsSchema::create([
        'name' => 'Home Page Schema',
        'group_id' => $this->group->id,
        'fields' => [],
        'front_view' => 'front/templates/home',
        'active' => 1,
    ]);

    // Create a non-unique schema (Standard Page)
    $this->standardSchema = CmsSchema::create([
        'name' => 'Standard Page Schema',
        'group_id' => $this->group->id,
        'fields' => [],
        'front_view' => 'front/templates/page',
        'active' => 1,
    ]);
});

it('verifies home schema is detected as unique', function () {
    $this->assertTrue($this->homeSchema->isUnique());
    $this->assertFalse($this->standardSchema->isUnique());
});

it('filters home schema out of available schemas list on create when already assigned', function () {
    // 1. Initially, home schema should be in create available templates
    $response = $this->actingAs($this->user)->get('/admin/articles/create');
    $response->assertStatus(200);
    $response->assertInertia(function ($page) {
        $schemas = $page->toArray()['props']['schemas'];
        $ids = collect($schemas)->pluck('id')->all();
        $this->assertContains($this->homeSchema->id, $ids);
        $this->assertContains($this->standardSchema->id, $ids);
    });

    // 2. Assign the unique schema to an article
    CmsArticle::create([
        'schema_id' => $this->homeSchema->id,
        'lang_id' => $this->lang->id,
        'title' => 'Home Page Page',
        'slug' => 'home-page-page',
        'active' => 1,
    ]);

    // 3. Now, home schema should NOT be in create list
    $response = $this->actingAs($this->user)->get('/admin/articles/create');
    $response->assertStatus(200);
    $response->assertInertia(function ($page) {
        $schemas = $page->toArray()['props']['schemas'];
        $ids = collect($schemas)->pluck('id')->all();
        $this->assertNotContains($this->homeSchema->id, $ids);
        $this->assertContains($this->standardSchema->id, $ids);
    });
});

it('keeps unique schema selectable inside edit screen for the article that uses it', function () {
    // Assign the unique schema to an article
    $article = CmsArticle::create([
        'schema_id' => $this->homeSchema->id,
        'lang_id' => $this->lang->id,
        'title' => 'Home Page Page',
        'slug' => 'home-page-page',
        'active' => 1,
    ]);

    // Fetch edit view for that article - home template must be present
    $response = $this->actingAs($this->user)->get("/admin/articles/{$article->id}/edit");
    $response->assertStatus(200);
    $response->assertInertia(function ($page) {
        $schemas = $page->toArray()['props']['schemas'];
        $ids = collect($schemas)->pluck('id')->all();
        $this->assertContains($this->homeSchema->id, $ids);
        $this->assertContains($this->standardSchema->id, $ids);
    });

    // Fetch edit view for another article - home template must NOT be present
    $anotherArticle = CmsArticle::create([
        'schema_id' => $this->standardSchema->id,
        'lang_id' => $this->lang->id,
        'title' => 'Another Page',
        'slug' => 'another-page',
        'active' => 1,
    ]);

    $response2 = $this->actingAs($this->user)->get("/admin/articles/{$anotherArticle->id}/edit");
    $response2->assertStatus(200);
    $response2->assertInertia(function ($page) {
        $schemas = $page->toArray()['props']['schemas'];
        $ids = collect($schemas)->pluck('id')->all();
        $this->assertNotContains($this->homeSchema->id, $ids);
        $this->assertContains($this->standardSchema->id, $ids);
    });
});

it('prevents saving a duplicate unique template page via store API validation', function () {
    // 1. Assign home template once
    CmsArticle::create([
        'schema_id' => $this->homeSchema->id,
        'lang_id' => $this->lang->id,
        'title' => 'Home Page Page',
        'slug' => 'home-page-page',
        'active' => 1,
    ]);

    // 2. Try to post another article with the same unique schema_id
    $response = $this->actingAs($this->user)->post('/admin/articles', [
        'schema_id' => $this->homeSchema->id,
        'lang_id' => $this->lang->id,
        'title' => 'Duplicate Home Page',
        'slug' => 'duplicate-home-page',
        'active' => 1,
    ]);

    $response->assertSessionHasErrors(['schema_id']);
});

it('prevents updating an article to use a unique template page already used elsewhere', function () {
    // 1. Assign home template once
    CmsArticle::create([
        'schema_id' => $this->homeSchema->id,
        'lang_id' => $this->lang->id,
        'title' => 'Home Page Page',
        'slug' => 'home-page-page',
        'active' => 1,
    ]);

    // 2. Create another standard page
    $article = CmsArticle::create([
        'schema_id' => $this->standardSchema->id,
        'lang_id' => $this->lang->id,
        'title' => 'Standard Page',
        'slug' => 'standard-page',
        'active' => 1,
    ]);

    // 3. Try to update standard page to use the home unique schema
    $response = $this->actingAs($this->user)->put("/admin/articles/{$article->id}", [
        'schema_id' => $this->homeSchema->id,
        'lang_id' => $this->lang->id,
        'title' => 'Updated Page Name',
        'slug' => 'standard-page',
        'active' => 1,
    ]);

    $response->assertSessionHasErrors(['schema_id']);
});
