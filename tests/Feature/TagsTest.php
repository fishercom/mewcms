<?php

use App\Models\AdmLog;
use App\Models\CmsArticle;
use App\Models\CmsLang;
use App\Models\CmsPost;
use App\Models\CmsTag;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->lang = CmsLang::create(['name' => 'Español', 'iso' => 'es', 'active' => true]);
    $this->admin = User::factory()->superAdmin()->create();
});

function tagPage(array $attributes = []): CmsArticle
{
    return CmsArticle::create(['lang_id' => test()->lang->id, 'title' => 'Page', 'active' => true, ...$attributes]);
}

function tagPost(array $attributes = []): CmsPost
{
    return CmsPost::create([
        'user_id' => test()->admin->id,
        'lang_id' => test()->lang->id,
        'title' => 'Post',
        'status' => 'published',
        'published_at' => now()->subDay(),
        'active' => true,
        ...$attributes,
    ]);
}

it('lists tags with how many pages and posts use them', function (): void {
    $tag = CmsTag::create(['name' => 'Viajes']);
    tagPage(['title' => 'Cusco'])->tags()->attach($tag->id);
    tagPost(['title' => 'Lima'])->tags()->attach($tag->id);
    tagPost(['title' => 'Arequipa'])->tags()->attach($tag->id);

    $this->actingAs($this->admin)->get('/admin/tags')->assertOk()->assertInertia(fn (Assert $page): Assert => $page
        ->component('admin/tags/index')
        ->where('items.data.0.name', 'Viajes')
        ->where('items.data.0.articles_count', 1)
        ->where('items.data.0.posts_count', 2)
    );
});

it('creates, renames, deactivates and deletes tags', function (): void {
    $this->actingAs($this->admin)->post('/admin/tags', ['name' => 'Noticias'])->assertRedirect();
    $tag = CmsTag::where('name', 'Noticias')->firstOrFail();
    expect($tag->slug)->toBe('noticias');

    // Creating the same name again does not duplicate it
    $this->actingAs($this->admin)->post('/admin/tags', ['name' => 'noticias'])->assertRedirect();
    expect(CmsTag::count())->toBe(1);

    $this->actingAs($this->admin)->put("/admin/tags/{$tag->id}", ['name' => 'Novedades', 'slug' => 'novedades', 'active' => false])->assertRedirect();
    $tag->refresh();
    expect($tag->name)->toBe('Novedades')->and($tag->slug)->toBe('novedades')->and($tag->active)->toBeFalse();

    $page = tagPage();
    $page->tags()->attach($tag->id);
    $this->actingAs($this->admin)->delete("/admin/tags/{$tag->id}")->assertRedirect();
    expect(CmsTag::find($tag->id))->toBeNull()
        ->and($page->tags()->count())->toBe(0);
});

it('quick-creates tags from the editors, reusing existing names', function (): void {
    $this->actingAs($this->admin)
        ->postJson('/admin/tags/quick', ['name' => '  Laravel '])
        ->assertCreated()
        ->assertJson(['name' => 'Laravel', 'slug' => 'laravel', 'existing' => false]);

    $existing = CmsTag::where('slug', 'laravel')->first();
    $existing->update(['active' => false]);

    $this->actingAs($this->admin)
        ->postJson('/admin/tags/quick', ['name' => 'LARAVEL'])
        ->assertOk()
        ->assertJson(['id' => $existing->id, 'existing' => true]);

    expect(CmsTag::count())->toBe(1)
        ->and($existing->fresh()->active)->toBeTrue();

    $this->actingAs($this->admin)->postJson('/admin/tags/quick', ['name' => ''])->assertJsonValidationErrors('name');
});

it('requires the manage permission on tags to create them', function (): void {
    $editor = User::factory()->create();
    grantPermissions($editor, ['articles' => 'administrar', 'tags' => 'listar']);

    $this->actingAs($editor)->postJson('/admin/tags/quick', ['name' => 'Nope'])->assertForbidden();
    $this->actingAs($editor)->post('/admin/tags', ['name' => 'Nope'])->assertForbidden();
    expect(CmsTag::count())->toBe(0);
});

it('writes tag changes to the audit log', function (): void {
    $editor = User::factory()->create();
    grantPermissions($editor, ['tags' => 'administrar']);

    $this->actingAs($editor)->postJson('/admin/tags/quick', ['name' => 'Eventos'])->assertCreated();

    expect(AdmLog::where('user_id', $editor->id)->where('comment', 'like', 'Creado en %Eventos%')->exists())->toBeTrue();
});

it('saves the tags chosen in the page editor', function (): void {
    [$a, $b] = [CmsTag::create(['name' => 'A']), CmsTag::create(['name' => 'B'])];

    $this->actingAs($this->admin)
        ->post('/admin/articles', ['title' => 'Tagged page', 'lang_id' => $this->lang->id, 'status' => 'published', 'active' => true, 'tag_ids' => [$a->id, $b->id]])
        ->assertRedirect();
    $page = CmsArticle::where('title', 'Tagged page')->firstOrFail();
    expect($page->tags->pluck('id')->sort()->values()->all())->toBe([$a->id, $b->id]);

    // Saving without tags clears them
    $this->actingAs($this->admin)
        ->put("/admin/articles/{$page->id}", ['title' => 'Tagged page', 'lang_id' => $this->lang->id, 'status' => 'published', 'active' => true])
        ->assertRedirect();
    expect($page->tags()->count())->toBe(0);
});

it('saves the tags chosen in the post editor and rejects unknown ids', function (): void {
    $tag = CmsTag::create(['name' => 'Laravel']);
    $data = ['title' => 'Tagged post', 'status' => 'published', 'user_id' => $this->admin->id];

    $this->actingAs($this->admin)
        ->post("/admin/posts?post_type=post&lang_id={$this->lang->id}", [...$data, 'tag_ids' => [$tag->id]])
        ->assertRedirect();
    $post = CmsPost::where('title', 'Tagged post')->firstOrFail();
    expect($post->tags->pluck('id')->all())->toBe([$tag->id]);

    $this->actingAs($this->admin)
        ->put("/admin/posts/{$post->id}?post_type=post&lang_id={$this->lang->id}", [...$data, 'slug' => $post->slug, 'tag_ids' => [999999]])
        ->assertSessionHasErrors('tag_ids.0');
});

it('lists tag archives with published content in the sitemap', function (): void {
    $used = CmsTag::create(['name' => 'Usada']);
    $draftOnly = CmsTag::create(['name' => 'Borrador']);
    tagPage(['title' => 'Visible'])->tags()->attach($used->id);
    tagPage(['title' => 'Hidden', 'status' => 'draft'])->tags()->attach($draftOnly->id);

    $this->get('/sitemap.xml')->assertOk()->assertSee('/tag/usada')->assertDontSee('/tag/borrador');
});

it('merges old taxonomy terms into tags and keeps their links', function (): void {
    $tagTaxonomyId = CmsTag::taxonomyId();
    $existing = CmsTag::create(['name' => 'Viajes']);

    // Old-style data: another taxonomy with a duplicate slug and a new one
    $newsId = DB::table('cms_taxonomies')->insertGetId(['name' => 'News', 'slug' => 'news', 'active' => true]);
    $duplicate = DB::table('cms_taxonomy_terms')->insertGetId(['taxonomy_id' => $newsId, 'name' => 'Viajes', 'slug' => 'viajes', 'active' => true, 'position' => 1]);
    $fresh = DB::table('cms_taxonomy_terms')->insertGetId(['taxonomy_id' => $newsId, 'name' => 'Prueba', 'slug' => 'prueba', 'active' => true, 'position' => 2, 'parent_id' => $duplicate]);

    $page = tagPage();
    $post = tagPost();
    DB::table('cms_article_term')->insert(['article_id' => $page->id, 'term_id' => $duplicate]);
    DB::table('cms_post_term')->insert([['post_id' => $post->id, 'term_id' => $duplicate], ['post_id' => $post->id, 'term_id' => $existing->id]]);
    DB::table('cms_post_term')->insert(['post_id' => $post->id, 'term_id' => $fresh]);

    (require database_path('migrations/2026_10_26_120000_convert_taxonomies_to_tags.php'))->up();

    expect(DB::table('cms_taxonomies')->pluck('id')->all())->toBe([$tagTaxonomyId])
        ->and(DB::table('cms_taxonomy_terms')->where('id', $duplicate)->exists())->toBeFalse()
        ->and(CmsTag::pluck('slug')->sort()->values()->all())->toBe(['prueba', 'viajes'])
        ->and(CmsTag::where('slug', 'prueba')->value('parent_id'))->toBeNull()
        ->and($page->tags()->pluck('slug')->all())->toBe(['viajes'])
        ->and($post->tags()->pluck('slug')->sort()->values()->all())->toBe(['prueba', 'viajes']);
});
