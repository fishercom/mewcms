<?php

use App\Models\CmsArticle;
use App\Models\CmsBlockPattern;
use App\Models\CmsLang;
use App\Models\CmsSchema;
use App\Models\CmsSchemaGroup;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $group = CmsSchemaGroup::create(['name' => 'Default', 'layout' => 'layout', 'default' => 1, 'active' => 1]);
    $this->lang = CmsLang::create(['name' => 'Español', 'iso' => 'es', 'active' => 1]);
    $this->schema = CmsSchema::create(['group_id' => $group->id, 'name' => 'Page', 'type' => 'PAGE', 'active' => 1, 'fields' => [], 'front_view' => 'front/templates/page']);
    $this->admin = User::factory()->superAdmin()->create();
});

function pattern(array $attributes = []): CmsBlockPattern
{
    return CmsBlockPattern::create([
        'name' => 'Aviso de horarios',
        'key' => 'aviso-de-horarios',
        'synced' => true,
        'blocks' => [['type' => 'rich_text', 'data' => ['html' => '<p>Abrimos de 9 a 6</p>']]],
        ...$attributes,
    ]);
}

function patternPage(array $blocks): CmsArticle
{
    return CmsArticle::create([
        'schema_id' => test()->schema->id,
        'lang_id' => test()->lang->id,
        'title' => 'Página',
        'slug' => 'pagina',
        'active' => 1,
        'blocks' => $blocks,
    ]);
}

it('cleans the blocks of a pattern and refuses patterns inside patterns', function (): void {
    $pattern = pattern(['blocks' => [
        ['type' => 'rich_text', 'data' => ['html' => '<p>Hola</p><script>alert(1)</script>']],
        ['type' => 'pattern', 'data' => ['pattern' => 'aviso-de-horarios']],
        ['type' => 'columns', 'data' => ['layout' => '50-50', 'columns' => [
            ['blocks' => [['type' => 'pattern', 'data' => ['pattern' => 'aviso-de-horarios']], ['type' => 'rich_text', 'data' => ['html' => '<p>En columna</p>']]]],
            ['blocks' => []],
        ]]],
        ['type' => 'marquee', 'data' => []],
    ]]);

    $blocks = $pattern->fresh()->blocks;
    expect($blocks)->toHaveCount(2)
        ->and($blocks[0]['data']['html'])->toBe('<p>Hola</p>')
        ->and($blocks[1]['type'])->toBe('columns')
        ->and($blocks[1]['data']['columns'][0]['blocks'])->toHaveCount(1)
        ->and($blocks[1]['data']['columns'][0]['blocks'][0]['type'])->toBe('rich_text');
});

it('renders a synced pattern on the public page and keeps its text searchable', function (): void {
    pattern();
    $page = patternPage([['type' => 'pattern', 'data' => ['pattern' => 'aviso-de-horarios']]]);

    expect($page->fresh()->content)->toContain('Abrimos de 9 a 6');

    $this->get('/pagina')->assertOk()->assertInertia(fn (Assert $p): Assert => $p
        ->where('article.blocks.0.type', 'pattern')
        ->where('article.blocks.0.data.name', 'Aviso de horarios')
        ->where('article.blocks.0.data.blocks.0.data.html', '<p>Abrimos de 9 a 6</p>'));
});

it('follows the pattern when it changes, and drops it when it is gone', function (): void {
    $pattern = pattern();
    patternPage([['type' => 'pattern', 'data' => ['pattern' => 'aviso-de-horarios']]]);

    $pattern->update(['blocks' => [['type' => 'rich_text', 'data' => ['html' => '<p>Nuevo horario</p>']]]]);
    $this->get('/pagina')->assertInertia(fn (Assert $p): Assert => $p
        ->where('article.blocks.0.data.blocks.0.data.html', '<p>Nuevo horario</p>'));

    $pattern->update(['active' => false]);
    $this->get('/pagina')->assertInertia(fn (Assert $p): Assert => $p->where('article.blocks.0.data.blocks', []));
});

it('manages patterns from the admin module', function (): void {
    $this->actingAs($this->admin)->post('/admin/block-patterns', [
        'name' => 'Pie de contacto',
        'key' => 'pie-de-contacto',
        'category' => 'footer',
        'description' => 'Teléfono y dirección',
        'synced' => true,
        'active' => true,
        'blocks' => [['type' => 'cta', 'data' => ['title' => 'Llámanos', 'button_url' => 'javascript:alert(1)']]],
    ])->assertRedirect('/admin/block-patterns');

    $created = CmsBlockPattern::sole();
    expect($created->blocks[0]['data'])->toMatchArray(['title' => 'Llámanos', 'button_url' => '']);

    $this->actingAs($this->admin)->get('/admin/block-patterns')->assertInertia(fn (Assert $p): Assert => $p
        ->component('admin/block-patterns/index')
        ->where('items.data.0.key', 'pie-de-contacto'));

    $this->actingAs($this->admin)->get("/admin/block-patterns/{$created->id}/edit")->assertInertia(fn (Assert $p): Assert => $p
        ->where('item.blocks.0.type', 'cta')
        ->has('blockTypes'));

    // The key stays unique
    $this->actingAs($this->admin)->post('/admin/block-patterns', [
        'name' => 'Otro', 'key' => 'pie-de-contacto', 'category' => 'general', 'blocks' => [],
    ])->assertSessionHasErrors('key');

    $this->actingAs($this->admin)->delete("/admin/block-patterns/{$created->id}")->assertRedirect('/admin/block-patterns');
    expect(CmsBlockPattern::count())->toBe(0);
});

it('saves a block from the editor as a reusable block', function (): void {
    $response = $this->actingAs($this->admin)->postJson('/admin/block-patterns/quick', [
        'name' => 'Portada de campaña',
        'synced' => true,
        'blocks' => [['type' => 'hero', 'data' => ['title' => 'Campaña']]],
    ])->assertCreated();

    expect($response->json('pattern.key'))->toBe('portada-de-campana')
        ->and($response->json('pattern.blocks.0.type'))->toBe('hero');

    // A second block with the same name gets its own key
    $this->actingAs($this->admin)->postJson('/admin/block-patterns/quick', [
        'name' => 'Portada de campaña',
        'blocks' => [['type' => 'hero', 'data' => ['title' => 'Otra']]],
    ])->assertCreated()->assertJsonPath('pattern.key', 'portada-de-campana-2');
});

it('offers the active patterns to the page and post editors', function (): void {
    pattern();
    pattern(['name' => 'Inactivo', 'key' => 'inactivo', 'active' => false]);
    $page = patternPage([]);

    $this->actingAs($this->admin)->get("/admin/articles/{$page->id}/edit")->assertInertia(fn (Assert $p): Assert => $p
        ->has('blockPatterns', 1)
        ->where('blockPatterns.0.key', 'aviso-de-horarios')
        ->where('blockPatterns.0.synced', true)
        ->where('blockPatterns.0.blocks.0.type', 'rich_text'));
});

it('keeps the module out of reach of a profile without permission', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user)->get('/admin/block-patterns')->assertForbidden();
    $this->actingAs($user)->postJson('/admin/block-patterns/quick', ['name' => 'X', 'blocks' => [['type' => 'hero', 'data' => []]]])->assertForbidden();
});
