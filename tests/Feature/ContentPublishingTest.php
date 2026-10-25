<?php

use App\Models\AdmLog;
use App\Models\CmsArticle;
use App\Models\CmsLang;
use App\Models\CmsMenu;
use App\Models\CmsMenuItem;
use App\Models\CmsPost;
use App\Models\CmsSchema;
use App\Models\CmsSchemaGroup;
use App\Models\CmsTag;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $group = CmsSchemaGroup::create(['name' => 'Default Group', 'layout' => 'layout', 'default' => 1, 'active' => 1]);
    $this->lang = CmsLang::create(['name' => 'Español', 'iso' => 'es', 'active' => 1]);
    $this->schema = CmsSchema::create([
        'group_id' => $group->id,
        'name' => 'Page Schema',
        'type' => 'PAGE',
        'active' => 1,
        'fields' => [],
        'front_view' => 'front/templates/page',
    ]);
    $this->admin = User::factory()->superAdmin()->create();
});

function makePage(array $attributes = []): CmsArticle
{
    return CmsArticle::create([
        'schema_id' => test()->schema->id,
        'lang_id' => test()->lang->id,
        'title' => 'Page',
        'active' => 1,
        'metadata' => ['body' => 'Contenido'],
        ...$attributes,
    ]);
}

function makePost(array $attributes = []): CmsPost
{
    return CmsPost::create([
        'user_id' => test()->admin->id,
        'lang_id' => test()->lang->id,
        'post_type' => 'post',
        'title' => 'Post',
        'status' => 'published',
        'published_at' => now()->subDay(),
        'active' => true,
        ...$attributes,
    ]);
}

it('hides draft pages from the page route, navigation, sitemap and search', function (): void {
    makePage(['title' => 'Visible', 'slug' => 'visible']);
    makePage(['title' => 'Secret Draft', 'slug' => 'secret-draft', 'status' => 'draft']);

    $this->get('/secret-draft')->assertNotFound();
    $this->get('/visible')->assertOk()->assertInertia(fn (Assert $page): Assert => $page
        ->has('navigation', 1)
        ->where('navigation.0.slug', 'visible')
    );
    $this->get('/sitemap.xml')->assertDontSee('secret-draft');
    $this->get('/search?q=Secret')->assertInertia(fn (Assert $page): Assert => $page->has('results', 0));
});

it('publishes a scheduled page once its date passes, even with the front cache warm', function (): void {
    makePage(['title' => 'Home', 'slug' => 'home']);
    makePage(['title' => 'Launch', 'slug' => 'launch', 'published_at' => now()->addMinutes(10)]);

    $this->get('/launch')->assertNotFound();
    $this->get('/sitemap.xml')->assertDontSee('/launch');
    $this->get('/home')->assertInertia(fn (Assert $page): Assert => $page->has('navigation', 1));

    $this->travel(11)->minutes();

    $this->get('/launch')->assertOk();
    $this->get('/sitemap.xml')->assertSee('/launch');
    $this->get('/home')->assertInertia(fn (Assert $page): Assert => $page->has('navigation', 2));
});

it('hides draft and scheduled posts until they are published', function (): void {
    makePost(['title' => 'Old News', 'slug' => 'old-news']);
    makePost(['title' => 'Draft Post', 'slug' => 'draft-post', 'status' => 'draft']);
    makePost(['title' => 'Future Post', 'slug' => 'future-post', 'published_at' => now()->addHour()]);

    $this->get('/blog/old-news')->assertOk();
    $this->get('/blog/draft-post')->assertNotFound();
    $this->get('/blog/future-post')->assertNotFound();
    $this->get('/blog')->assertInertia(fn (Assert $page): Assert => $page->has('posts.data', 1));
    $this->get('/search?q=Future')->assertInertia(fn (Assert $page): Assert => $page->has('results', 0));
    $this->get('/sitemap.xml')->assertDontSee('future-post')->assertDontSee('draft-post');

    $this->travel(2)->hours();

    $this->get('/blog/future-post')->assertOk();
    $this->get('/sitemap.xml')->assertSee('future-post');
});

it('hides menu items that point to unpublished pages', function (): void {
    makePage(['title' => 'Home', 'slug' => 'home']);
    $draft = makePage(['title' => 'Hidden', 'slug' => 'hidden', 'status' => 'draft']);
    $menu = CmsMenu::create(['name' => 'Header', 'slug' => 'header', 'active' => 1]);
    CmsMenuItem::create(['menu_id' => $menu->id, 'title' => 'Hidden', 'article_id' => $draft->id, 'active' => 1, 'position' => 0]);
    CmsMenuItem::create(['menu_id' => $menu->id, 'title' => 'External', 'url' => 'https://example.com', 'active' => 1, 'position' => 1]);

    $this->get('/home')->assertInertia(fn (Assert $page): Assert => $page
        ->has('menus.0.items', 1)
        ->where('menus.0.items.0.title', 'External')
    );
});

it('shows a scheduled badge flag in the admin list', function (): void {
    makePage(['title' => 'Soon', 'slug' => 'soon', 'published_at' => now()->addDay()]);

    $this->actingAs($this->admin)->get('/admin/articles')->assertInertia(fn (Assert $page): Assert => $page
        ->where('paging.data.0.is_scheduled', true)
    );
});

it('moves deleted pages to the trash and restores them', function (): void {
    $page = makePage(['title' => 'Temp', 'slug' => 'temp']);

    $this->actingAs($this->admin)->delete("/admin/articles/{$page->id}")->assertRedirect();

    expect(CmsArticle::find($page->id))->toBeNull()
        ->and(CmsArticle::withTrashed()->find($page->id)->trashed())->toBeTrue();
    $this->get('/temp')->assertNotFound();

    $this->actingAs($this->admin)->get('/admin/articles?trash=1')->assertInertia(fn (Assert $page): Assert => $page
        ->has('paging.data', 1)
        ->where('trashCount', 1)
    );

    $this->actingAs($this->admin)->post('/admin/articles/bulk', ['action' => 'restore', 'ids' => [$page->id]])->assertRedirect();
    $this->get('/temp')->assertOk();
});

it('permanently deletes trashed posts', function (): void {
    $post = makePost(['slug' => 'gone']);
    $post->delete();

    $this->actingAs($this->admin)->post('/admin/posts/bulk', ['action' => 'force_delete', 'ids' => [$post->id]])->assertRedirect();

    expect(CmsPost::withTrashed()->find($post->id))->toBeNull();
});

it('keeps the slug of a trashed page reserved', function (): void {
    $page = makePage(['title' => 'About']);
    $page->delete();

    $copy = makePage(['title' => 'About']);

    expect($copy->slug)->not->toBe($page->slug);
});

it('refuses to trash a page that still has subpages', function (): void {
    $parent = makePage(['title' => 'Parent', 'slug' => 'parent']);
    $child = makePage(['title' => 'Child', 'parent_id' => $parent->id]);

    $this->actingAs($this->admin)->delete("/admin/articles/{$parent->id}")->assertSessionHasErrors('ids');
    expect($parent->fresh()->trashed())->toBeFalse();

    // Selecting the subpages too is fine
    $this->actingAs($this->admin)
        ->post('/admin/articles/bulk', ['action' => 'trash', 'ids' => [$parent->id, $child->id]])
        ->assertSessionHasNoErrors();
    expect(CmsArticle::count())->toBe(0);

    // A subpage only comes back after its parent
    $this->actingAs($this->admin)->post('/admin/articles/bulk', ['action' => 'restore', 'ids' => [$child->id]])->assertSessionHasErrors('ids');
});

it('applies bulk publish and draft actions and logs them', function (): void {
    $a = makePost(['title' => 'A', 'status' => 'draft']);
    $b = makePost(['title' => 'B', 'status' => 'draft']);
    grantPermissions($this->admin, ['posts' => 'administrar']);

    $this->actingAs($this->admin)->post('/admin/posts/bulk', ['action' => 'publish', 'ids' => [$a->id, $b->id]])->assertRedirect();

    expect($a->fresh()->status)->toBe('published')
        ->and($b->fresh()->status)->toBe('published')
        ->and(AdmLog::where('comment', 'like', 'Publicado en %')->exists())->toBeTrue();

    $this->actingAs($this->admin)->post('/admin/posts/bulk', ['action' => 'draft', 'ids' => [$a->id]])->assertRedirect();
    expect($a->fresh()->status)->toBe('draft');
});

it('validates bulk actions', function (): void {
    $this->actingAs($this->admin)->post('/admin/posts/bulk', ['action' => 'explode', 'ids' => [1]])->assertSessionHasErrors('action');
    $this->actingAs($this->admin)->post('/admin/posts/bulk', ['action' => 'publish', 'ids' => []])->assertSessionHasErrors('ids');
    $this->actingAs($this->admin)->post('/admin/posts/bulk', ['action' => 'publish', 'ids' => [999]])->assertSessionHasErrors('ids');
});

it('requires the manage permission for bulk actions', function (): void {
    $post = makePost(['status' => 'draft']);
    $user = User::factory()->create();
    grantPermissions($user, ['posts' => 'listar', 'articles' => 'listar']);

    $this->actingAs($user)->post('/admin/posts/bulk', ['action' => 'publish', 'ids' => [$post->id]])->assertForbidden();
    $this->actingAs($user)->post('/admin/articles/bulk', ['action' => 'trash', 'ids' => [1]])->assertForbidden();
    expect($post->fresh()->status)->toBe('draft');
});

it('returns 404 when deleting a record that does not exist', function (string $resource): void {
    $this->actingAs($this->admin)->delete("/admin/{$resource}/999999")->assertNotFound();
})->with(['articles', 'posts', 'configs', 'langs', 'notifies', 'parameters', 'sites', 'translates', 'tags']);

it('serves tag archives at /tag/{slug} and redirects legacy /category/{slug} URLs', function (): void {
    $tag = CmsTag::create(['name' => 'Viajes', 'slug' => 'viajes', 'active' => 1]);
    makePage(['title' => 'Cusco', 'slug' => 'cusco'])->tags()->attach($tag->id);
    makePage(['title' => 'Draft Trip', 'slug' => 'draft-trip', 'status' => 'draft'])->tags()->attach($tag->id);

    $this->get('/tag/viajes')->assertOk()->assertInertia(fn (Assert $page): Assert => $page
        ->component('front/tag')
        ->where('tag.slug', 'viajes')
        ->has('items', 1)
        ->where('items.0.title', 'Cusco')
    );
    $this->get('/tag/nope')->assertNotFound();
    $this->get('/sitemap.xml')->assertSee('/tag/viajes');

    $this->get('/category/viajes')->assertRedirect('/tag/viajes');
});

it('lets a page take precedence over legacy taxonomy archive redirect', function (): void {
    CmsTag::create(['name' => 'Web', 'slug' => 'web', 'active' => 1]);
    makePage(['title' => 'Web', 'slug' => 'servicios_web']);

    $this->get('/servicios/web')->assertOk()->assertInertia(fn (Assert $page): Assert => $page
        ->component('front/templates/page')
        ->where('article.slug', 'servicios_web')
    );
});
