<?php

use App\Models\CmsArticle;
use App\Models\CmsSchema;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

it('returns a successful response', function () {
    $group = \App\Models\CmsSchemaGroup::create([
        'name' => 'Default Group',
        'layout' => 'layout',
        'default' => 1,
        'active' => 1,
    ]);

    $lang = \App\Models\CmsLang::create([
        'name' => 'English',
        'iso' => 'en',
        'active' => 1,
    ]);

    $schema = CmsSchema::create([
        'group_id' => $group->id,
        'name' => 'Home Schema',
        'type' => 'HOME',
        'active' => 1,
        'fields' => [],
    ]);

    CmsArticle::create([
        'schema_id' => $schema->id,
        'lang_id' => $lang->id,
        'title' => 'Home Page',
        'slug' => 'home',
        'active' => 1,
        'metadata' => [],
    ]);

    $response = $this->get('/');

    $response->assertStatus(200);
});
