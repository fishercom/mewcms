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
});

it('allows deleting an unassigned schema', function () {
    $schema = CmsSchema::create([
        'name' => 'Unassigned Schema',
        'group_id' => $this->group->id,
        'type' => 'PAGE',
        'fields' => [],
        'active' => 1,
    ]);

    $response = $this->actingAs($this->user)->delete("/admin/schemas/{$schema->id}");
    $response->assertStatus(302);
    $this->assertDatabaseMissing('cms_schemas', ['id' => $schema->id]);
});

it('prevents deleting an assigned schema', function () {
    $schema = CmsSchema::create([
        'name' => 'Assigned Schema',
        'group_id' => $this->group->id,
        'type' => 'PAGE',
        'fields' => [],
        'active' => 1,
    ]);

    CmsArticle::create([
        'schema_id' => $schema->id,
        'lang_id' => $this->lang->id,
        'title' => 'Assigned Test Article',
        'slug' => 'assigned-test-article',
        'active' => 1,
    ]);

    $response = $this->actingAs($this->user)->delete("/admin/schemas/{$schema->id}");
    $response->assertSessionHasErrors(['error']);
    $this->assertDatabaseHas('cms_schemas', ['id' => $schema->id]);
});
