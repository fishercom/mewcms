<?php

use App\Blocks\BlockRegistry;
use App\Models\CmsLang;
use App\Models\CmsPost;
use App\Models\CmsSite;
use App\Models\CmsSlide;
use App\Models\CmsSlider;
use App\Models\User;
use App\Support\Sites;
use App\Support\Themes;

beforeEach(function (): void {
    $this->file = Themes::path('velvet', 'blocks/zz_cards.json');
    @mkdir(dirname($this->file), 0777, true);
    file_put_contents($this->file, json_encode([
        'name' => 'Tarjetas',
        'icon' => 'layout-grid',
        'fields' => [
            ['key' => 'title', 'label' => 'Título', 'type' => 'text'],
            ['key' => 'text', 'label' => 'Texto', 'type' => 'textarea'],
            ['key' => 'video', 'label' => 'Video', 'type' => 'video'],
            ['key' => 'cards', 'label' => 'Tarjetas', 'type' => 'slider'],
            ['key' => 'products', 'label' => 'Productos', 'type' => 'posts', 'post_type' => 'productos'],
            ['key' => 'items', 'label' => 'Ítems', 'type' => 'repeater', 'fields' => [['key' => 'label', 'label' => 'Texto', 'type' => 'text']]],
        ],
    ]));
    // A file that is not a block: a bad name
    file_put_contents(dirname($this->file).'/Bad-Name.json', '{"name": "No"}');
    BlockRegistry::flush();
    $this->lang = CmsLang::create(['name' => 'Español', 'iso' => 'es', 'active' => 1]);
    $this->site = CmsSite::create(['name' => 'B', 'domains' => ['b.test'], 'theme' => 'velvet', 'lang_id' => $this->lang->id, 'active' => true]);
});

afterEach(function (): void {
    @unlink($this->file);
    @unlink(dirname($this->file).'/Bad-Name.json');
    @rmdir(dirname($this->file));
    BlockRegistry::flush();
});

it('offers the blocks of the site\'s theme beside the CMS\'s own', function (): void {
    expect(BlockRegistry::get('zz_cards'))->toBeNull();

    Sites::as($this->site, function (): void {
        $definition = collect(BlockRegistry::definitions())->firstWhere('key', 'zz_cards');
        expect($definition)->not->toBeNull()
            ->and($definition['name'])->toBe('Tarjetas')
            ->and($definition['category'])->toBe('theme')
            ->and(BlockRegistry::get('rich_text'))->not->toBeNull()
            ->and(BlockRegistry::themeBlocks('velvet'))->toHaveKeys(['zz_cards'])->not->toHaveKey('Bad-Name');
    });
});

it('cleans a theme block by its fields and makes its text searchable', function (): void {
    Sites::as($this->site, function (): void {
        $blocks = BlockRegistry::sanitize([['type' => 'zz_cards', 'data' => [
            'title' => '<b>*Nuestra* historia</b>',
            'text' => "Más de 70 años\ncon el mar",
            'video' => 'javascript:alert(1)',
            'cards' => 'historia',
            'products' => ['post_type' => 'productos', 'tag' => 'cocina', 'limit' => '99', 'other' => 'x'],
            'items' => [['label' => 'Uno', 'extra' => 'x']],
            'unknown' => 'dropped',
        ]]]);

        $data = $blocks[0]['data'];
        expect($data)->not->toHaveKey('unknown')
            ->and($data['title'])->toBe('*Nuestra* historia')
            ->and($data['video'])->toBe('')
            ->and($data['products'])->toBe(['post_type' => 'productos', 'tag' => 'cocina', 'limit' => 50])
            ->and($data['items'][0])->toHaveKeys(['_id', 'label'])->not->toHaveKey('extra')
            ->and(BlockRegistry::toHtml($blocks))->toContain('<p>Nuestra historia</p>', 'Más de 70 años<br />', '<p>Uno</p>');
    });
});

it('gives a theme block its slider and its posts on the public page', function (): void {
    Sites::as($this->site, function (): void {
        $slider = CmsSlider::create(['name' => 'Historia', 'key' => 'historia']);
        CmsSlide::create(['slider_id' => $slider->id, 'title' => '1950', 'image_url' => '/storage/a.jpg', 'button_label' => 'Ver', 'active' => true]);
        CmsPost::create(['user_id' => User::factory()->create()->id, 'post_type' => 'productos', 'title' => 'Sal de mesa', 'slug' => 'sal-de-mesa', 'status' => 'published', 'active' => true, 'published_at' => now()->subDay(), 'lang_id' => $this->lang->id]);

        $resolved = BlockRegistry::resolve(BlockRegistry::sanitize([['type' => 'zz_cards', 'data' => [
            'cards' => 'historia',
            'products' => ['post_type' => 'productos'],
        ]]]));

        expect($resolved[0]['data']['_sliders']['cards']['slides'][0])->toMatchArray(['title' => '1950', 'button_label' => 'Ver'])
            ->and($resolved[0]['data']['_posts']['products'][0]['title'])->toBe('Sal de mesa');
    });
});

it('gives the editor a block as the public page shows it, without saving anything', function (): void {
    $slider = Sites::as($this->site, function () {
        $slider = CmsSlider::create(['name' => 'Historia', 'key' => 'historia']);
        CmsSlide::create(['slider_id' => $slider->id, 'title' => '1950', 'image_url' => '/storage/a.jpg', 'active' => true]);

        return $slider;
    });

    $this->actingAs(User::factory()->superAdmin()->create())
        ->withSession([Sites::SESSION_KEY => $this->site->id])
        ->postJson(route('blocks.preview'), ['type' => 'zz_cards', 'data' => ['title' => 'Hola', 'cards' => 'historia']])
        ->assertOk()
        ->assertJsonPath('data.title', 'Hola')
        ->assertJsonPath('data._sliders.cards.slides.0.title', '1950');

    $this->postJson(route('blocks.preview'), ['type' => 'nope', 'data' => []])->assertNotFound();
    expect(CmsSlider::count())->toBe(1)->and($slider->exists)->toBeTrue();
});

it('gives the admin the site\'s stylesheets, so the editor draws blocks as the site does', function (): void {
    $this->actingAs(User::factory()->superAdmin()->create())
        ->withSession([Sites::SESSION_KEY => $this->site->id])
        ->get('/admin/articles')
        ->assertInertia(fn ($page) => $page->where('block_preview.theme', 'velvet')->has('block_preview.styles', fn ($styles) => $styles->etc()));
});
