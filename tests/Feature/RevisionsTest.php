<?php

use App\Models\AdmLog;
use App\Models\CmsArticle;
use App\Models\CmsLang;
use App\Models\CmsPost;
use App\Models\CmsRevision;
use App\Models\CmsTag;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->lang = CmsLang::create(['name' => 'Español', 'iso' => 'es', 'active' => true]);
    $this->admin = User::factory()->superAdmin()->create();
});

function revPage(array $attributes = []): CmsArticle
{
    return CmsArticle::create(['lang_id' => test()->lang->id, 'title' => 'Original', 'content' => '<p>Uno</p>', 'active' => true, ...$attributes]);
}

function savePage(CmsArticle $page, array $data): void
{
    test()->actingAs(test()->admin)
        ->put("/admin/articles/{$page->id}", ['lang_id' => test()->lang->id, 'status' => 'published', 'active' => true, ...$data])
        ->assertSessionHasNoErrors();
}

it('records a revision on every admin save, skipping unchanged saves', function (): void {
    $page = revPage();

    savePage($page, ['title' => 'Primera', 'content' => '<p>Uno</p>']);
    savePage($page, ['title' => 'Primera', 'content' => '<p>Uno</p>']);
    savePage($page, ['title' => 'Segunda', 'content' => '<p>Dos</p>']);

    $revisions = $page->revisions()->get();
    expect($revisions)->toHaveCount(2)
        ->and($revisions->pluck('title')->all())->toBe(['Segunda', 'Primera'])
        ->and($revisions->first()->user_id)->toBe($this->admin->id);
});

it('records revisions for posts with their tags', function (): void {
    $tag = CmsTag::create(['name' => 'Laravel']);
    $data = ['title' => 'Post', 'status' => 'draft', 'user_id' => $this->admin->id, 'tag_ids' => [$tag->id]];

    $this->actingAs($this->admin)->post("/admin/posts?post_type=post&lang_id={$this->lang->id}", $data)->assertRedirect();

    $revision = CmsPost::firstOrFail()->revisions()->firstOrFail();
    expect($revision->title)->toBe('Post')->and($revision->tag_ids)->toBe([$tag->id]);
});

it('keeps only the latest 25 saved revisions', function (): void {
    $page = revPage();

    foreach (range(1, 28) as $i) {
        $page->update(['title' => "Versión {$i}"]);
        $page->snapshot($this->admin->id);
    }
    $page->autosave($this->admin->id, ['title' => 'Borrador']);

    expect($page->revisions()->where('is_autosave', false)->count())->toBe(25)
        ->and($page->revisions()->where('is_autosave', false)->first()->title)->toBe('Versión 28')
        ->and($page->revisions()->where('is_autosave', true)->count())->toBe(1);
});

it('restores a revision after snapshotting the current state', function (): void {
    $tag = CmsTag::create(['name' => 'Viajes']);
    $page = revPage();
    $page->tags()->attach($tag->id);
    $page->snapshot($this->admin->id);
    $old = $page->revisions()->first();

    $page->tags()->detach();
    savePage($page, ['title' => 'Cambiado', 'content' => '<p>Nuevo</p>']);
    Cache::put('front.shared', ['stale' => true]);

    $this->actingAs($this->admin)->post("/admin/articles/{$page->id}/revisions/{$old->id}/restore")->assertRedirect();

    $page->refresh();
    expect($page->title)->toBe('Original')
        ->and($page->content)->toBe('<p>Uno</p>')
        ->and($page->tags->pluck('id')->all())->toBe([$tag->id])
        ->and($page->revisions()->pluck('title')->all())->toBe(['Original', 'Cambiado', 'Original'])
        ->and(Cache::has('front.shared'))->toBeFalse();
});

it('logs restores and requires the manage permission', function (): void {
    $page = revPage();
    $page->snapshot($this->admin->id);
    $revision = $page->revisions()->first();

    $reader = User::factory()->create();
    grantPermissions($reader, ['articles' => 'listar']);
    $this->actingAs($reader)->getJson("/admin/articles/{$page->id}/revisions")->assertOk()->assertJsonCount(1, 'revisions');
    $this->actingAs($reader)->post("/admin/articles/{$page->id}/revisions/{$revision->id}/restore")->assertForbidden();
    $this->actingAs($reader)->postJson("/admin/articles/{$page->id}/autosave", ['title' => 'x'])->assertForbidden();

    $editor = User::factory()->create();
    grantPermissions($editor, ['articles' => 'administrar']);
    $this->actingAs($editor)->post("/admin/articles/{$page->id}/revisions/{$revision->id}/restore")->assertRedirect();
    expect(AdmLog::where('user_id', $editor->id)->where('comment', 'like', 'Revisión restaurada%')->exists())->toBeTrue();
});

it('keeps one autosave per user without touching the live page', function (): void {
    $page = revPage();
    $other = User::factory()->superAdmin()->create();

    $this->actingAs($this->admin)->postJson("/admin/articles/{$page->id}/autosave", ['title' => 'Mío 1'])->assertOk();
    $this->actingAs($this->admin)->postJson("/admin/articles/{$page->id}/autosave", ['title' => 'Mío 2'])->assertOk();
    $this->actingAs($other)->postJson("/admin/articles/{$page->id}/autosave", ['title' => 'Del otro'])->assertOk();

    expect($page->fresh()->title)->toBe('Original')
        ->and($page->revisions()->where('is_autosave', true)->count())->toBe(2)
        ->and($page->pendingAutosave($this->admin->id)->title)->toBe('Mío 2')
        ->and($page->pendingAutosave($other->id)->title)->toBe('Del otro');

    // The editor offers it, and saving the page drops only this user's autosave
    $this->actingAs($this->admin)->get("/admin/articles/{$page->id}/edit")
        ->assertInertia(fn (Assert $p): Assert => $p->where('autosave.title', 'Mío 2'));
    savePage($page, ['title' => 'Guardado']);
    expect($page->pendingAutosave($this->admin->id))->toBeNull()
        ->and($page->revisions()->where('is_autosave', true)->where('user_id', $other->id)->exists())->toBeTrue();

    $this->actingAs($other)->deleteJson("/admin/articles/{$page->id}/autosave")->assertOk();
    expect(CmsRevision::where('is_autosave', true)->count())->toBe(0);
});

it('previews unsaved changes of a draft behind a signed link', function (): void {
    $page = revPage(['title' => 'Borrador', 'status' => 'draft', 'slug' => 'borrador']);
    $this->get('/borrador')->assertNotFound();

    $url = $this->actingAs($this->admin)
        ->postJson('/admin/articles/preview', ['id' => $page->id, 'title' => 'Sin guardar', 'content' => '<p>Hola</p><script>x</script>'])
        ->assertOk()
        ->json('url');

    $this->get($url)
        ->assertOk()
        ->assertHeader('X-Robots-Tag', 'noindex, nofollow')
        ->assertInertia(fn (Assert $p): Assert => $p
            ->component('front/templates/page')
            ->where('article.title', 'Sin guardar')
            ->where('article.content', '<p>Hola</p>')
        );

    expect($page->fresh()->title)->toBe('Borrador');
});

it('previews a new post that was never saved', function (): void {
    $url = $this->actingAs($this->admin)
        ->postJson('/admin/posts/preview', ['title' => 'Nueva entrada', 'post_type' => 'post', 'user_id' => $this->admin->id])
        ->json('url');

    $this->get($url)->assertOk()->assertInertia(fn (Assert $p): Assert => $p
        ->component('front/blog/show')
        ->where('post.title', 'Nueva entrada')
    );
    expect(CmsPost::count())->toBe(0);
});

it('rejects preview links without a valid signature or after they expire', function (): void {
    $url = $this->actingAs($this->admin)->postJson('/admin/articles/preview', ['title' => 'X'])->json('url');

    $this->get(strtok($url, '?'))->assertForbidden();
    $this->get($url.'x')->assertForbidden();

    $this->travel(31)->minutes();
    $this->get($url)->assertForbidden();
});
