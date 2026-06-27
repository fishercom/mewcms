<?php

use App\Models\CmsArticle;
use App\Models\CmsLang;
use App\Models\CmsSchema;
use App\Models\CmsSchemaGroup;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

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

it('blocks unique schema pages from selecting a parent page', function () {
    // 1. Create a parent standard page
    $parentArticle = CmsArticle::create([
        'schema_id' => $this->standardSchema->id,
        'lang_id' => $this->lang->id,
        'title' => 'Parent Standard Page',
        'slug' => 'parent-standard-page',
        'active' => 1,
    ]);

    // 2. Try to create a home unique page with parent_id set to the standard page
    $response = $this->actingAs($this->user)->post('/admin/articles', [
        'schema_id' => $this->homeSchema->id,
        'lang_id' => $this->lang->id,
        'title' => 'Home Page Page',
        'slug' => 'home-page-page',
        'active' => 1,
        'parent_id' => $parentArticle->id,
    ]);

    $response->assertSessionHasErrors(['parent_id']);
});

it('blocks selecting a unique schema page as a parent of another page', function () {
    // 1. Create the unique home page at root
    $homeArticle = CmsArticle::create([
        'schema_id' => $this->homeSchema->id,
        'lang_id' => $this->lang->id,
        'title' => 'Home Page Page',
        'slug' => 'home-page-page',
        'active' => 1,
    ]);

    // 2. Try to create a standard page nested under the home unique page
    $response = $this->actingAs($this->user)->post('/admin/articles', [
        'schema_id' => $this->standardSchema->id,
        'lang_id' => $this->lang->id,
        'title' => 'Standard Child Page',
        'slug' => 'standard-child-page',
        'active' => 1,
        'parent_id' => $homeArticle->id,
    ]);

    $response->assertSessionHasErrors(['parent_id']);
});

it('blocks circular parent nesting on update', function () {
    // 1. Create standard page A
    $articleA = CmsArticle::create([
        'schema_id' => $this->standardSchema->id,
        'lang_id' => $this->lang->id,
        'title' => 'Page A',
        'slug' => 'page-a',
        'active' => 1,
    ]);

    // 2. Create child standard page B under A
    $articleB = CmsArticle::create([
        'schema_id' => $this->standardSchema->id,
        'lang_id' => $this->lang->id,
        'title' => 'Page B',
        'slug' => 'page-b',
        'parent_id' => $articleA->id,
        'active' => 1,
    ]);

    // 3. Try to update page A to have B as parent (circular reference)
    $response = $this->actingAs($this->user)->put("/admin/articles/{$articleA->id}", [
        'schema_id' => $this->standardSchema->id,
        'lang_id' => $this->lang->id,
        'title' => 'Page A',
        'slug' => 'page-a',
        'parent_id' => $articleB->id,
        'active' => 1,
    ]);

    $response->assertSessionHasErrors(['parent_id']);
});

it('verifies articles listing is returned in hierarchical tree order with depth set', function () {
    // 1. Create structure: Root Page -> Sub Page -> Sub-Sub Page
    $root = CmsArticle::create([
        'schema_id' => $this->standardSchema->id,
        'lang_id' => $this->lang->id,
        'title' => 'Root Page',
        'slug' => 'root-page',
        'active' => 1,
        'position' => 1,
    ]);

    $sub = CmsArticle::create([
        'schema_id' => $this->standardSchema->id,
        'lang_id' => $this->lang->id,
        'title' => 'Sub Page',
        'slug' => 'sub-page',
        'parent_id' => $root->id,
        'active' => 1,
        'position' => 0,
    ]);

    $subsub = CmsArticle::create([
        'schema_id' => $this->standardSchema->id,
        'lang_id' => $this->lang->id,
        'title' => 'Sub Sub Page',
        'slug' => 'sub-sub-page',
        'parent_id' => $sub->id,
        'active' => 1,
        'position' => 0,
    ]);

    $anotherRoot = CmsArticle::create([
        'schema_id' => $this->standardSchema->id,
        'lang_id' => $this->lang->id,
        'title' => 'Another Root',
        'slug' => 'another-root',
        'active' => 1,
        'position' => 0,
    ]);

    $response = $this->actingAs($this->user)->get('/admin/articles');
    $response->assertStatus(200);
    $response->assertInertia(function ($page) use ($root, $sub, $subsub, $anotherRoot) {
        $items = $page->toArray()['props']['items'];
        $ids = collect($items)->pluck('id')->all();

        // The order must be hierarchical:
        // Root Page (position 1)
        // -> Sub Page
        // -> -> Sub Sub Page
        // Another Root (position 2)
        $this->assertEquals([
            $root->id,
            $sub->id,
            $subsub->id,
            $anotherRoot->id,
        ], $ids);

        // Check depth values
        $this->assertEquals(0, $items[0]['depth']); // root
        $this->assertEquals(1, $items[1]['depth']); // sub
        $this->assertEquals(2, $items[2]['depth']); // subsub
        $this->assertEquals(0, $items[3]['depth']); // anotherRoot
    });
});
