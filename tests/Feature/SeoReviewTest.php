<?php

use App\Models\CmsArticle;
use App\Models\CmsLang;
use App\Models\CmsSchema;
use App\Models\CmsSchemaGroup;
use App\Models\User;
use App\Support\SeoAnalyzer;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function seoPage(array $attributes): CmsArticle
{
    $group = CmsSchemaGroup::firstOrCreate(['name' => 'Default'], ['layout' => 'layout', 'default' => 1, 'active' => 1]);
    $schema = CmsSchema::firstOrCreate(['name' => 'Page'], ['group_id' => $group->id, 'active' => 1, 'fields' => [], 'front_view' => 'front/templates/page']);
    $lang = CmsLang::firstOrCreate(['iso' => 'es'], ['name' => 'Español', 'active' => 1]);

    return CmsArticle::create([
        'schema_id' => $schema->id,
        'lang_id' => $lang->id,
        'slug' => str($attributes['title'])->slug()->toString(),
        'active' => 1,
        'status' => 'published',
        ...$attributes,
    ]);
}

/**
 * A page that follows every rule: keyword "diseño web".
 *
 * @return array<string, mixed>
 */
function strongPage(): array
{
    $filler = str_repeat('Creamos sitios rápidos, claros y fáciles de mantener para tu negocio. ', 20);

    return [
        'title' => 'Diseño web',
        'metadata' => [
            'seo_title' => 'Diseño web profesional para pequeñas empresas',
            'seo_description' => 'Diseño web a medida para pequeñas empresas: sitios rápidos, claros y fáciles de editar, listos para aparecer en Google.',
            'seo_keywords' => 'diseño web, sitios',
        ],
        'content' => '<p>Ofrecemos diseño web pensado para vender.</p>'
            .'<h2>Por qué invertir en diseño web</h2><p>'.$filler.'</p>'
            .'<h2>Cómo trabajamos</h2><p>'.$filler.'</p>'
            .'<p><img src="/img/equipo.jpg" alt="Nuestro equipo"></p>'
            .'<p>Mira nuestros <a href="/proyectos">proyectos</a> o <a href="/contacto">escríbenos</a>.</p>',
    ];
}

/**
 * @return array<string, string>
 */
function checkStatuses(array $result): array
{
    return collect($result['checks'])->pluck('status', 'key')->all();
}

test('a page that follows every rule scores 100', function (): void {
    $result = SeoAnalyzer::analyze(strongPage(), 'articles');

    expect(checkStatuses($result))->each->toBe('pass')
        ->and($result['score'])->toBe(100)
        ->and($result['keyword'])->toBe('diseño web');
});

test('an empty page fails the basics and skips what it cannot judge', function (): void {
    $result = SeoAnalyzer::analyze(['title' => 'Hola', 'content' => '<p>Pronto.</p>'], 'articles');

    expect(checkStatuses($result))->toMatchArray([
        'title' => 'fail',
        'description' => 'fail',
        'length' => 'fail',
        'keyword' => 'skip',
        'images' => 'skip',
        'links' => 'fail',
        'headings' => 'pass',
        'duplicates' => 'pass',
    ])->and($result['score'])->toBeLessThan(40);
});

test('the review explains what to fix', function (): void {
    $page = strongPage();
    $page['content'] = '<h1>Otro título</h1>'.$page['content'];
    $page['metadata']['seo_description'] = 'Muy corta.';

    $checks = collect(SeoAnalyzer::analyze($page, 'articles')['checks'])->keyBy('key');

    expect($checks['headings']['status'])->toBe('fail')
        ->and($checks['headings']['message'])->toContain('1 H1')
        ->and($checks['description']['message'])->toContain('10 caracteres');
});

test('posts need longer text than pages', function (): void {
    expect(checkStatuses(SeoAnalyzer::analyze(strongPage(), 'posts'))['length'])->toBe('fail');
});

test('keyword stuffing is flagged', function (): void {
    $page = strongPage();
    $page['content'] .= '<p>'.str_repeat('diseño web ', 40).'</p>';

    $checks = collect(SeoAnalyzer::analyze($page, 'articles')['checks'])->keyBy('key');

    expect($checks['keyword']['status'])->toBe('fail')
        ->and($checks['keyword']['message'])->toContain('demasiado');
});

test('a title or keyword already used by another page is flagged, but not the page itself', function (): void {
    $other = seoPage(['title' => 'Servicios', 'metadata' => ['seo_title' => 'Diseño web profesional para pequeñas empresas']]);

    expect(checkStatuses(SeoAnalyzer::analyze(strongPage(), 'articles'))['duplicates'])->toBe('fail')
        ->and(checkStatuses(SeoAnalyzer::analyze([...strongPage(), 'id' => $other->id], 'articles'))['duplicates'])->toBe('pass');

    $other->update(['metadata' => ['seo_keywords' => 'diseño web, agencia']]);

    expect(checkStatuses(SeoAnalyzer::analyze(strongPage(), 'articles'))['duplicates'])->toBe('fail');
});

test('the editor gets the review of its unsaved changes', function (): void {
    $this->actingAs(User::factory()->superAdmin()->create());

    $this->postJson(route('articles.seo-review'), strongPage())
        ->assertOk()
        ->assertJsonPath('score', 100)
        ->assertJsonCount(8, 'checks');
});

test('the review follows the module permission', function (): void {
    $user = User::factory()->create();
    grantPermissions($user, ['articles' => 'listar']);

    $this->actingAs($user)->postJson(route('articles.seo-review'), strongPage())->assertForbidden();
});
