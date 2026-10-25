<?php

use App\Models\CmsArticle;
use App\Models\CmsLang;
use App\Models\CmsSchema;
use App\Models\CmsSchemaGroup;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->lang = CmsLang::create(['name' => 'Español', 'iso' => 'es', 'active' => true]);
    $this->admin = User::factory()->superAdmin()->create();
    $this->group = CmsSchemaGroup::create(['name' => 'Default', 'layout' => 'layout', 'default' => 1, 'active' => 1]);
});

function templatesOf(Assert $page): array
{
    return collect($page->toArray()['props']['templates'])->keyBy('value')->all();
}

it('offers every page template, not post templates, and defaults to the standard page', function (): void {
    $this->actingAs($this->admin)->get('/admin/articles/create')->assertOk()->assertInertia(function (Assert $page): Assert {
        $templates = templatesOf($page);

        expect(array_keys($templates))->toContain('front/templates/page', 'front/templates/home')
            ->not->toContain('front/templates/post')
            ->and($templates['front/templates/page']['schema_ids'])->not->toBeEmpty()
            ->and($templates['front/templates/home']['unique'])->toBeTrue();

        return $page->where('schema.front_view', 'front/templates/page');
    });

    expect(CmsSchema::where('front_view', 'front/templates/page')->value('name'))->toBe('Página estándar');
});

it('creates the missing default field groups once, without touching existing ones', function (): void {
    $home = CmsSchema::create(['group_id' => $this->group->id, 'name' => 'Mi inicio', 'fields' => [['alias' => 'hero']], 'front_view' => 'front/templates/home', 'active' => true]);
    $old = CmsSchema::create(['group_id' => $this->group->id, 'name' => 'Quienes Somos', 'fields' => [], 'front_view' => 'front/templates/page', 'active' => false]);

    CmsSchema::ensureTemplateDefaults();
    CmsSchema::ensureTemplateDefaults();
    (require database_path('migrations/2026_10_27_110000_create_default_template_schemas.php'))->up();

    expect(CmsSchema::where('front_view', 'front/templates/home')->count())->toBe(1)
        ->and($home->fresh()->fields)->toBe([['alias' => 'hero']])
        ->and($old->fresh()->active)->toBeFalsy()
        ->and(CmsSchema::where('front_view', 'front/templates/page')->where('active', true)->count())->toBe(1)
        ->and(CmsSchema::where('front_view', 'front/templates/post')->exists())->toBeFalse();
});

it('marks a single-use template taken by another page, but not on that page itself', function (): void {
    CmsSchema::ensureTemplateDefaults();
    $homeSchema = CmsSchema::where('front_view', 'front/templates/home')->firstOrFail();
    $home = CmsArticle::create(['lang_id' => $this->lang->id, 'title' => 'Inicio', 'schema_id' => $homeSchema->id, 'active' => true]);

    $this->actingAs($this->admin)->get('/admin/articles/create')->assertInertia(
        fn (Assert $page): Assert => tap($page, fn () => expect(templatesOf($page)['front/templates/home']['used_by'])->toBe(['id' => $home->id, 'title' => 'Inicio']))
    );
    $this->actingAs($this->admin)->get("/admin/articles/{$home->id}/edit")->assertInertia(
        fn (Assert $page): Assert => tap($page, fn () => expect(templatesOf($page)['front/templates/home']['used_by'])->toBeNull())
    );

    // The server still refuses a second page with it
    $this->actingAs($this->admin)
        ->post('/admin/articles', ['title' => 'Otra', 'lang_id' => $this->lang->id, 'schema_id' => $homeSchema->id, 'status' => 'published', 'active' => true])
        ->assertSessionHasErrors('schema_id');
});

it('saves the custom fields of the chosen template', function (): void {
    $schema = CmsSchema::create([
        'group_id' => $this->group->id,
        'name' => 'Servicio',
        'fields' => [['key' => 'precio', 'alias' => 'precio', 'name' => 'Precio', 'label' => 'Precio', 'type' => 'text']],
        'front_view' => 'front/templates/page',
        'active' => true,
    ]);

    $this->actingAs($this->admin)
        ->post('/admin/articles', ['title' => 'Consultoría', 'lang_id' => $this->lang->id, 'schema_id' => $schema->id, 'metadata' => ['precio' => '100'], 'status' => 'published', 'active' => true])
        ->assertSessionHasNoErrors();

    $page = CmsArticle::where('title', 'Consultoría')->firstOrFail();
    expect($page->metadata)->toBe(['precio' => '100']);

    $this->actingAs($this->admin)->get("/admin/articles/{$page->id}/edit")->assertInertia(fn (Assert $p): Assert => $p
        ->where('schema.id', $schema->id)
        ->has('schema.fields', 1)
        ->where('templates', fn ($templates): bool => in_array($schema->id, collect($templates)->firstWhere('value', 'front/templates/page')['schema_ids'], true))
    );
});

it('keeps a page own field group listed when editing, even if inactive', function (): void {
    $old = CmsSchema::create(['group_id' => $this->group->id, 'name' => 'Antigua', 'fields' => [], 'front_view' => 'front/templates/page', 'active' => false]);
    $page = CmsArticle::create(['lang_id' => $this->lang->id, 'title' => 'Vieja', 'schema_id' => $old->id, 'active' => true]);

    $this->actingAs($this->admin)->get("/admin/articles/{$page->id}/edit")->assertInertia(fn (Assert $p): Assert => $p
        ->where('schemas', fn ($schemas): bool => collect($schemas)->contains('id', $old->id))
    );
});
