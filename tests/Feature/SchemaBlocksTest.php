<?php

use App\Blocks\BlockRegistry;
use App\Models\CmsSchema;
use App\Models\CmsSchemaGroup;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->group = CmsSchemaGroup::create(['name' => 'Default', 'layout' => 'layout', 'default' => 1, 'active' => 1]);
    $this->admin = User::factory()->superAdmin()->create();
});

function schemaWith(array $attributes): CmsSchema
{
    return CmsSchema::create([
        'group_id' => test()->group->id,
        'name' => 'Landing',
        'type' => 'PAGE',
        'active' => 1,
        'fields' => [],
        'front_view' => 'front/templates/page',
        ...$attributes,
    ]);
}

it('keeps only known block types, and treats none or all as no limit', function (): void {
    expect(schemaWith(['allowed_blocks' => ['hero', 'cta', 'marquee']])->fresh()->allowed_blocks)->toBe(['hero', 'cta'])
        ->and(schemaWith(['allowed_blocks' => []])->fresh()->allowed_blocks)->toBeNull()
        ->and(schemaWith(['allowed_blocks' => array_keys(BlockRegistry::types())])->fresh()->allowed_blocks)->toBeNull();
});

it('cleans the starter layout', function (): void {
    $schema = schemaWith(['default_blocks' => [
        ['type' => 'hero', 'data' => ['title' => '<b>Hola</b>', 'button_url' => 'javascript:alert(1)']],
        ['type' => 'marquee', 'data' => []],
    ]]);

    expect($schema->fresh()->default_blocks)->toHaveCount(1)
        ->and($schema->fresh()->default_blocks[0]['data'])->toMatchArray(['title' => 'Hola', 'button_url' => '']);
});

it('saves the block settings from the schema form', function (): void {
    $schema = schemaWith([]);

    $this->actingAs($this->admin)->get("/admin/schemas/{$schema->id}/edit")
        ->assertInertia(fn (Assert $p): Assert => $p->has('blockTypes')->has('blockPatterns'));

    $this->actingAs($this->admin)->put("/admin/schemas/{$schema->id}", [
        'name' => 'Landing',
        'group_id' => $this->group->id,
        'front_view' => 'front/templates/page',
        'fields' => [],
        'active' => true,
        'allowed_blocks' => ['rich_text', 'hero'],
        'default_blocks' => [['type' => 'hero', 'data' => ['title' => 'Portada']]],
    ])->assertSessionHasNoErrors();

    expect($schema->fresh())
        ->allowed_blocks->toBe(['rich_text', 'hero'])
        ->default_blocks->{0}->toMatchArray(['type' => 'hero']);
});
