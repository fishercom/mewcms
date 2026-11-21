<?php

use App\Blocks\BlockRegistry;
use App\Models\CmsArticle;
use App\Models\CmsConfig;
use App\Models\CmsLang;
use App\Models\CmsPost;
use App\Models\CmsPostType;
use App\Models\CmsSchema;
use App\Models\CmsSchemaGroup;
use App\Models\CmsSite;
use App\Models\User;
use App\Support\ListingPages;
use App\Support\Sites;
use App\Support\Themes;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->user = User::factory()->superAdmin()->create();
    $this->lang = CmsLang::create(['name' => 'Español', 'iso' => 'es', 'active' => true]);
    $this->type = CmsPostType::create(['name' => 'Productos', 'singular_name' => 'Producto', 'slug' => 'productos', 'active' => true]);
    $group = CmsSchemaGroup::create(['name' => 'Default', 'layout' => 'layout', 'default' => 1, 'active' => 1]);
    // A template with a "Lista de posts" field
    $this->listSchema = CmsSchema::create(['group_id' => $group->id, 'name' => 'Listado', 'type' => 'PAGE', 'active' => 1, 'front_view' => 'front/templates/page', 'fields' => [
        ['key' => 'list', 'label' => 'Lista', 'type' => 'posts', 'post_type' => 'post'],
    ]]);
    $this->catalog = listingPage('Nuestros productos', 'nuestros-productos', ['list' => ['post_type' => 'productos', 'limit' => 50]], [
        'featured_image' => '/storage/media/banner.jpg', 'excerpt' => 'La calidad',
    ]);
});

function listingPage(string $title, string $slug, array $metadata = [], array $attributes = []): CmsArticle
{
    return CmsArticle::create([
        'schema_id' => test()->listSchema->id, 'lang_id' => test()->lang->id, 'title' => $title, 'slug' => $slug,
        'metadata' => $metadata, 'active' => true, ...$attributes,
    ]);
}

it('finds the listing page from a template field and gives its banner to the entries', function (): void {
    CmsPost::create(['title' => 'Sal de cocina', 'slug' => 'sal', 'post_type' => 'productos', 'lang_id' => $this->lang->id, 'user_id' => $this->user->id, 'status' => 'published', 'published_at' => now()->subDay()]);

    $this->get('/productos/sal')->assertOk()->assertInertia(fn (Assert $page): Assert => $page
        ->where('listing', [
            'id' => $this->catalog->id,
            'title' => 'Nuestros productos',
            'url' => $this->catalog->url,
            'excerpt' => 'La calidad',
            'featured_image' => '/storage/media/banner.jpg',
        ]));

    $this->get('/productos')->assertOk()->assertInertia(fn (Assert $page): Assert => $page->where('listing.title', 'Nuestros productos'));
});

it('takes the field\'s own post type when the page leaves it empty, for the blog', function (): void {
    $blog = listingPage('Salud y bienestar', 'salud', [], ['featured_image' => '/storage/media/salud.jpg']);
    CmsPost::create(['title' => 'Nota', 'slug' => 'nota', 'post_type' => 'post', 'lang_id' => $this->lang->id, 'user_id' => $this->user->id, 'status' => 'published', 'published_at' => now()->subDay()]);

    $this->get('/blog/nota')->assertOk()->assertInertia(fn (Assert $page): Assert => $page
        ->component('front/blog/show')
        ->where('listing.title', 'Salud y bienestar')
        ->where('listing.featured_image', '/storage/media/salud.jpg')
        ->where('listing.url', $blog->url));
});

it('finds a theme block that lists posts, also inside columns', function (): void {
    $file = Themes::path('velvet', 'blocks/zz_catalog.json');
    @mkdir(dirname($file), 0777, true);
    file_put_contents($file, json_encode(['name' => 'Catálogo', 'fields' => [
        ['key' => 'products', 'label' => 'Productos', 'type' => 'posts', 'post_type' => 'productos', 'limit' => 12],
    ]]));
    BlockRegistry::flush();

    try {
        $site = CmsSite::create(['name' => 'B', 'domains' => ['b.test'], 'theme' => 'velvet', 'lang_id' => $this->lang->id, 'active' => true]);
        Sites::as($site, function (): void {
            $page = CmsArticle::create(['lang_id' => $this->lang->id, 'title' => 'Tienda', 'slug' => 'tienda', 'active' => true, 'blocks' => [
                ['type' => 'columns', 'data' => ['layout' => '50-50', 'columns' => [
                    ['blocks' => [['type' => 'zz_catalog', 'data' => ['products' => ['post_type' => 'productos']]]]],
                    ['blocks' => []],
                ]]],
            ]]);

            expect(ListingPages::listedBy($page))->toBe(['productos' => 12])
                ->and(ListingPages::for('productos')['title'])->toBe('Tienda')
                ->and(ListingPages::for('post'))->toBeNull();
        });
    } finally {
        @unlink($file);
        @rmdir(dirname($file));
        BlockRegistry::flush();
    }
});

it('prefers the page that shows the most, and lets the editor pick the main one', function (): void {
    $home = listingPage('Inicio', 'inicio', ['list' => ['post_type' => 'productos', 'limit' => 4]]);
    $about = listingPage('Nosotros', 'nosotros');

    expect(ListingPages::id('productos'))->toBe($this->catalog->id);

    // Only the pages that share a listing get the choice
    $this->actingAs($this->user)->get(route('articles.edit', $home->id))->assertInertia(fn (Assert $page): Assert => $page
        ->where('listingChoices', [['type' => 'productos', 'name' => 'Productos', 'main' => false]]));
    $this->actingAs($this->user)->get(route('articles.edit', $about->id))->assertInertia(fn (Assert $page): Assert => $page
        ->where('listingChoices', []));

    $this->actingAs($this->user)->post(route('articles.listing', $home->id), ['type' => 'productos'])->assertRedirect();
    expect(ListingPages::id('productos'))->toBe($home->id);

    $this->actingAs($this->user)->get(route('articles.edit', $this->catalog->id))->assertInertia(fn (Assert $page): Assert => $page
        ->where('listingChoices.0.main', false));

    // A page that does not list that kind of entry cannot be its main listing
    $this->actingAs($this->user)->post(route('articles.listing', $about->id), ['type' => 'productos'])->assertStatus(422);
});

it('keeps the choice when the post type changes its slug, and shows the page in Tipos de contenido', function (): void {
    ListingPages::choose('productos', $this->catalog->id);

    $this->actingAs($this->user)->get(route('post-types.index'))->assertInertia(fn (Assert $page): Assert => $page
        ->where('listings.productos', ['id' => $this->catalog->id, 'title' => 'Nuestros productos'])
        ->missing('listings.post'));

    $this->actingAs($this->user)->put(route('post-types.update', $this->type->id), [
        'name' => 'Productos', 'singular_name' => 'Producto', 'slug' => 'catalogo', 'active' => true,
    ])->assertRedirect();

    expect(CmsConfig::where('alias', 'listing_page_catalogo')->exists())->toBeTrue()
        ->and(CmsConfig::where('alias', 'listing_page_productos')->exists())->toBeFalse();
});

it('looks for the listing among the pages of each site', function (): void {
    $site = CmsSite::create(['name' => 'Otro', 'domains' => ['otro.test'], 'theme' => 'default', 'active' => true]);

    expect(Sites::as($site, fn () => ListingPages::for('productos')))->toBeNull()
        ->and(ListingPages::for('productos')['title'])->toBe('Nuestros productos');
});

it('keeps the choice away from a profile that cannot manage pages', function (): void {
    $this->actingAs(User::factory()->create())->post(route('articles.listing', $this->catalog->id), ['type' => 'productos'])->assertForbidden();
});
