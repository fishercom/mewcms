<?php

use App\Blocks\BlockRegistry;
use App\Models\CmsArticle;
use App\Models\CmsLang;
use App\Models\CmsMedia;
use App\Models\CmsPost;
use App\Models\CmsSchema;
use App\Models\CmsSchemaGroup;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $group = CmsSchemaGroup::create(['name' => 'Default', 'layout' => 'layout', 'default' => 1, 'active' => 1]);
    $this->lang = CmsLang::create(['name' => 'Español', 'iso' => 'es', 'active' => 1]);
    $this->schema = CmsSchema::create(['group_id' => $group->id, 'name' => 'Page', 'type' => 'PAGE', 'active' => 1, 'fields' => [], 'front_view' => 'front/templates/page']);
    $this->admin = User::factory()->superAdmin()->create();
});

function blockPage(array $attributes = []): CmsArticle
{
    return CmsArticle::create([
        'schema_id' => test()->schema->id,
        'lang_id' => test()->lang->id,
        'title' => 'Página',
        'slug' => 'pagina',
        'active' => 1,
        ...$attributes,
    ]);
}

it('has a React renderer for every block type', function (): void {
    $registry = file_get_contents(resource_path('js/blocks/registry.tsx'));

    foreach (array_keys(BlockRegistry::types()) as $key) {
        $folder = str_replace('_', '-', $key);
        expect(resource_path("js/blocks/{$folder}/render.tsx"))->toBeFile()
            ->and($registry)->toContain("{$key}:");
    }
});

it('cleans the blocks on save and rebuilds the content from them', function (): void {
    $page = blockPage(['blocks' => [
        ['id' => 'hero-1', 'type' => 'hero', 'data' => [
            'title' => '<b>Bienvenidos</b>',
            'subtitle' => 'Hacemos sitios web',
            'button_label' => 'Contacto',
            'button_url' => 'javascript:alert(1)',
            'align' => 'diagonal',
            'overlay' => 500,
            'unknown' => 'x',
        ]],
        ['type' => 'rich_text', 'data' => ['html' => '<p>Hola</p><script>alert(1)</script>']],
        ['type' => 'marquee', 'data' => ['text' => 'no existe']],
        'basura',
    ]]);

    $blocks = $page->fresh()->blocks;
    expect($blocks)->toHaveCount(2)
        ->and($blocks[0])->toMatchArray(['id' => 'hero-1', 'type' => 'hero', 'version' => 1])
        ->and($blocks[0]['data'])->toMatchArray(['title' => 'Bienvenidos', 'button_url' => '', 'align' => 'left', 'overlay' => 90])
        ->and($blocks[0]['data'])->not->toHaveKey('unknown')
        ->and($blocks[1]['id'])->toBeString()->not->toBe('')
        ->and($blocks[1]['data']['html'])->toBe('<p>Hola</p>');

    expect($page->fresh()->content)->toContain('<h2>Bienvenidos</h2>')->toContain('<p>Hacemos sitios web</p>')->toContain('<p>Hola</p>')
        ->not->toContain('javascript')->not->toContain('<script');
});

it('saves the blocks sent by the page and post editors', function (): void {
    $page = blockPage(['content' => '<p>Antes</p>']);

    $this->actingAs($this->admin)->put("/admin/articles/{$page->id}", [
        'title' => 'Página',
        'slug' => 'pagina',
        'lang_id' => $this->lang->id,
        'schema_id' => $this->schema->id,
        'active' => 1,
        'content' => '<p>Ignorado</p>',
        'blocks' => [
            ['id' => 'a', 'type' => 'cta', 'data' => ['title' => 'Hablemos', 'button_label' => 'Escríbenos', 'button_url' => 'https://deepsoft.lat', 'style' => 'dark']],
        ],
    ])->assertSessionHasNoErrors();

    expect($page->fresh())
        ->blocks->toHaveCount(1)
        ->content->toContain('Hablemos')->not->toContain('Ignorado')->not->toContain('Antes');

    $this->actingAs($this->admin)->get("/admin/articles/{$page->id}/edit")->assertInertia(fn (Assert $p): Assert => $p
        ->where('item.blocks.0.type', 'cta')
        ->has('blockTypes', count(BlockRegistry::TYPES))
        ->where('blockTypes.0.key', 'rich_text'));

    $this->actingAs($this->admin)->post('/admin/posts', [
        'title' => 'Entrada',
        'post_type' => 'post',
        'status' => 'published',
        'user_id' => $this->admin->id,
        'blocks' => [['type' => 'rich_text', 'data' => ['html' => '<p>Texto de la entrada</p>']]],
    ])->assertSessionHasNoErrors();

    expect(CmsPost::sole())->blocks->toHaveCount(1)->content->toBe('<p>Texto de la entrada</p>');
});

it('wraps the content of existing pages and posts in a text block', function (): void {
    $page = blockPage(['slug' => 'vieja', 'content' => '<p>Contenido de siempre</p>']);
    $empty = blockPage(['slug' => 'vacia', 'content' => '']);
    $post = CmsPost::create(['title' => 'Entrada', 'post_type' => 'post', 'user_id' => $this->admin->id, 'lang_id' => $this->lang->id, 'content' => '<p>Post</p>']);
    DB::table('cms_articles')->update(['blocks' => null]);
    DB::table('cms_posts')->update(['blocks' => null]);

    (require database_path('migrations/2026_10_31_100000_add_blocks_to_content.php'))->convert();

    expect($page->fresh()->blocks)->toHaveCount(1)
        ->and($page->fresh()->blocks[0])->toMatchArray(['type' => 'rich_text', 'data' => ['html' => '<p>Contenido de siempre</p>']])
        ->and($page->fresh()->content)->toBe('<p>Contenido de siempre</p>')
        ->and($empty->fresh()->blocks)->toBe([])
        ->and($post->fresh()->blocks[0]['data']['html'])->toBe('<p>Post</p>');
});

it('renders blocks on the public page, with the content as fallback', function (): void {
    Storage::fake('public');
    $this->actingAs($this->admin)->postJson('/admin/media', ['file' => UploadedFile::fake()->image('equipo.jpg', 1200, 800)]);
    $media = CmsMedia::sole();
    $media->update(['alt' => 'Nuestro equipo']);

    blockPage(['blocks' => [
        ['type' => 'hero', 'data' => ['title' => 'Hola', 'image' => $media->url]],
        ['type' => 'rich_text', 'data' => ['html' => '<p>Texto</p><img src="'.$media->url.'" alt="">']],
    ]]);

    $this->get('/pagina')->assertOk()->assertInertia(fn (Assert $p): Assert => $p
        ->component('front/templates/page')
        ->where('article.blocks.0.type', 'hero')
        ->where('article.blocks.1.data.html', fn (string $html): bool => str_contains($html, 'alt="Nuestro equipo"') && str_contains($html, 'srcset='))
        ->where('media', fn ($map): bool => ($map[$media->url]['alt'] ?? null) === 'Nuestro equipo'));

    // Restoring a revision from before blocks leaves the page with its plain content
    $legacy = blockPage(['slug' => 'antigua', 'content' => '<p>Antigua</p>']);
    DB::table('cms_articles')->where('id', $legacy->id)->update(['blocks' => null]);
    $this->get('/antigua')->assertInertia(fn (Assert $p): Assert => $p->where('article.blocks', null)->where('article.content', '<p>Antigua</p>'));
});

it('keeps blocks in revisions, autosaves and previews', function (): void {
    $page = blockPage(['blocks' => [['type' => 'rich_text', 'data' => ['html' => '<p>Uno</p>']]]]);
    $page->recordSave($this->admin->id);

    $page->update(['blocks' => [['type' => 'cta', 'data' => ['title' => 'Dos']]]]);
    $page->recordSave($this->admin->id);

    $first = $page->revisions()->where('is_autosave', false)->reorder('id')->first();
    expect($first->blocks[0]['type'])->toBe('rich_text');

    $page->restoreRevision($first, $this->admin->id);
    expect($page->fresh())->blocks->{0}->toMatchArray(['type' => 'rich_text'])->content->toBe('<p>Uno</p>');

    $this->actingAs($this->admin)->postJson("/admin/articles/{$page->id}/autosave", [
        'title' => 'Página',
        'blocks' => [['type' => 'hero', 'data' => ['title' => 'Borrador', 'button_url' => 'javascript:x']]],
    ])->assertOk();
    $autosave = $page->pendingAutosave($this->admin->id);
    expect($autosave->blocks[0]['data'])->toMatchArray(['title' => 'Borrador', 'button_url' => ''])
        ->and($autosave->content)->toContain('Borrador');

    $url = $this->actingAs($this->admin)->postJson('/admin/articles/preview', [
        'id' => $page->id,
        'title' => 'Vista previa',
        'blocks' => [['type' => 'cta', 'data' => ['title' => 'Previo']]],
    ])->json('url');
    $this->get($url)->assertInertia(fn (Assert $p): Assert => $p->where('article.blocks.0.data.title', 'Previo'));
});
