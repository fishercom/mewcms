<?php

use App\Models\CmsArticle;
use App\Models\CmsLang;
use App\Models\CmsMenu;
use App\Models\CmsMenuItem;
use App\Models\User;
use App\Support\FrontCache;
use App\Support\PageMenus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->lang = CmsLang::create(['name' => 'Español', 'iso' => 'es', 'active' => true]);
    $this->admin = User::factory()->superAdmin()->create();
    $this->main = CmsMenu::create(['name' => 'Main', 'slug' => 'main', 'active' => true, 'auto_add_pages' => true]);
    $this->footer = CmsMenu::create(['name' => 'Footer', 'slug' => 'footer', 'active' => true]);
});

function menuPageData(array $data = []): array
{
    return ['lang_id' => test()->lang->id, 'status' => 'published', 'active' => true, 'menus_managed' => true, ...$data];
}

it('pre-selects menus that add new pages and adds the page at the end', function (): void {
    CmsMenuItem::create(['menu_id' => $this->main->id, 'title' => 'Existente', 'url' => '/x', 'position' => 4, 'active' => true]);

    expect(PageMenus::defaultsFor(null))->toBe([$this->main->id]);

    $this->actingAs($this->admin)
        ->post('/admin/articles', menuPageData(['title' => 'Servicios', 'menu_ids' => PageMenus::defaultsFor(null)]))
        ->assertSessionHasNoErrors();

    $page = CmsArticle::where('title', 'Servicios')->firstOrFail();
    $item = CmsMenuItem::where('article_id', $page->id)->firstOrFail();
    expect($item->menu_id)->toBe($this->main->id)
        ->and($item->title)->toBe('Servicios')
        ->and($item->position)->toBe(5)
        ->and($item->resolved_url)->toBe('/servicios')
        ->and(CmsMenuItem::where('menu_id', $this->footer->id)->count())->toBe(0);

    // It shows on the public site
    $this->get('/servicios')->assertInertia(fn (Assert $p): Assert => $p->where('menus.0.items', fn ($items): bool => collect($items)->contains('title', 'Servicios')));
});

it('only pre-selects menus for subpages when they add subpages and contain the parent', function (): void {
    $parent = CmsArticle::create(['lang_id' => $this->lang->id, 'title' => 'Nosotros', 'active' => true]);

    expect(PageMenus::defaultsFor($parent->id))->toBe([]);

    PageMenus::sync($parent, [$this->main->id]);
    $this->main->update(['auto_add_subpages' => true]);
    expect(PageMenus::defaultsFor($parent->id))->toBe([$this->main->id]);

    $child = CmsArticle::create(['lang_id' => $this->lang->id, 'title' => 'Historia', 'parent_id' => $parent->id, 'active' => true]);
    PageMenus::sync($child, [$this->main->id]);

    $parentItem = CmsMenuItem::where('article_id', $parent->id)->first();
    expect(CmsMenuItem::where('article_id', $child->id)->value('parent_id'))->toBe($parentItem->id);
});

it('shows the page menus when editing and removes the page when unchecked', function (): void {
    $page = CmsArticle::create(['lang_id' => $this->lang->id, 'title' => 'Nosotros', 'active' => true]);
    PageMenus::sync($page, [$this->main->id, $this->footer->id]);
    $sub = CmsMenuItem::create(['menu_id' => $this->main->id, 'parent_id' => CmsMenuItem::where('menu_id', $this->main->id)->value('id'), 'title' => 'Sub', 'url' => '/sub', 'position' => 1, 'active' => true]);

    $this->actingAs($this->admin)->get("/admin/articles/{$page->id}/edit")->assertInertia(fn (Assert $p): Assert => $p
        ->where('menuIds', fn ($ids): bool => collect($ids)->sort()->values()->all() === [$this->main->id, $this->footer->id])
    );

    // No menu_ids sent at all = none checked
    $this->actingAs($this->admin)->put("/admin/articles/{$page->id}", menuPageData(['title' => 'Nosotros']))->assertSessionHasNoErrors();

    expect(CmsMenuItem::where('article_id', $page->id)->count())->toBe(0)
        ->and($sub->fresh()->parent_id)->toBeNull();
});

it('keeps menu links on the page current address and title', function (): void {
    $page = CmsArticle::create(['lang_id' => $this->lang->id, 'title' => 'Contacto', 'active' => true]);
    PageMenus::sync($page, [$this->main->id, $this->footer->id]);
    CmsMenuItem::where('menu_id', $this->footer->id)->update(['title' => 'Escríbenos']);

    $this->actingAs($this->admin)
        ->put("/admin/articles/{$page->id}", menuPageData(['title' => 'Contáctanos', 'slug' => 'contactanos', 'menu_ids' => [$this->main->id, $this->footer->id]]))
        ->assertSessionHasNoErrors();

    $main = CmsMenuItem::where('menu_id', $this->main->id)->first();
    $footer = CmsMenuItem::where('menu_id', $this->footer->id)->first();
    expect($main->resolved_url)->toBe('/contactanos')
        ->and($main->title)->toBe('Contáctanos')
        ->and($footer->title)->toBe('Escríbenos');

    // Unpublished pages drop out of the public menu
    $page->update(['status' => 'draft']);
    expect(collect(FrontCache::menus())->flatMap(fn (array $menu): array => $menu['items']))->toBeEmpty();
});

it('ignores menu changes from editors who cannot manage menus', function (): void {
    $editor = User::factory()->create();
    grantPermissions($editor, ['articles' => 'administrar', 'menus' => 'listar']);
    $page = CmsArticle::create(['lang_id' => $this->lang->id, 'title' => 'Blog', 'active' => true]);
    PageMenus::sync($page, [$this->footer->id]);

    $this->actingAs($editor)
        ->put("/admin/articles/{$page->id}", menuPageData(['title' => 'Blog', 'menu_ids' => [$this->main->id]]))
        ->assertSessionHasNoErrors();
    $this->actingAs($editor)
        ->post('/admin/articles', menuPageData(['title' => 'Nueva', 'menu_ids' => [$this->main->id]]))
        ->assertSessionHasNoErrors();

    expect(PageMenus::membership($page))->toBe([$this->footer->id])
        ->and(CmsMenuItem::where('menu_id', $this->main->id)->count())->toBe(0);
});

it('removes the menu items when a page is deleted permanently', function (): void {
    [$a, $b] = [
        CmsArticle::create(['lang_id' => $this->lang->id, 'title' => 'A', 'active' => true]),
        CmsArticle::create(['lang_id' => $this->lang->id, 'title' => 'B', 'active' => true]),
    ];
    PageMenus::sync($a, [$this->main->id]);
    PageMenus::sync($b, [$this->main->id]);

    $a->forceDelete();
    expect(CmsMenuItem::where('title', 'A')->exists())->toBeFalse();

    $b->delete();
    $this->actingAs($this->admin)->post('/admin/articles/bulk', ['action' => 'force_delete', 'ids' => [$b->id]])->assertRedirect();
    expect(CmsMenuItem::count())->toBe(0);
});

it('turns auto-add on for the main menu when migrating', function (): void {
    $this->main->update(['auto_add_pages' => false]);

    (require database_path('migrations/2026_10_28_110000_add_auto_add_pages_to_cms_menus.php'))->up();

    expect($this->main->fresh()->auto_add_pages)->toBeTrue()
        ->and($this->footer->fresh()->auto_add_pages)->toBeFalse();
});

it('saves the auto-add options from the menu form', function (): void {
    $this->actingAs($this->admin)
        ->put("/admin/menus/{$this->footer->id}", ['name' => 'Footer', 'slug' => 'footer', 'active' => true, 'auto_add_pages' => true, 'auto_add_subpages' => true])
        ->assertRedirect();

    expect($this->footer->fresh()->only(['auto_add_pages', 'auto_add_subpages']))->toBe(['auto_add_pages' => true, 'auto_add_subpages' => true]);
});
