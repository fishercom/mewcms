<?php

use App\Models\AdmMenu;
use App\Models\AdmModule;
use App\Models\CmsPostType;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    // As the installer creates them
    $this->content = AdmMenu::forceCreate(['name' => 'Contenido', 'position' => 1, 'visible' => true]);
    foreach ([['Páginas', '/admin/articles', 'articles.index'], ['Posts', '/admin/posts', 'posts.index'], ['Etiquetas', '/admin/tags', 'tags.index']] as $i => [$name, $url, $route]) {
        $module = new AdmModule(['name' => $name, 'url' => $url, 'route' => $route, 'visible' => true]);
        $module->menu_id = $this->content->id;
        $module->position = $i + 1;
        $module->save();
    }
});

$names = fn (AdmMenu $menu): array => AdmModule::where('menu_id', $menu->id)->orderBy('position')->pluck('name')->all();

it('adds a post type to the Contenido group of the sidebar, right after Posts', function () use ($names): void {
    CmsPostType::create(['name' => 'Productos', 'singular_name' => 'Producto', 'slug' => 'productos', 'icon' => 'shopping-bag', 'active' => true]);

    expect($names($this->content))->toBe(['Páginas', 'Posts', 'Productos', 'Etiquetas'])
        ->and(AdmModule::where('name', 'Productos')->first())
        ->url->toBe('/admin/posts?post_type=productos')
        ->icon->toBe('shopping-bag')
        ->key()->toBe('posts');
});

it('follows a renamed post type and leaves with a deleted one', function () use ($names): void {
    $type = CmsPostType::create(['name' => 'Productos', 'singular_name' => 'Producto', 'slug' => 'productos', 'active' => true]);
    $type->update(['name' => 'Catálogo', 'slug' => 'catalogo']);

    expect(AdmModule::where('url', '/admin/posts?post_type=catalogo')->value('name'))->toBe('Catálogo')
        ->and(AdmModule::where('url', 'like', '%post_type=productos')->exists())->toBeFalse();

    $type->delete();
    expect($names($this->content))->toBe(['Páginas', 'Posts', 'Etiquetas']);
});

it('adds the entry of a post type created before the fix', function () use ($names): void {
    CmsPostType::withoutEvents(fn () => CmsPostType::create(['name' => 'Productos', 'singular_name' => 'Producto', 'slug' => 'productos', 'active' => true]));
    expect(AdmModule::where('url', 'like', '%post_type=productos')->exists())->toBeFalse();

    (require database_path('migrations/2026_11_21_100000_add_missing_post_type_menu_entries.php'))->up();
    (require database_path('migrations/2026_11_21_100000_add_missing_post_type_menu_entries.php'))->up();

    expect($names($this->content))->toBe(['Páginas', 'Posts', 'Productos', 'Etiquetas']);
});
