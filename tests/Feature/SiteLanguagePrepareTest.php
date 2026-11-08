<?php

use App\Ai\AiManager;
use App\Ai\ContentTranslator;
use App\Models\CmsArticle;
use App\Models\CmsLang;
use App\Models\CmsMenu;
use App\Models\CmsMenuItem;
use App\Models\CmsPost;
use App\Models\CmsSchema;
use App\Models\CmsSchemaGroup;
use App\Models\CmsSite;
use App\Models\CmsTranslation;
use App\Models\User;
use App\Support\MenuCopier;
use App\Support\Sites;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Fakes\FakeAiProvider;

/**
 * A fake model that "translates" every text it gets by putting $prefix in front.
 */
function prefixingAi(string $prefix = 'EN '): FakeAiProvider
{
    config(['ai.model' => 'claude-opus-5-5', 'ai.fast_model' => 'claude-haiku-5-5', 'ai.key' => 'test-key', 'ai.base_url' => null]);
    $fake = new FakeAiProvider(function (string $prompt): array {
        preg_match('/<texts>\n(.*)\n<\/texts>/s', $prompt, $match);
        $rows = json_decode($match[1] ?? '[]', true) ?: [];

        return ['translations' => array_map(function (array $row) use ($prompt): array {
            $prefix = str_contains($prompt, 'into French') ? 'FR ' : 'EN ';
            $id = isset($row['path']) ? ['path' => $row['path']] : ['key' => $row['key']];

            return [...$id, 'text' => $prefix.$row['text']];
        }, $rows)];
    });
    app(AiManager::class)->fake($fake);

    return $fake;
}

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

    $this->page = fn (CmsLang $lang, string $title, string $slug, array $extra = []) => Sites::as($this->shop->fresh(), fn () => CmsArticle::create([
        'schema_id' => $this->schema->id,
        'lang_id' => $lang->id,
        'title' => $title,
        'slug' => $slug,
        'active' => 1,
        'metadata' => [],
        ...$extra,
    ]));
    $this->menu = fn (CmsLang $lang, string $slug = 'header') => Sites::as($this->shop->fresh(), fn () => CmsMenu::create(['name' => 'Header', 'slug' => $slug, 'lang_id' => $lang->id, 'active' => 1]));
});

it('shows the main language menu in an extra language, with links to the translated pages', function (): void {
    $nosotros = ($this->page)($this->es, 'Nosotros', 'nosotros');
    $about = ($this->page)($this->en, 'About us', 'about');
    $about->forceFill(['translation_group' => $nosotros->translationGroup()])->saveQuietly();
    $menu = ($this->menu)($this->es);
    CmsMenuItem::create(['menu_id' => $menu->id, 'title' => 'Nosotros', 'article_id' => $nosotros->id, 'active' => 1, 'position' => 0]);
    CmsMenuItem::create(['menu_id' => $menu->id, 'title' => 'Ofertas', 'url' => '/ofertas', 'active' => 1, 'position' => 1]);

    $this->get('http://shop.test/en/about')->assertOk()->assertInertia(fn (Assert $page): Assert => $page
        ->has('menus', 1)
        ->where('menus.0.items.0.title', 'About us')
        ->where('menus.0.items.0.resolved_url', '/en/about')
        ->where('menus.0.items.1.title', 'Ofertas'));

    // Its own copy, with its own labels, wins
    $copy = Sites::as($this->shop->fresh(), fn () => MenuCopier::copy($menu, $this->en, fn (array $labels): array => ['Ofertas' => 'Deals']));
    expect($copy->lang_id)->toBe($this->en->id)
        ->and($copy->slug)->toBe('header')
        ->and($copy->items()->orderBy('position')->pluck('title')->all())->toBe(['About us', 'Deals'])
        ->and($copy->items()->orderBy('position')->value('article_id'))->toBe($about->id);

    $this->get('http://shop.test/en/about')->assertInertia(fn (Assert $page): Assert => $page
        ->has('menus', 1)
        ->where('menus.0.items.1.title', 'Deals'));
    $this->get('http://shop.test/nosotros')->assertInertia(fn (Assert $page): Assert => $page
        ->where('menus.0.items.0.title', 'Nosotros')
        ->where('menus.0.items.1.title', 'Ofertas'));

    // The admin lists the menus of the language it edits
    $this->actingAs($this->admin)->get('http://shop.test/admin/menus')->assertInertia(fn (Assert $page): Assert => $page
        ->has('items.data', 1)
        ->where('items.data.0.id', $menu->id));
    $this->actingAs($this->admin)->post('http://shop.test/admin/sites/language/'.$this->en->id);
    $this->actingAs($this->admin)->get('http://shop.test/admin/menus')->assertInertia(fn (Assert $page): Assert => $page
        ->has('items.data', 1)
        ->where('items.data.0.id', $copy->id)
        ->where('missing', []));
});

it('copies a menu into the language the admin edits', function (): void {
    $menu = ($this->menu)($this->es);
    CmsMenuItem::create(['menu_id' => $menu->id, 'title' => 'Inicio', 'url' => '/', 'active' => 1, 'position' => 0]);

    $this->actingAs($this->admin)->post('http://shop.test/admin/sites/language/'.$this->en->id);
    $this->actingAs($this->admin)->get('http://shop.test/admin/menus')->assertInertia(fn (Assert $page): Assert => $page
        ->has('items.data', 0)
        ->where('missing.0.id', $menu->id));

    $this->actingAs($this->admin)->post('http://shop.test/admin/menus/'.$menu->id.'/translate')->assertRedirect();
    $this->actingAs($this->admin)->post('http://shop.test/admin/menus/'.$menu->id.'/translate')->assertRedirect();

    expect(CmsMenu::withoutGlobalScopes()->where('lang_id', $this->en->id)->count())->toBe(1);
});

it('translates the texts of a page and keeps the rest', function (): void {
    $fake = prefixingAi();
    $page = ($this->page)($this->es, 'Nuestra historia', 'nuestra-historia', [
        'excerpt' => 'Desde 1990',
        'content' => '<p>Hola <a href="/contacto">equipo</a></p>',
        'metadata' => ['seo_title' => 'Historia', 'hero_image' => '/img/a.jpg'],
    ]);

    $attributes = Sites::as($this->shop->fresh(), fn () => app(ContentTranslator::class)->translate($page, 'Spanish', 'English', $this->admin));

    expect($attributes['title'])->toBe('EN Nuestra historia')
        ->and($attributes['excerpt'])->toBe('EN Desde 1990')
        ->and($attributes['content'])->toBe('EN <p>Hola <a href="/contacto">equipo</a></p>')
        ->and($attributes['metadata'])->toBe(['seo_title' => 'EN Historia', 'hero_image' => '/img/a.jpg'])
        ->and($attributes['slug'])->toBe('en-nuestra-historia')
        ->and($fake->calls)->toHaveCount(1)
        ->and($fake->calls[0]['prompt'])->toContain('from Spanish into English');
});

it('offers to prepare a language as soon as it is added to the site', function (): void {
    ($this->page)($this->es, 'Inicio', 'home');

    $this->actingAs($this->admin)->put('http://shop.test/admin/sites/'.$this->shop->id, [
        'name' => 'Shop',
        'domains' => 'shop.test',
        'theme' => 'velvet',
        'lang_id' => $this->es->id,
        'lang_ids' => [$this->en->id, $this->fr->id],
        'default' => true,
        'active' => true,
    ])->assertRedirect(route('sites.languages.show', [$this->shop->id, $this->fr->id]));

    $this->actingAs($this->admin)->get('http://shop.test/admin/sites/'.$this->shop->id.'/languages/'.$this->fr->id)->assertOk()
        ->assertInertia(fn (Assert $page): Assert => $page
            ->component('admin/sites/language')
            ->where('target.iso', 'fr')
            ->where('summary.pages', 1)
            ->where('tasks.0.type', 'page'));

    // Saving again with nothing new goes back to the list
    $this->actingAs($this->admin)->put('http://shop.test/admin/sites/'.$this->shop->id, [
        'name' => 'Shop', 'domains' => 'shop.test', 'theme' => 'velvet', 'lang_id' => $this->es->id,
        'lang_ids' => [$this->en->id, $this->fr->id], 'default' => true, 'active' => true,
    ])->assertRedirect('/admin/sites');

    // The main language is not "prepared"
    $this->actingAs($this->admin)->get('http://shop.test/admin/sites/'.$this->shop->id.'/languages/'.$this->es->id)->assertNotFound();
});

it('builds a language from the main one with the AI, step by step, then publishes it', function (): void {
    prefixingAi();
    $home = ($this->page)($this->es, 'Inicio', 'home', ['content' => '<p>Mira <a href="/servicios/bano">el baño</a></p>']);
    $servicios = ($this->page)($this->es, 'Servicios', 'servicios');
    $bano = ($this->page)($this->es, 'Baño', 'bano', ['parent_id' => $servicios->id]);
    $draft = ($this->page)($this->es, 'Borrador', 'borrador', ['status' => 'draft']);
    $post = Sites::as($this->shop->fresh(), fn () => CmsPost::create([
        'user_id' => $this->admin->id, 'lang_id' => $this->es->id, 'post_type' => 'post', 'title' => 'Hola', 'slug' => 'hola',
        'status' => 'published', 'published_at' => now()->subDay(), 'active' => 1, 'metadata' => [],
    ]));
    $menu = ($this->menu)($this->es);
    CmsMenuItem::create(['menu_id' => $menu->id, 'title' => 'Servicios', 'article_id' => $servicios->id, 'active' => 1, 'position' => 0]);
    CmsMenuItem::create(['menu_id' => $menu->id, 'title' => 'Ofertas', 'url' => '/ofertas', 'active' => 1, 'position' => 1]);
    // An English page that is already there is left alone
    $about = ($this->page)($this->en, 'About', 'about');

    $tasks = null;
    $this->actingAs($this->admin)->get('http://shop.test/admin/sites/'.$this->shop->id.'/languages/'.$this->en->id)
        ->assertInertia(function (Assert $page) use (&$tasks): Assert {
            $tasks = $page->toArray()['props']['tasks'];

            return $page->where('summary.pages', 4)->where('summary.posts', 1)->where('summary.menus', 1)->where('ai.available', true);
        });

    // Parents before their children, then posts, menus, theme texts and the links last
    $types = array_column($tasks, 'type');
    expect(array_slice($types, 0, 6))->toBe(['page', 'page', 'page', 'page', 'post', 'menu'])
        ->and(end($types))->toBe('links')
        ->and(array_search($bano->id, array_column($tasks, 'id')))->toBeGreaterThan(array_search($servicios->id, array_column($tasks, 'id')));

    foreach ($tasks as $task) {
        $this->actingAs($this->admin)->postJson('http://shop.test/admin/sites/'.$this->shop->id.'/languages/'.$this->en->id.'/step', [...$task, 'ai' => true])->assertOk();
    }

    $en = fn (string $class) => $class::withoutGlobalScopes()->where('lang_id', $this->en->id);
    $banoEn = $en(CmsArticle::class)->where('translation_group', $bano->fresh()->translation_group)->firstOrFail();
    $serviciosEn = $en(CmsArticle::class)->where('translation_group', $servicios->fresh()->translation_group)->firstOrFail();
    $homeEn = $en(CmsArticle::class)->where('translation_group', $home->fresh()->translation_group)->firstOrFail();

    expect($banoEn->title)->toBe('EN Baño')
        ->and($banoEn->status)->toBe('draft')
        ->and($banoEn->parent_id)->toBe($serviciosEn->id)
        ->and($banoEn->uri)->toBe('en-servicios/en-bano')
        ->and($homeEn->slug)->toBe('home')
        // The link now points at the English version
        ->and($homeEn->content)->toContain('href="/en/en-servicios/en-bano"')
        ->and($en(CmsPost::class)->value('title'))->toBe('EN Hola')
        ->and($en(CmsArticle::class)->count())->toBe(5)
        ->and($about->fresh()->title)->toBe('About');

    $menuEn = CmsMenu::withoutGlobalScopes()->where('lang_id', $this->en->id)->firstOrFail();
    expect($menuEn->items()->orderBy('position')->pluck('title')->all())->toBe(['EN Servicios', 'EN Ofertas'])
        ->and($menuEn->items()->orderBy('position')->value('article_id'))->toBe($serviciosEn->id);

    // Running a step again does nothing new
    $this->actingAs($this->admin)->postJson('http://shop.test/admin/sites/'.$this->shop->id.'/languages/'.$this->en->id.'/step', ['type' => 'page', 'id' => $bano->id, 'ai' => true])->assertOk();
    expect($en(CmsArticle::class)->count())->toBe(5);

    // Nothing left to do; the drafts of published pages are listed for review
    $this->actingAs($this->admin)->get('http://shop.test/admin/sites/'.$this->shop->id.'/languages/'.$this->en->id)
        ->assertInertia(fn (Assert $page): Assert => $page
            ->where('summary.pages', 0)
            ->has('tasks', 1)
            ->has('drafts', 4));

    $this->actingAs($this->admin)->post('http://shop.test/admin/sites/'.$this->shop->id.'/languages/'.$this->en->id.'/publish')->assertRedirect();
    expect($banoEn->fresh()->status)->toBe('published')
        ->and($en(CmsArticle::class)->where('translation_group', $draft->fresh()->translation_group)->value('status'))->toBe('draft');

    $this->get('http://shop.test/en/en-servicios/en-bano')->assertOk();
});

it('translates the theme texts a language lacks', function (): void {
    prefixingAi();
    $this->shop->langs()->attach($this->fr->id);
    Sites::flush();

    $this->actingAs($this->admin)->get('http://shop.test/admin/sites/'.$this->shop->id.'/languages/'.$this->fr->id)
        ->assertInertia(fn (Assert $page): Assert => $page->where('summary.texts', fn ($count): bool => $count > 0));

    $this->actingAs($this->admin)->postJson('http://shop.test/admin/sites/'.$this->shop->id.'/languages/'.$this->fr->id.'/step', ['type' => 'texts', 'ai' => true])->assertOk();

    $saved = CmsTranslation::withoutGlobalScopes()->where('locale', 'fr')->get();
    expect($saved)->not->toBeEmpty()
        ->and($saved->first()->value)->toStartWith('FR ')
        ->and($saved->first()->site_id)->toBe($this->shop->id);
});

it('copies without the AI, and refuses the AI to users without it', function (): void {
    ($this->page)($this->es, 'Servicios', 'servicios');
    $editor = User::factory()->create();
    grantPermissions($editor, ['sites' => 'administrar']);

    $this->actingAs($editor)->get('http://shop.test/admin/sites/'.$this->shop->id.'/languages/'.$this->en->id)
        ->assertInertia(fn (Assert $page): Assert => $page->where('ai', null));
    $this->actingAs($editor)->postJson('http://shop.test/admin/sites/'.$this->shop->id.'/languages/'.$this->en->id.'/step', ['type' => 'texts', 'ai' => true])->assertForbidden();

    $page = CmsArticle::withoutGlobalScopes()->where('title', 'Servicios')->firstOrFail();
    $this->actingAs($editor)->postJson('http://shop.test/admin/sites/'.$this->shop->id.'/languages/'.$this->en->id.'/step', ['type' => 'page', 'id' => $page->id, 'ai' => false])->assertOk();

    $version = CmsArticle::withoutGlobalScopes()->where('lang_id', $this->en->id)->firstOrFail();
    expect($version->title)->toBe('Servicios')
        ->and($version->status)->toBe('draft');
});
