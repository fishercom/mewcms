<?php

use App\Models\CmsArticle;
use App\Models\CmsLang;
use App\Models\CmsRedirect;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->lang = CmsLang::create(['name' => 'Español', 'iso' => 'es', 'active' => true]);
    $this->admin = User::factory()->superAdmin()->create();
});

function uriPage(string $title, ?CmsArticle $parent = null, array $attributes = []): CmsArticle
{
    return CmsArticle::create(['lang_id' => test()->lang->id, 'title' => $title, 'parent_id' => $parent?->id, 'active' => true, ...$attributes]);
}

it('builds the uri from the parent chain and keeps the slug as the last segment', function (): void {
    $about = uriPage('Nosotros');
    $history = uriPage('Historia', $about);
    $origins = uriPage('Orígenes', $history);

    expect($history->slug)->toBe('historia')
        ->and($history->uri)->toBe('nosotros/historia')
        ->and($origins->uri)->toBe('nosotros/historia/origenes')
        ->and($about->getAllDescendantIds())->toEqualCanonicalizing([$history->id, $origins->id]);

    // The same title can repeat under different parents
    $services = uriPage('Servicios');
    expect(uriPage('Historia', $services)->slug)->toBe('historia')
        ->and(uriPage('Historia', $about)->slug)->toBe('historia-2');
});

it('backfills uris from old parent-prefixed slugs and redirects the old addresses', function (): void {
    $now = now();
    $parent = DB::table('cms_articles')->insertGetId(['lang_id' => $this->lang->id, 'title' => 'Quienes Somos', 'slug' => 'quienes-somos', 'active' => true, 'status' => 'published', 'created_at' => $now, 'updated_at' => $now]);
    $child = DB::table('cms_articles')->insertGetId(['lang_id' => $this->lang->id, 'parent_id' => $parent, 'title' => 'Historia', 'slug' => 'quienes-somos-historia', 'active' => true, 'status' => 'published', 'created_at' => $now, 'updated_at' => $now]);
    $legacy = DB::table('cms_articles')->insertGetId(['lang_id' => $this->lang->id, 'parent_id' => $parent, 'title' => 'Misión', 'slug' => 'quienes-somos_mision', 'active' => true, 'status' => 'published', 'created_at' => $now, 'updated_at' => $now]);

    (require database_path('migrations/2026_10_28_100000_add_page_uris_and_redirects.php'))->up();

    expect(DB::table('cms_articles')->where('id', $child)->first(['slug', 'uri']))->toEqual((object) ['slug' => 'historia', 'uri' => 'quienes-somos/historia'])
        ->and(DB::table('cms_articles')->where('id', $legacy)->value('uri'))->toBe('quienes-somos/mision')
        ->and(DB::table('cms_articles')->where('id', $parent)->value('uri'))->toBe('quienes-somos');

    $this->get('/quienes-somos-historia')->assertRedirect('/quienes-somos/historia')->assertStatus(301);
    $this->get('/quienes-somos/historia')->assertOk();
});

it('moves child uris and redirects every old address when a parent slug changes', function (): void {
    $about = uriPage('Nosotros');
    $history = uriPage('Historia', $about);
    $origins = uriPage('Orígenes', $history);

    $about->update(['slug' => 'quienes-somos']);

    expect($history->fresh()->uri)->toBe('quienes-somos/historia')
        ->and($origins->fresh()->uri)->toBe('quienes-somos/historia/origenes')
        ->and(CmsRedirect::pluck('to_path', 'from_path')->all())->toEqual([
            '/nosotros' => '/quienes-somos',
            '/nosotros/historia' => '/quienes-somos/historia',
            '/nosotros/historia/origenes' => '/quienes-somos/historia/origenes',
        ]);
});

it('moves a page to another parent, avoiding slug clashes there', function (): void {
    [$a, $b] = [uriPage('A'), uriPage('B')];
    uriPage('Equipo', $b);
    $team = uriPage('Equipo', $a);

    $team->update(['parent_id' => $b->id]);

    expect($team->fresh()->uri)->toBe('b/equipo-2');
    $this->get('/a/equipo')->assertRedirect('/b/equipo-2');
});

it('serves redirects with a 301 instead of a 404 and counts hits', function (): void {
    $page = uriPage('Contacto');
    $page->update(['slug' => 'contactanos']);

    $this->get('/contacto')->assertStatus(301)->assertRedirect('/contactanos');
    $this->get('/contacto')->assertStatus(301);

    $redirect = CmsRedirect::where('from_path', '/contacto')->first();
    expect($redirect->hits)->toBe(2)->and($redirect->last_hit_at)->not->toBeNull();

    $this->get('/no-existe')->assertNotFound();
});

it('collapses redirect chains and never loops when a page moves back', function (): void {
    $page = uriPage('Uno');
    $page->update(['slug' => 'dos']);
    $page->update(['slug' => 'tres']);

    expect(CmsRedirect::pluck('to_path', 'from_path')->all())->toEqual(['/uno' => '/tres', '/dos' => '/tres']);

    $page->update(['slug' => 'uno']);

    expect(CmsRedirect::where('from_path', '/uno')->exists())->toBeFalse()
        ->and(CmsRedirect::whereColumn('from_path', 'to_path')->exists())->toBeFalse()
        ->and(CmsRedirect::pluck('to_path', 'from_path')->all())->toEqual(['/dos' => '/uno', '/tres' => '/uno']);
    $this->get('/uno')->assertOk();
    $this->get('/tres')->assertRedirect('/uno');
});

it('resolves nested pages by uri only when every ancestor is published', function (): void {
    $about = uriPage('Nosotros');
    $history = uriPage('Historia', $about);
    uriPage('Orígenes', $history);

    $this->get('/nosotros/historia/origenes')->assertOk()->assertInertia(fn (Assert $p): Assert => $p->where('article.uri', 'nosotros/historia/origenes'));
    $this->get('/origenes')->assertNotFound();

    $about->update(['status' => 'draft']);
    $this->get('/nosotros/historia/origenes')->assertNotFound();
});

it('lists nested page urls in the sitemap and menus', function (): void {
    $history = uriPage('Historia', uriPage('Nosotros'));

    $this->get('/sitemap.xml')->assertSee('/nosotros/historia');
    expect($history->url)->toBe('/nosotros/historia');
});

it('manages manual redirects from the admin', function (): void {
    $this->actingAs($this->admin)->post('/admin/redirects', ['from_path' => 'vieja-promo/', 'to_path' => 'https://example.com/promo'])->assertSessionHasNoErrors();
    $redirect = CmsRedirect::firstOrFail();
    expect($redirect->from_path)->toBe('/vieja-promo')->and($redirect->status_code)->toBe(301);

    $this->get('/vieja-promo')->assertRedirect('https://example.com/promo');

    $this->actingAs($this->admin)->put("/admin/redirects/{$redirect->id}", ['from_path' => '/vieja-promo', 'to_path' => '/ofertas', 'status_code' => 302])->assertSessionHasNoErrors();
    $this->get('/vieja-promo')->assertStatus(302)->assertRedirect('/ofertas');

    $this->actingAs($this->admin)->post('/admin/redirects', ['from_path' => '/vieja-promo', 'to_path' => '/x'])->assertSessionHasErrors('from_path');
    $this->actingAs($this->admin)->post('/admin/redirects', ['from_path' => '/', 'to_path' => '/x'])->assertSessionHasErrors('from_path');

    $this->actingAs($this->admin)->get('/admin/redirects')->assertOk()->assertInertia(fn (Assert $p): Assert => $p
        ->component('admin/redirects/index')
        ->where('items.data.0.from_path', '/vieja-promo')
    );

    $this->actingAs($this->admin)->delete("/admin/redirects/{$redirect->id}")->assertRedirect();
    expect(CmsRedirect::count())->toBe(0);
});

it('requires the manage permission to change redirects', function (): void {
    $reader = User::factory()->create();
    grantPermissions($reader, ['redirects' => 'listar']);

    $this->actingAs($reader)->get('/admin/redirects')->assertOk();
    $this->actingAs($reader)->post('/admin/redirects', ['from_path' => '/a', 'to_path' => '/b'])->assertForbidden();
    expect(CmsRedirect::count())->toBe(0);
});

it('drops a redirect when a live page takes its address', function (): void {
    CmsRedirect::create(['from_path' => '/blog-viejo', 'to_path' => '/blog']);

    uriPage('Blog viejo');

    expect(CmsRedirect::count())->toBe(0);
    $this->get('/blog-viejo')->assertOk();
});

it('changes a page address from the editor and redirects the old one', function (): void {
    $about = uriPage('Nosotros');
    $history = uriPage('Historia', $about);

    $this->actingAs($this->admin)
        ->put("/admin/articles/{$about->id}", ['title' => 'Nosotros', 'slug' => 'Quiénes Somos', 'lang_id' => $this->lang->id, 'status' => 'published', 'active' => true])
        ->assertSessionHasNoErrors();

    expect($about->fresh()->uri)->toBe('quienes-somos')
        ->and($history->fresh()->uri)->toBe('quienes-somos/historia');
    $this->get('/nosotros/historia')->assertStatus(301)->assertRedirect('/quienes-somos/historia');
});
