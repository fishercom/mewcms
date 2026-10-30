<?php

use App\Models\CmsArticle;
use App\Models\CmsConfig;
use App\Models\CmsLang;
use App\Models\CmsMenu;
use App\Models\CmsPost;
use App\Models\CmsSchema;
use App\Models\CmsSchemaGroup;
use App\Models\CmsSite;
use App\Models\Profile;
use App\Models\User;
use App\Support\FrontCache;
use App\Support\Sites;
use App\Support\Themes;
use Illuminate\Support\Facades\File;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function (): void {
    $profile = Profile::create(['name' => 'Super Admin', 'sa' => 1, 'active' => 1]);
    $this->user = User::create([
        'username' => 'testadmin',
        'name' => 'Test Admin',
        'email' => 'admin@test.com',
        'password' => bcrypt('password'),
        'profile_id' => $profile->id,
        'active' => 1,
    ]);

    $group = CmsSchemaGroup::create(['name' => 'Default', 'layout' => 'layout', 'default' => 1, 'active' => 1]);
    $this->lang = CmsLang::create(['name' => 'Español', 'iso' => 'es', 'active' => 1]);
    $this->schema = CmsSchema::create(['group_id' => $group->id, 'name' => 'Page', 'type' => 'PAGE', 'active' => 1, 'fields' => [], 'front_view' => 'front/templates/page']);

    $this->siteA = CmsSite::create(['name' => 'Site A', 'domains' => ['a.test', 'www.a.test'], 'theme' => 'default', 'default' => true, 'active' => true]);
    $this->siteB = CmsSite::create(['name' => 'Site B', 'domains' => ['b.test'], 'theme' => 'editorial', 'active' => true]);

    $this->page = fn (CmsSite $site, string $title, string $slug = 'about') => Sites::as($site, fn () => CmsArticle::create([
        'schema_id' => $this->schema->id,
        'lang_id' => $this->lang->id,
        'title' => $title,
        'slug' => $slug,
        'active' => 1,
        'metadata' => [],
    ]));
});

it('serves each site its own pages by domain, with the same address on both', function (): void {
    ($this->page)($this->siteA, 'About A');
    ($this->page)($this->siteB, 'About B');

    $this->get('http://a.test/about')->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('article.title', 'About A')->where('theme', 'default'));
    $this->get('http://www.a.test/about')->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('article.title', 'About A'));
    $this->get('http://b.test/about')->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('article.title', 'About B')->where('theme', 'editorial'));

    // Both pages kept the plain slug: addresses are unique per site only
    expect(CmsArticle::withoutGlobalScopes()->pluck('uri')->all())->toBe(['about', 'about']);
});

it('does not show one site\'s pages on another', function (): void {
    ($this->page)($this->siteB, 'Only on B', 'solo-b');

    $this->get('http://a.test/solo-b')->assertNotFound();
    $this->get('http://b.test/solo-b')->assertOk();
});

it('gives an unknown domain the default site', function (): void {
    ($this->page)($this->siteA, 'About A');

    $this->get('http://preview.example.com/about')->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('article.title', 'About A'));
});

it('does not serve a disabled site', function (): void {
    ($this->page)($this->siteB, 'About B');
    $this->siteB->update(['active' => false]);

    $this->get('http://b.test/about')->assertNotFound();
});

it('creates content in the current site and keeps slugs unique per site', function (): void {
    Sites::as($this->siteA, fn () => CmsPost::create(['title' => 'Hello', 'slug' => 'hello', 'post_type' => 'post', 'lang_id' => $this->lang->id, 'user_id' => $this->user->id]));
    $postB = Sites::as($this->siteB, fn () => CmsPost::create(['title' => 'Hello', 'slug' => 'hello', 'post_type' => 'post', 'lang_id' => $this->lang->id, 'user_id' => $this->user->id]));

    expect($postB->site_id)->toBe($this->siteB->id)
        ->and($postB->slug)->toBe('hello')
        ->and(Sites::as($this->siteA, fn () => CmsPost::count()))->toBe(1);

    // Outside a request, new content goes to the default site
    $menu = CmsMenu::create(['name' => 'Main', 'slug' => 'main', 'active' => 1]);
    expect($menu->site_id)->toBe($this->siteA->id);
});

it('switches the site the admin works on', function (): void {
    ($this->page)($this->siteA, 'About A');
    ($this->page)($this->siteB, 'About B');

    $this->actingAs($this->user)->get('http://a.test/admin/articles')
        ->assertInertia(fn (Assert $page) => $page->has('items', 1)->where('items.0.title', 'About A')->where('site.id', $this->siteA->id)->has('sites', 2));

    $this->actingAs($this->user)->post("http://a.test/admin/sites/{$this->siteB->id}/switch")->assertRedirect();

    $this->actingAs($this->user)->get('http://a.test/admin/articles')
        ->assertInertia(fn (Assert $page) => $page->has('items', 1)->where('items.0.title', 'About B')->where('site.id', $this->siteB->id));
});

it('lists every page and post of the site, whatever language they were saved in', function (): void {
    $english = CmsLang::create(['name' => 'English', 'iso' => 'en', 'active' => 1]);
    $this->siteB->update(['lang_id' => $english->id]);
    Sites::as($this->siteB, function () use ($english): void {
        CmsArticle::create(['schema_id' => $this->schema->id, 'lang_id' => $english->id, 'title' => 'About B', 'slug' => 'about', 'active' => 1, 'metadata' => []]);
        CmsPost::create(['title' => 'Hello B', 'slug' => 'hello', 'post_type' => 'post', 'lang_id' => $english->id, 'user_id' => $this->user->id]);
    });

    $this->actingAs($this->user)->post("http://a.test/admin/sites/{$this->siteB->id}/switch")->assertRedirect();

    $this->actingAs($this->user)->get('http://a.test/admin/articles')
        ->assertInertia(fn (Assert $page) => $page->where('lang_id', $english->id)->has('items', 1)->where('items.0.title', 'About B'));

    // Switching the site to Spanish keeps its English content on the list
    $this->siteB->update(['lang_id' => $this->lang->id]);
    Sites::flush();

    $this->actingAs($this->user)->get('http://a.test/admin/articles')
        ->assertInertia(fn (Assert $page) => $page->where('lang_id', $this->lang->id)->has('items', 1)->where('items.0.title', 'About B'));
    $this->actingAs($this->user)->get("http://a.test/admin/posts?post_type=post&lang_id={$english->id}")
        ->assertInertia(fn (Assert $page) => $page->has('items.data', 1)->where('items.data.0.title', 'Hello B'));
});

it('saves a new page in the language of the site', function (): void {
    $english = CmsLang::create(['name' => 'English', 'iso' => 'en', 'active' => 1]);
    $this->siteB->update(['lang_id' => $english->id]);
    $this->actingAs($this->user)->post("http://a.test/admin/sites/{$this->siteB->id}/switch")->assertRedirect();

    $this->actingAs($this->user)->post('http://a.test/admin/articles', ['title' => 'Contact', 'schema_id' => $this->schema->id, 'lang_id' => $this->lang->id, 'metadata' => []])
        ->assertRedirect();

    expect(Sites::as($this->siteB, fn () => CmsArticle::where('title', 'Contact')->value('lang_id')))->toBe($english->id);
});

it('keeps layout settings per site, over the shared ones', function (): void {
    CmsConfig::create(['type' => 'string', 'name' => 'Copyright', 'alias' => 'layout_copyright', 'value' => 'Shared footer']);

    $this->actingAs($this->user)->post("http://a.test/admin/sites/{$this->siteB->id}/switch");
    $this->actingAs($this->user)->post('http://a.test/admin/layout', ['layout_copyright' => 'Footer B'])->assertRedirect();

    expect(CmsConfig::whereNull('site_id')->where('alias', 'layout_copyright')->value('value'))->toBe('Shared footer');

    $this->get('http://a.test/missing-page');
    expect(Sites::as($this->siteA, fn () => FrontCache::layoutSettings()['layout_copyright']))->toBe('Shared footer')
        ->and(Sites::as($this->siteB, fn () => FrontCache::layoutSettings()['layout_copyright']))->toBe('Footer B');
});

it('caches the public menus per site', function (): void {
    Sites::as($this->siteA, fn () => CmsMenu::create(['name' => 'Menu A', 'slug' => 'main', 'active' => 1]));
    Sites::as($this->siteB, fn () => CmsMenu::create(['name' => 'Menu B', 'slug' => 'main', 'active' => 1]));

    expect(Sites::as($this->siteA, fn () => array_column(FrontCache::menus(), 'name')))->toBe(['Menu A'])
        ->and(Sites::as($this->siteB, fn () => array_column(FrontCache::menus(), 'name')))->toBe(['Menu B']);
});

it('saves a site with its domains and theme', function (): void {
    $this->actingAs($this->user)->post('http://a.test/admin/sites', [
        'name' => 'Site C',
        'domains' => "https://C.test/\nwww.c.test",
        'theme' => 'editorial',
        'lang_id' => $this->lang->id,
        'active' => 1,
    ])->assertRedirect('/admin/sites');

    $site = CmsSite::where('name', 'Site C')->first();
    expect($site->domains)->toBe(['c.test', 'www.c.test'])
        ->and($site->theme)->toBe('editorial')
        ->and($site->lang_id)->toBe($this->lang->id);
});

it('requires a language for every site', function (): void {
    $this->actingAs($this->user)->post('http://a.test/admin/sites', [
        'name' => 'Site C',
        'domains' => 'c.test',
        'theme' => 'default',
    ])->assertSessionHasErrors('lang_id');

    expect(CmsSite::where('name', 'Site C')->exists())->toBeFalse();
});

it('saves a site\'s language, SEO data, favicon and scripts', function (): void {
    $this->actingAs($this->user)->put("http://a.test/admin/sites/{$this->siteB->id}", [
        'name' => 'Site B',
        'domains' => 'b.test',
        'theme' => 'editorial',
        'lang_id' => $this->lang->id,
        'title' => 'El blog de B',
        'description' => 'Notas y novedades',
        'favicon' => '/storage/media/favicon-b.png',
        'head_scripts' => '<script async src="https://www.googletagmanager.com/gtag/js?id=G-B"></script>',
        'body_scripts' => '<noscript>B</noscript>',
        'active' => 1,
    ])->assertRedirect('/admin/sites');

    $site = $this->siteB->fresh();
    expect($site->head_scripts)->toContain('id=G-B')
        ->and($site->body_scripts)->toBe('<noscript>B</noscript>')
        ->and($site->lang_id)->toBe($this->lang->id)
        ->and($site->title)->toBe('El blog de B')
        ->and($site->description)->toBe('Notas y novedades')
        ->and($site->favicon)->toBe('/storage/media/favicon-b.png');
});

it('refuses an unsafe favicon address', function (): void {
    $this->actingAs($this->user)->put("http://a.test/admin/sites/{$this->siteB->id}", [
        'name' => 'Site B',
        'domains' => 'b.test',
        'theme' => 'editorial',
        'favicon' => 'javascript:alert(1)',
    ])->assertSessionHasErrors('favicon');
});

it('shows each site with its own title, language, favicon and scripts', function (): void {
    $en = CmsLang::create(['name' => 'English', 'iso' => 'en', 'active' => 1]);
    $this->siteB->update(['lang_id' => $en->id, 'title' => 'B Journal', 'description' => 'All about B', 'favicon' => '/storage/b.png', 'head_scripts' => '<script>window.gaB = 1</script>', 'body_scripts' => '<script>window.pixelB = 1</script>']);
    ($this->page)($this->siteB, 'About B');

    $this->get('http://b.test/about')->assertOk()
        ->assertSee('lang="en"', false)
        ->assertSee('data-site-title="B Journal"', false)
        ->assertSee('href="/storage/b.png"', false)
        ->assertSee('<script>window.gaB = 1</script>', false)
        ->assertSee('<script>window.pixelB = 1</script>', false)
        ->assertInertia(fn (Assert $page) => $page->where('site.title', 'B Journal')->where('site.description', 'All about B')->where('site.locale', 'en'));

    // Another site does not get them, and neither does the admin
    ($this->page)($this->siteA, 'About A');
    $this->get('http://a.test/about')->assertOk()->assertDontSee('window.gaB', false);
    $this->actingAs($this->user)->get('http://b.test/admin/sites')->assertOk()->assertDontSee('<script>window.gaB', false);
});

it('lists where to see each site and whether it has a home page', function (): void {
    ($this->page)($this->siteA, 'Home A');

    $this->actingAs($this->user)->get('http://a.test/admin/sites')->assertOk()
        ->assertInertia(fn (Assert $page) => $page->has('items.data', 2)
            ->where('items.data.0.name', 'Site A')
            ->where('items.data.0.has_home', true)
            ->where('items.data.0.public_url', 'http://a.test')
            ->where('items.data.1.has_home', false));
});

it('serves the theme screenshots to the admin', function (): void {
    $this->actingAs($this->user)->get('http://a.test/admin/themes/default/screenshot')->assertOk()->assertHeader('content-type', 'image/png');
    $this->actingAs($this->user)->get('http://a.test/admin/themes/missing/screenshot')->assertNotFound();
    auth()->logout();
    $this->get('http://a.test/admin/themes/default/screenshot')->assertRedirect();
});

it('offers the themes and languages on the site form', function (): void {
    $this->actingAs($this->user)->get('http://a.test/admin/sites/create')->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('admin/sites/create')
            ->has('themes', count(Themes::all()))
            ->where('themes.0.layout', 'default')
            ->where('langs.0.iso', 'es')
            ->missing('schemaGroups'));
});

it('refuses a domain that another site uses, or an unknown theme', function (): void {
    $this->actingAs($this->user)->post('http://a.test/admin/sites', [
        'name' => 'Site C',
        'domains' => 'b.test',
        'theme' => 'default',
    ])->assertSessionHasErrors('domains');

    $this->actingAs($this->user)->post('http://a.test/admin/sites', [
        'name' => 'Site C',
        'domains' => 'c.test',
        'theme' => 'missing-theme',
    ])->assertSessionHasErrors('theme');
});

it('keeps a single default site', function (): void {
    $this->siteB->update(['default' => true]);

    expect($this->siteA->fresh()->default)->toBeFalse()
        ->and(Sites::default()->id)->toBe($this->siteB->id);
});

it('does not delete a site that still has content', function (): void {
    ($this->page)($this->siteB, 'About B');

    $this->actingAs($this->user)->delete("http://a.test/admin/sites/{$this->siteB->id}")->assertSessionHasErrors('error');
    expect(CmsSite::find($this->siteB->id))->not->toBeNull();
});

it('leaves a single-site install unscoped', function (): void {
    CmsSite::query()->delete();
    Sites::flush();

    $page = CmsArticle::create(['schema_id' => $this->schema->id, 'lang_id' => $this->lang->id, 'title' => 'About', 'slug' => 'about', 'active' => 1, 'metadata' => []]);

    expect($page->site_id)->toBeNull();
    $this->get('http://anything.test/about')->assertOk();
});

it('prints an uploaded theme\'s stylesheets and scripts on the sites that use it', function (): void {
    Themes::$uploadRoot = sys_get_temp_dir().'/mewcms-themes-'.uniqid();
    File::ensureDirectoryExists(Themes::uploadPath('aurora', 'css'));
    File::put(Themes::uploadPath('aurora', 'css/main.css'), 'body { color: red }');
    File::put(Themes::uploadPath('aurora', 'menu.js'), '');
    File::put(Themes::uploadPath('aurora', 'theme.json'), json_encode(['name' => 'Aurora', 'layout' => 'editorial', 'styles' => ['css/main.css'], 'scripts' => ['menu.js']]));
    Themes::flush();

    try {
        $this->siteB->update(['theme' => 'aurora']);
        ($this->page)($this->siteB, 'About B');
        ($this->page)($this->siteA, 'About A');

        $this->get('http://b.test/about')->assertOk()
            ->assertSee('href="/storage/themes/aurora/css/main.css?v=', false)
            ->assertSee('src="/storage/themes/aurora/menu.js?v=', false)
            ->assertSee('data-site-theme="editorial"', false)
            ->assertInertia(fn (Assert $page) => $page->where('theme', 'editorial'));
        $this->get('http://a.test/about')->assertOk()->assertDontSee('/storage/themes/aurora', false);
    } finally {
        File::deleteDirectory(Themes::uploadPath());
        Themes::$uploadRoot = null;
        Themes::flush();
    }
});
