<?php

use App\Models\CmsArticle;
use App\Models\CmsLang;
use App\Models\CmsSchema;
use App\Models\CmsSchemaGroup;
use App\Models\User;
use App\Support\PublicSsrGateway;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Inertia\Ssr\Gateway;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $group = CmsSchemaGroup::create([
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
        'group_id' => $group->id,
        'name' => 'Page Schema',
        'type' => 'PAGE',
        'active' => 1,
        'fields' => [],
        'front_view' => 'front/templates/page',
    ]);

    $this->article = CmsArticle::create([
        'schema_id' => $this->schema->id,
        'lang_id' => $this->lang->id,
        'title' => 'About Us',
        'slug' => 'about-us',
        'active' => 1,
        'metadata' => ['body' => 'Contenido'],
    ]);
});

it('caches the shared public data after the first request', function (): void {
    $this->get('/about-us')->assertOk();

    $queries = [];
    DB::listen(function ($query) use (&$queries): void {
        $queries[] = $query->sql;
    });

    $this->get('/about-us')
        ->assertOk()
        ->assertInertia(fn (Assert $page): Assert => $page
            ->has('navigation', 1)
            ->has('popularTags')
            ->has('recentArticles')
            ->has('menus')
            ->has('layout_settings')
        );

    $sharedQueries = array_filter($queries, fn (string $sql): bool => str_contains($sql, 'cms_menus'));
    expect($sharedQueries)->toBeEmpty();
});

it('refreshes the cached navigation when an article changes', function (): void {
    $this->get('/about-us')->assertInertia(fn (Assert $page): Assert => $page
        ->where('navigation.0.title', 'About Us')
    );

    $this->article->update(['title' => 'Who We Are']);

    $this->get('/'.$this->article->fresh()->slug)->assertInertia(fn (Assert $page): Assert => $page
        ->where('navigation.0.title', 'Who We Are')
    );
});

it('refreshes the cached sitemap when a new article is created', function (): void {
    $this->get('/sitemap.xml')->assertOk()->assertDontSee('/contact');

    CmsArticle::create([
        'schema_id' => $this->schema->id,
        'lang_id' => $this->lang->id,
        'title' => 'Contact',
        'slug' => 'contact',
        'active' => 1,
    ]);

    $this->get('/sitemap.xml')->assertOk()->assertSee('/contact');
});

it('does not server-render admin pages', function (): void {
    config(['inertia.ssr.enabled' => true, 'inertia.ssr.ensure_bundle_exists' => false]);
    Http::fake();

    $gateway = app(Gateway::class);

    expect($gateway)->toBeInstanceOf(PublicSsrGateway::class)
        ->and($gateway->dispatch(['component' => 'admin/articles/index', 'props' => []]))->toBeNull();

    Http::assertNothingSent();
});

it('server-renders public pages', function (): void {
    config(['inertia.ssr.enabled' => true, 'inertia.ssr.ensure_bundle_exists' => false]);
    Http::fake([
        '*/render' => Http::response([
            'head' => ['<title inertia>About Us - MewCMS</title>'],
            'body' => '<div id="app"><h1>About Us</h1></div>',
        ]),
    ]);

    $response = app(Gateway::class)->dispatch(['component' => 'front/templates/page', 'props' => []]);

    expect($response)->not->toBeNull()
        ->and($response->body)->toContain('<h1>About Us</h1>');

    $html = $this->get('/about-us')->assertOk()->getContent();

    expect($html)->toContain('<h1>About Us</h1>')
        ->and(substr_count($html, '<title'))->toBe(1);
});

it('caches the dashboard disk usage scan', function (): void {
    Cache::forget('admin.disk_usage');

    $this->actingAs(User::factory()->superAdmin()->create())
        ->get('/admin')
        ->assertOk();

    expect(Cache::has('admin.disk_usage'))->toBeTrue();
});
