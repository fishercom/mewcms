<?php

use App\Models\CmsArticle;
use App\Models\CmsLang;
use App\Models\CmsSchema;
use App\Models\CmsSchemaGroup;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('returns a successful response', function () {
    $group = CmsSchemaGroup::create([
        'name' => 'Default Group',
        'layout' => 'layout',
        'default' => 1,
        'active' => 1,
    ]);

    $lang = CmsLang::create([
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
