<?php

use App\Models\CmsArticle;
use App\Models\CmsLang;
use App\Models\CmsSchema;
use App\Models\CmsSchemaGroup;
use App\Models\CmsTag;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function (): void {
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
        'name' => 'Page Schema',
        'type' => 'PAGE',
        'active' => 1,
        'fields' => [],
        'front_view' => 'front/templates/page',
    ]);
});

it('can render a category listing page by redirecting to tag archive', function (): void {
    $tag = CmsTag::create([
        'name' => 'Tecnología',
        'slug' => 'tecnologia',
        'active' => true,
    ]);

    $article = CmsArticle::create([
        'schema_id' => $this->schema->id,
        'lang_id' => $this->lang->id,
        'title' => 'Article 1',
        'slug' => 'article-1',
        'active' => 1,
        'metadata' => ['body' => 'Contenido de prueba'],
    ]);

    $article->tags()->attach($tag->id);

    $this->get('/category/tecnologia')->assertRedirect('/tag/tecnologia')->assertStatus(301);

    $response = $this->get('/tag/tecnologia');

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page): AssertableInertia => $page
        ->component('front/tag')
        ->has('tag')
        ->where('tag.name', 'Tecnología')
        ->has('items')
        ->where('items.0.title', 'Article 1')
    );
});

it('can render a tag listing page with associated articles', function (): void {
    $tag = CmsTag::create([
        'name' => 'Laravel',
        'slug' => 'laravel',
        'active' => true,
    ]);

    $article = CmsArticle::create([
        'schema_id' => $this->schema->id,
        'lang_id' => $this->lang->id,
        'title' => 'Article 2',
        'slug' => 'article-2',
        'active' => 1,
        'metadata' => ['body' => 'Contenido de Laravel'],
    ]);

    $article->tags()->attach($tag->id);

    $response = $this->get('/tag/laravel');

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page): AssertableInertia => $page
        ->component('front/tag')
        ->has('tag')
        ->where('tag.name', 'Laravel')
        ->has('items')
        ->where('items.0.title', 'Article 2')
    );
});

it('eager loads tags on post/page view', function (): void {
    $tag = CmsTag::create([
        'name' => 'Tecnología',
        'slug' => 'tecnologia',
        'active' => true,
    ]);

    $article = CmsArticle::create([
        'schema_id' => $this->schema->id,
        'lang_id' => $this->lang->id,
        'title' => 'Article 3',
        'slug' => 'article-3',
        'active' => 1,
        'metadata' => ['body' => 'Contenido de prueba'],
    ]);

    $article->tags()->attach($tag->id);

    $response = $this->get('/article-3');

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page): AssertableInertia => $page
        ->has('article.tags')
        ->where('article.tags.0.name', 'Tecnología')
    );
});
