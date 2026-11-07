<?php

use App\Models\CmsArticle;
use App\Models\CmsLang;
use App\Models\CmsPost;
use App\Models\CmsRedirect;
use App\Models\CmsSchema;
use App\Models\CmsSchemaGroup;
use App\Models\CmsSite;
use App\Models\User;
use App\Support\Locales;
use App\Support\Sites;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function (): void {
    $this->es = CmsLang::create(['name' => 'Español', 'iso' => 'es', 'active' => 1]);
    $this->en = CmsLang::create(['name' => 'English', 'iso' => 'en', 'active' => 1]);
    $this->fr = CmsLang::create(['name' => 'Français', 'iso' => 'fr', 'active' => 1]);

    $group = CmsSchemaGroup::create(['name' => 'Default', 'layout' => 'layout', 'default' => 1, 'active' => 1]);
    $this->schema = CmsSchema::create(['group_id' => $group->id, 'name' => 'Page', 'type' => 'PAGE', 'active' => 1, 'fields' => [], 'front_view' => 'front/templates/page']);

    // A Spanish shop that is also in English
    $this->shop = CmsSite::create(['name' => 'Shop', 'domains' => ['shop.test'], 'theme' => 'velvet', 'lang_id' => $this->es->id, 'default' => true, 'active' => true]);
    $this->shop->langs()->attach($this->en->id);
    Sites::flush();

    $this->admin = User::factory()->superAdmin()->create();
    $this->user = User::factory()->superAdmin()->create();

    $this->page = fn (CmsLang $lang, string $title, string $slug, array $extra = []) => Sites::as($this->shop->fresh(), fn () => CmsArticle::create([
        'schema_id' => $this->schema->id,
        'lang_id' => $lang->id,
        'title' => $title,
        'slug' => $slug,
        'active' => 1,
        'metadata' => [],
        ...$extra,
    ]));
    $this->post = fn (CmsLang $lang, string $title, string $slug) => Sites::as($this->shop->fresh(), fn () => CmsPost::create([
        'user_id' => $this->admin->id,
        'lang_id' => $lang->id,
        'post_type' => 'post',
        'title' => $title,
        'slug' => $slug,
        'status' => 'published',
        'published_at' => now()->subDay(),
        'active' => 1,
        'metadata' => [],
    ]));
    $this->link = function (CmsArticle|CmsPost ...$items): void {
        $group = $items[0]->translationGroup();
        foreach ($items as $item) {
            $item->forceFill(['translation_group' => $group])->saveQuietly();
        }
    };
});

it('serves the main language without a prefix and each extra language under its code', function (): void {
    $nosotros = ($this->page)($this->es, 'Nosotros', 'nosotros');
    $about = ($this->page)($this->en, 'About us', 'about');
    ($this->link)($nosotros, $about);

    $this->get('http://shop.test/nosotros')->assertOk()->assertInertia(fn (Assert $page): Assert => $page
        ->where('article.title', 'Nosotros')
        ->where('site.locale', 'es')
        ->where('site.prefix', '')
        ->where('alternates.0', ['iso' => 'es', 'name' => 'Español', 'url' => '/nosotros', 'current' => true, 'missing' => false])
        ->where('alternates.1', ['iso' => 'en', 'name' => 'English', 'url' => '/en/about', 'current' => false, 'missing' => false]));

    $response = $this->get('http://shop.test/en/about')->assertOk()->assertInertia(fn (Assert $page): Assert => $page
        ->where('article.title', 'About us')
        ->where('article.url', '/en/about')
        ->where('site.locale', 'en')
        ->where('site.prefix', '/en')
        ->where('alternates.1.current', true)
        // The browser keeps the address as typed
        ->url('/en/about'));

    $html = $response->getContent();
    expect($html)->toContain('<html lang="en"')
        ->toContain('<link rel="alternate" hreflang="es" href="http://shop.test/nosotros">')
        ->toContain('<link rel="alternate" hreflang="en" href="http://shop.test/en/about">')
        ->toContain('<link rel="alternate" hreflang="x-default" href="http://shop.test/nosotros">');

    // Each page only answers in its own language
    $this->get('http://shop.test/about')->assertNotFound();
    $this->get('http://shop.test/en/nosotros')->assertNotFound();
    // A language the site does not have is not a prefix
    $this->get('http://shop.test/fr/nosotros')->assertNotFound();
    // The main language has no prefix
    $this->get('http://shop.test/es/nosotros?x=1')->assertRedirect('/nosotros?x=1')->assertStatus(301);
});

it('shows the home page, blog and theme texts of the language in the address', function (): void {
    ($this->page)($this->es, 'Inicio', 'home');
    ($this->page)($this->en, 'Home', 'home');
    $hola = ($this->post)($this->es, 'Hola', 'hola');
    $hello = ($this->post)($this->en, 'Hello', 'hola');
    ($this->link)($hola, $hello);

    $this->get('http://shop.test/')->assertOk()->assertInertia(fn (Assert $page): Assert => $page
        ->where('article.title', 'Inicio')
        ->where('texts', fn ($texts): bool => $texts['footer.contact'] === 'Visita la boutique'));
    $this->get('http://shop.test/en')->assertOk()->assertInertia(fn (Assert $page): Assert => $page
        ->where('article.title', 'Home')
        ->where('texts', fn ($texts): bool => $texts['footer.contact'] === 'Visit the boutique')
        ->where('recentPosts.0.title', 'Hello')
        ->where('recentPosts.0.url', '/en/blog/hola'));

    // A post and its translation share the slug, each in its language
    $this->get('http://shop.test/blog/hola')->assertOk()->assertInertia(fn (Assert $page): Assert => $page
        ->where('post.title', 'Hola')
        ->where('alternates.1.url', '/en/blog/hola'));
    $this->get('http://shop.test/en/blog/hola')->assertOk()->assertInertia(fn (Assert $page): Assert => $page->where('post.title', 'Hello'));

    $this->get('http://shop.test/en/blog')->assertOk()->assertInertia(fn (Assert $page): Assert => $page
        ->has('posts.data', 1)
        ->where('posts.data.0.title', 'Hello')
        ->where('posts.path', 'http://shop.test/en/blog'));

    $this->get('http://shop.test/en/search?q=Hel')->assertOk()->assertInertia(fn (Assert $page): Assert => $page
        ->has('results', 1)
        ->where('results.0.url', '/en/blog/hola')
        ->where('alternates.0.url', '/search?q=Hel'));
});

it('points the switcher at the home page of a language the page has no version in', function (): void {
    ($this->page)($this->es, 'Solo en español', 'solo');

    $this->get('http://shop.test/solo')->assertOk()->assertInertia(fn (Assert $page): Assert => $page
        ->where('alternates.1', ['iso' => 'en', 'name' => 'English', 'url' => '/en', 'current' => false, 'missing' => true]));
});

it('lists every language in the sitemap with the versions of each page', function (): void {
    $nosotros = ($this->page)($this->es, 'Nosotros', 'nosotros');
    $about = ($this->page)($this->en, 'About us', 'about');
    ($this->link)($nosotros, $about);

    $xml = $this->get('http://shop.test/sitemap.xml')->assertOk()->getContent();

    expect($xml)->toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"')
        ->toContain('<loc>http://shop.test/nosotros</loc>')
        ->toContain('<loc>http://shop.test/en/about</loc>')
        ->toContain('<loc>http://shop.test/en/blog</loc>')
        ->toContain('<xhtml:link rel="alternate" hreflang="en" href="http://shop.test/en/about"/>');
});

it('leaves a site with a single language as it was', function (): void {
    $this->shop->langs()->detach();
    Sites::flush();
    ($this->page)($this->en, 'About us', 'about');

    // Content saved in any language shows, and nothing is a prefix
    $this->get('http://shop.test/about')->assertOk()->assertInertia(fn (Assert $page): Assert => $page
        ->where('article.url', '/about')
        ->where('alternates', []));
    $this->get('http://shop.test/en/about')->assertNotFound();
});

it('keeps the language prefix in the redirects of a moved page', function (): void {
    $about = ($this->page)($this->en, 'About us', 'about');
    Sites::as($this->shop->fresh(), fn () => $about->update(['slug' => 'about-us']));

    expect(CmsRedirect::withoutGlobalScopes()->pluck('to_path', 'from_path')->all())->toBe(['/en/about' => '/en/about-us']);
    $this->get('http://shop.test/en/about')->assertRedirect('/en/about-us');
});

it('saves the extra languages of a site, never its main one', function (): void {
    $this->actingAs($this->admin)->put('http://shop.test/admin/sites/'.$this->shop->id, [
        'name' => 'Shop',
        'domains' => 'shop.test',
        'theme' => 'velvet',
        'lang_id' => $this->es->id,
        'lang_ids' => [$this->es->id, $this->fr->id],
        'default' => true,
        'active' => true,
    ])->assertRedirect();

    expect($this->shop->langs()->pluck('cms_langs.id')->all())->toBe([$this->fr->id])
        ->and(Locales::extra(Sites::find($this->shop->id))->pluck('iso')->all())->toBe(['fr']);
});

it('edits the language picked in the admin', function (): void {
    ($this->page)($this->es, 'Nosotros', 'nosotros');
    ($this->page)($this->en, 'About us', 'about');

    $this->actingAs($this->admin)->get('http://shop.test/admin/articles')->assertInertia(fn (Assert $page): Assert => $page
        ->has('items', 1)
        ->where('items.0.title', 'Nosotros')
        ->where('site.languages.1.iso', 'en'));

    $this->actingAs($this->admin)->post('http://shop.test/admin/sites/language/'.$this->en->id)->assertRedirect();
    $this->actingAs($this->admin)->get('http://shop.test/admin/articles')->assertInertia(fn (Assert $page): Assert => $page
        ->has('items', 1)
        ->where('items.0.title', 'About us')
        ->where('site.locale', 'en'));
    $this->actingAs($this->admin)->get('http://shop.test/admin/translations')->assertInertia(fn (Assert $page): Assert => $page->where('locale', 'en'));

    // A new page is created in that language
    $this->actingAs($this->admin)->post('http://shop.test/admin/articles', ['title' => 'Contact', 'schema_id' => $this->schema->id])->assertRedirect();
    expect(CmsArticle::withoutGlobalScopes()->where('title', 'Contact')->value('lang_id'))->toBe($this->en->id);

    // A language the site does not have cannot be picked
    $this->actingAs($this->admin)->post('http://shop.test/admin/sites/language/'.$this->fr->id)->assertNotFound();
});

it('starts the version of a page in another language as a draft copy', function (): void {
    $parent = ($this->page)($this->es, 'Servicios', 'servicios');
    $parentEn = ($this->page)($this->en, 'Services', 'services');
    ($this->link)($parent, $parentEn);
    $child = ($this->page)($this->es, 'Baño', 'bano', ['parent_id' => $parent->id, 'content' => '<p>Hola</p>']);

    $this->actingAs($this->admin)->get('http://shop.test/admin/articles/'.$child->id.'/edit')->assertInertia(fn (Assert $page): Assert => $page
        ->where('translations.0', ['id' => $this->es->id, 'iso' => 'es', 'name' => 'Español', 'main' => true, 'current' => true, 'item' => ['id' => $child->id, 'title' => 'Baño', 'status' => 'published']])
        ->where('translations.1.item', null));

    $response = $this->actingAs($this->admin)->post('http://shop.test/admin/articles/'.$child->id.'/translate/'.$this->en->id);
    $version = CmsArticle::withoutGlobalScopes()->where('lang_id', $this->en->id)->where('title', 'Baño')->firstOrFail();
    $response->assertRedirect('/admin/articles/'.$version->id.'/edit');

    expect($version->status)->toBe('draft')
        ->and($version->content)->toBe('<p>Hola</p>')
        ->and($version->parent_id)->toBe($parentEn->id)
        ->and($version->uri)->toBe('services/bano')
        ->and($version->translation_group)->toBe($child->fresh()->translation_group)
        ->and($version->translation_group)->not->toBeNull();

    // Asking again opens the version there is
    $this->actingAs($this->admin)->post('http://shop.test/admin/articles/'.$child->id.'/translate/'.$this->en->id)->assertRedirect('/admin/articles/'.$version->id.'/edit');
    expect(CmsArticle::withoutGlobalScopes()->count())->toBe(4);

    // The editor now works in English
    $this->actingAs($this->admin)->get('http://shop.test/admin/articles/'.$version->id.'/edit')->assertInertia(fn (Assert $page): Assert => $page
        ->where('site.locale', 'en')
        ->where('translations.0.item.id', $child->id)
        ->where('translations.1.current', true));
});

it('starts the version of a post in another language with the same slug', function (): void {
    $hola = ($this->post)($this->es, 'Hola', 'hola');

    $this->actingAs($this->admin)->post('http://shop.test/admin/posts/'.$hola->id.'/translate/'.$this->en->id)->assertRedirect();

    $version = CmsPost::withoutGlobalScopes()->where('lang_id', $this->en->id)->firstOrFail();
    expect($version->slug)->toBe('hola')
        ->and($version->status)->toBe('draft')
        ->and($version->translation_group)->toBe($hola->fresh()->translation_group);

    // Saving the English version keeps it in English, whatever the form sends
    $this->actingAs($this->admin)->put('http://shop.test/admin/posts/'.$version->id, [
        'title' => 'Hello', 'slug' => 'hola', 'status' => 'published', 'user_id' => $this->admin->id, 'lang_id' => $this->es->id,
    ])->assertRedirect();
    expect($version->fresh()->lang_id)->toBe($this->en->id);
});

it('moves the content of each site to its language, as each site held one language until now', function (): void {
    $page = ($this->page)($this->en, 'About us', 'about');
    $clash = ($this->page)($this->en, 'Nosotros (en)', 'nosotros');
    ($this->page)($this->es, 'Nosotros', 'nosotros');
    $post = ($this->post)($this->en, 'Hello', 'hello');

    (require database_path('migrations/2026_11_09_100000_add_site_languages.php'))->down();
    (require database_path('migrations/2026_11_09_100000_add_site_languages.php'))->up();

    expect($page->fresh()->lang_id)->toBe($this->es->id)
        ->and($post->fresh()->lang_id)->toBe($this->es->id)
        // The site already has a Spanish page at that address: this one stays in English
        ->and($clash->fresh()->lang_id)->toBe($this->en->id);
});
