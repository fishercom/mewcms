<?php

use App\Models\CmsArticle;
use App\Models\CmsForm;
use App\Models\CmsLang;
use App\Models\CmsMedia;
use App\Models\CmsMenu;
use App\Models\CmsPost;
use App\Models\CmsSchemaGroup;
use App\Models\CmsSite;
use App\Models\CmsTag;
use App\Models\Profile;
use App\Models\User;
use App\Support\Sites;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function (): void {
    Storage::fake('public');
    Storage::fake('local');

    // Every "Unsplash photo" is the same small JPEG
    $image = imagecreatetruecolor(40, 30);
    ob_start();
    imagejpeg($image);
    $jpeg = ob_get_clean();
    Http::fake(['images.unsplash.com/*' => Http::response($jpeg, 200, ['Content-Type' => 'image/jpeg'])]);

    $profile = Profile::create(['name' => 'Super Admin', 'sa' => 1, 'active' => 1]);
    User::create(['username' => 'admin', 'name' => 'Admin', 'email' => 'admin@test.com', 'password' => bcrypt('password'), 'profile_id' => $profile->id, 'active' => 1]);
    CmsLang::create(['name' => 'Español', 'iso' => 'es', 'active' => 1]);
    $this->english = CmsLang::create(['name' => 'English', 'iso' => 'en', 'active' => 1]);
    CmsSchemaGroup::create(['name' => 'Default', 'layout' => 'front', 'default' => 1, 'active' => 1]);

    $this->shop = CmsSite::create(['name' => 'Main', 'domains' => ['old.test'], 'theme' => 'default', 'default' => true, 'active' => true]);
    $this->journal = CmsSite::create(['name' => 'Blog', 'domains' => ['old-blog.test'], 'theme' => 'editorial', 'active' => true]);

    // Old content that must go
    Sites::as($this->shop, fn () => CmsArticle::create(['lang_id' => $this->english->id, 'title' => 'Old page', 'slug' => 'old', 'active' => 1, 'metadata' => []]));
    Storage::disk('public')->put('photos/1/old.png', 'x');
});

it('replaces the content with the demo pet shop and pet care journal', function (): void {
    $this->artisan('cms:demo-sites', ['--force' => true, '--shop-url' => 'http://shop.test', '--blog-url' => 'http://journal.test'])
        ->assertSuccessful();

    expect(CmsArticle::withoutGlobalScopes()->withTrashed()->where('title', 'Old page')->exists())->toBeFalse();
    Storage::disk('public')->assertMissing('photos/1/old.png');

    $shop = $this->shop->fresh();
    $journal = $this->journal->fresh();
    expect($shop->theme)->toBe('velvet')
        ->and($shop->domains)->toBe(['shop.test'])
        ->and($shop->lang_id)->toBe($this->english->id)
        ->and($journal->theme)->toBe('journal')
        ->and($journal->title)->toBe('Velvet Paw Journal');

    // Content per site
    expect(CmsArticle::withoutGlobalScopes()->where('site_id', $shop->id)->count())->toBe(6)
        ->and(CmsArticle::withoutGlobalScopes()->where('site_id', $journal->id)->count())->toBe(3)
        ->and(CmsPost::withoutGlobalScopes()->where('site_id', $journal->id)->count())->toBeGreaterThanOrEqual(6)
        ->and(CmsMenu::withoutGlobalScopes()->count())->toBe(4)
        ->and(CmsForm::withoutGlobalScopes()->where('site_id', $shop->id)->where('alias', 'contact')->exists())->toBeTrue()
        ->and(CmsTag::count())->toBe(8);

    // Photos are in the media library, with their WebP versions
    $media = CmsMedia::first();
    expect(CmsMedia::count())->toBeGreaterThan(30)
        ->and($media->alt)->not->toBeEmpty()
        ->and($media->variants)->not->toBeEmpty();
    Storage::disk('public')->assertExists($media->path);

    // Each domain shows its own site with its own theme
    $this->get('http://shop.test/')->assertOk()->assertInertia(fn (Assert $page) => $page
        ->component('front/templates/home')
        ->where('theme', 'velvet')
        ->where('article.metadata.hero_image', fn (string $url) => str_starts_with($url, '/storage/media/'))
        ->where('article.metadata.journal_items.0.url', fn (string $url) => str_starts_with($url, 'http://journal.test/blog/')));
    $this->get('http://shop.test/contact')->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('article.metadata.form_alias', 'contact'));
    $this->getJson('http://shop.test/api/forms/contact')->assertOk()->assertJsonCount(4, 'fields');

    $this->get('http://journal.test/')->assertOk()->assertInertia(fn (Assert $page) => $page
        ->where('theme', 'journal')
        ->has('recentPosts', 7));
    $this->get('http://journal.test/blog/first-week-home-new-puppy')->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('front/blog/show')->where('post.metadata.author', 'Elena Marsh, puppy trainer'));
    $this->get('http://journal.test/tag/cats')->assertOk();

    // A second run starts again from scratch, with the photos kept from the first one
    Http::fake(fn () => throw new RuntimeException('No download expected'));
    $this->artisan('cms:demo-sites', ['--force' => true, '--shop-url' => 'http://shop.test', '--blog-url' => 'http://journal.test'])
        ->assertSuccessful();
    expect(CmsArticle::withoutGlobalScopes()->count())->toBe(9);
});

it('uses the port-less local addresses by default', function (): void {
    config(['app.url' => 'http://127.0.0.1:8000']);

    $this->artisan('cms:demo-sites', ['--force' => true])->assertSuccessful();

    expect($this->shop->fresh()->site_url)->toBe('http://mewcms.localhost')
        ->and($this->shop->fresh()->domains)->toBe(['mewcms.localhost'])
        ->and($this->journal->fresh()->site_url)->toBe('http://blog.localhost')
        ->and($this->journal->fresh()->domains)->toBe(['blog.localhost']);
});
