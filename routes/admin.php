<?php

use App\Http\Controllers\Admin\ArticleController;
use App\Http\Controllers\Admin\ConfigController;
use App\Http\Controllers\Admin\FormController;
use App\Http\Controllers\Admin\LangController;
use App\Http\Controllers\Admin\LayoutController;
use App\Http\Controllers\Admin\LogController;
use App\Http\Controllers\Admin\MediaController;
use App\Http\Controllers\Admin\MenuController;
use App\Http\Controllers\Admin\NotifyController;
use App\Http\Controllers\Admin\ParameterController;
use App\Http\Controllers\Admin\PostController;
use App\Http\Controllers\Admin\PostTypeController;
use App\Http\Controllers\Admin\ProfileController;
use App\Http\Controllers\Admin\RegisterController;
use App\Http\Controllers\Admin\SchemaController;
use App\Http\Controllers\Admin\SiteController;
use App\Http\Controllers\Admin\SliderController;
use App\Http\Controllers\Admin\TagController;
use App\Http\Controllers\Admin\TemplateController;
use App\Http\Controllers\Admin\TranslateController;
use App\Http\Controllers\Admin\UserController;
use Illuminate\Support\Facades\Route;

// Endpoints any admin user may call from shared editor components
Route::middleware(['auth', 'admin.access'])->prefix('admin')->group(function (): void {
    Route::get('api/sliders', [SliderController::class, 'apiList'])->name('sliders.api_list');
});

Route::middleware(['auth', 'admin.permission'])->prefix('admin')->group(function (): void {

    Route::get('schemas/root', [SchemaController::class, 'root'])->name('schemas.root');
    Route::get('schemas/{schema}/children', [SchemaController::class, 'children'])->name('schemas.children');

    Route::resource('profiles', ProfileController::class);
    Route::resource('users', UserController::class);
    Route::resource('langs', LangController::class);
    Route::resource('logs', LogController::class)->only(['index']);
    Route::resource('translates', TranslateController::class);
    Route::resource('configs', ConfigController::class);

    Route::resource('sites', SiteController::class);
    Route::resource('schemas', SchemaController::class);
    Route::resource('parameters', ParameterController::class);
    Route::resource('forms', FormController::class);
    Route::resource('registers', RegisterController::class);
    Route::resource('notifies', NotifyController::class);
    Route::post('articles/bulk', [ArticleController::class, 'bulk'])->name('articles.bulk');
    Route::resource('articles', ArticleController::class);
    Route::post('articles/sort', [ArticleController::class, 'sort'])->name('articles.sort');
    Route::post('tags/quick', [TagController::class, 'quickStore'])->name('tags.quick');
    Route::resource('tags', TagController::class)->only(['index', 'store', 'update', 'destroy']);

    Route::resource('menus', MenuController::class);
    Route::post('menus/{menu}/items', [MenuController::class, 'storeItems'])->name('menus.items.store');
    Route::post('menus/{menu}/items/sort', [MenuController::class, 'sortItems'])->name('menus.items.sort');
    Route::delete('menus/items/{item}', [MenuController::class, 'destroyItem'])->name('menus.items.destroy');

    Route::resource('templates', TemplateController::class)->except(['show']);
    Route::get('media', [MediaController::class, 'index'])->name('media.index');

    Route::resource('sliders', SliderController::class);

    Route::resource('post-types', PostTypeController::class);
    Route::post('posts/bulk', [PostController::class, 'bulk'])->name('posts.bulk');
    Route::resource('posts', PostController::class);

    Route::get('layout', [LayoutController::class, 'index'])->name('layout.index');
    Route::post('layout', [LayoutController::class, 'update'])->name('layout.update');
});

Route::redirect('dashboard', 'admin')->name('dashboard');
