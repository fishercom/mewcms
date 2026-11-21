<?php

use App\Models\CmsArticle;
use App\Models\CmsConfig;
use App\Models\CmsLang;
use App\Models\CmsPost;
use App\Models\CmsPostType;
use App\Models\CmsSite;
use App\Models\Profile;
use App\Models\User;
use App\Support\ListingPages;
use App\Support\Sites;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

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
    $this->lang = CmsLang::create(['name' => 'Español', 'iso' => 'es', 'active' => true]);
    $this->type = CmsPostType::create(['name' => 'Productos', 'singular_name' => 'Producto', 'slug' => 'productos', 'active' => true]);
    $this->catalog = CmsArticle::create([
        'lang_id' => $this->lang->id, 'title' => 'Nuestros productos', 'slug' => 'nuestros-productos',
        'featured_image' => '/storage/media/banner.jpg', 'excerpt' => 'La calidad', 'active' => true,
    ]);
});

it('saves the listing page of a post type from its form, and follows a new slug', function (): void {
    $this->actingAs($this->user)->put(route('post-types.update', $this->type->id), [
        'name' => 'Productos', 'singular_name' => 'Producto', 'slug' => 'productos', 'active' => true,
        'listing_page_id' => $this->catalog->id,
    ])->assertRedirect();

    expect(ListingPages::id('productos'))->toBe($this->catalog->id);

    $this->actingAs($this->user)->get(route('post-types.edit', $this->type->id))
        ->assertInertia(fn (Assert $page): Assert => $page
            ->where('listingPageId', $this->catalog->id)
            ->where('pages.0.title', 'Nuestros productos'));

    $this->actingAs($this->user)->put(route('post-types.update', $this->type->id), [
        'name' => 'Productos', 'singular_name' => 'Producto', 'slug' => 'catalogo', 'active' => true,
        'listing_page_id' => $this->catalog->id,
    ])->assertRedirect();

    expect(ListingPages::id('catalogo'))->toBe($this->catalog->id)
        ->and(CmsConfig::where('alias', 'listing_page_productos')->exists())->toBeFalse();
});

it('refuses a page that does not exist', function (): void {
    $this->actingAs($this->user)->put(route('post-types.update', $this->type->id), [
        'name' => 'Productos', 'singular_name' => 'Producto', 'slug' => 'productos', 'active' => true,
        'listing_page_id' => 9999,
    ])->assertSessionHasErrors('listing_page_id');
});

it('saves the blog listing page and gives it to the blog posts', function (): void {
    $blog = CmsArticle::create(['lang_id' => $this->lang->id, 'title' => 'Salud y bienestar', 'slug' => 'salud', 'featured_image' => '/storage/media/salud.jpg', 'active' => true]);
    $this->actingAs($this->user)->post(route('post-types.blog_listing'), ['listing_page_id' => $blog->id])->assertRedirect();

    CmsPost::create(['title' => 'Nota', 'slug' => 'nota', 'post_type' => 'post', 'lang_id' => $this->lang->id, 'user_id' => $this->user->id, 'status' => 'published', 'published_at' => now()->subDay()]);

    $this->get('/blog/nota')->assertOk()->assertInertia(fn (Assert $page): Assert => $page
        ->component('front/blog/show')
        ->where('listing.title', 'Salud y bienestar')
        ->where('listing.featured_image', '/storage/media/salud.jpg')
        ->where('listing.url', $blog->url));
});

it('gives a post type entry the banner, title and address of its listing page', function (): void {
    ListingPages::set('productos', $this->catalog->id);
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

it('keeps the choice per site, and has none when nothing was chosen', function (): void {
    ListingPages::set('productos', $this->catalog->id);
    $site = CmsSite::create(['name' => 'Otro', 'domains' => ['otro.test'], 'theme' => 'default', 'active' => true]);

    expect(Sites::as($site, fn () => ListingPages::for('productos')))->toBeNull()
        ->and(ListingPages::for('post'))->toBeNull()
        ->and(ListingPages::for('productos')['title'])->toBe('Nuestros productos');
});
