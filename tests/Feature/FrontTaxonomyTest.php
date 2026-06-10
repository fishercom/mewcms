<?php

use App\Models\CmsArticle;
use App\Models\CmsSchema;
use App\Models\CmsSchemaGroup;
use App\Models\CmsLang;
use App\Models\CmsTaxonomy;
use App\Models\CmsTaxonomyTerm;
use Inertia\Testing\AssertableInertia as Assert;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
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
        'front_view' => 'front/templates/page'
    ]);
});

it('can render a category listing page with associated articles', function () {
    $taxonomy = CmsTaxonomy::create([
        'name' => 'Categorías',
        'slug' => 'categorias',
        'active' => 1,
    ]);

    $term = CmsTaxonomyTerm::create([
        'taxonomy_id' => $taxonomy->id,
        'name' => 'Tecnología',
        'slug' => 'tecnologia',
        'active' => 1,
    ]);

    $article = CmsArticle::create([
        'schema_id' => $this->schema->id,
        'lang_id' => $this->lang->id,
        'title' => 'Article 1',
        'slug' => 'article-1',
        'active' => 1,
        'metadata' => ['body' => 'Contenido de prueba'],
    ]);

    $article->terms()->attach($term->id);

    $response = $this->get('/category/tecnologia');

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page) => $page
        ->component('front/templates/term-list')
        ->has('term')
        ->where('term.name', 'Tecnología')
        ->has('articles')
        ->where('articles.0.title', 'Article 1')
    );
});

it('can render a tag listing page with associated articles', function () {
    $taxonomy = CmsTaxonomy::create([
        'name' => 'Tags',
        'slug' => 'tags',
        'active' => 1,
    ]);

    $term = CmsTaxonomyTerm::create([
        'taxonomy_id' => $taxonomy->id,
        'name' => 'Laravel',
        'slug' => 'laravel',
        'active' => 1,
    ]);

    $article = CmsArticle::create([
        'schema_id' => $this->schema->id,
        'lang_id' => $this->lang->id,
        'title' => 'Article 2',
        'slug' => 'article-2',
        'active' => 1,
        'metadata' => ['body' => 'Contenido de Laravel'],
    ]);

    $article->terms()->attach($term->id);

    $response = $this->get('/tag/laravel');

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page) => $page
        ->component('front/templates/term-list')
        ->has('term')
        ->where('term.name', 'Laravel')
        ->has('articles')
        ->where('articles.0.title', 'Article 2')
    );
});

it('eager loads taxonomy terms on post/page view', function () {
    $taxonomy = CmsTaxonomy::create([
        'name' => 'Categorías',
        'slug' => 'categorias',
        'active' => 1,
    ]);

    $term = CmsTaxonomyTerm::create([
        'taxonomy_id' => $taxonomy->id,
        'name' => 'Tecnología',
        'slug' => 'tecnologia',
        'active' => 1,
    ]);

    $article = CmsArticle::create([
        'schema_id' => $this->schema->id,
        'lang_id' => $this->lang->id,
        'title' => 'Article 3',
        'slug' => 'article-3',
        'active' => 1,
        'metadata' => ['body' => 'Contenido de prueba'],
    ]);

    $article->terms()->attach($term->id);

    $response = $this->get('/article-3');

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page) => $page
        ->has('article.terms')
        ->where('article.terms.0.name', 'Tecnología')
    );
});
