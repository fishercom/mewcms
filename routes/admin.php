<?php

use App\Http\Controllers\Admin\LangController;
use App\Http\Controllers\Admin\ProfileController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\LogController;
use App\Http\Controllers\Admin\TranslateController;
use App\Http\Controllers\Admin\ConfigController;
use App\Http\Controllers\Admin\MediaController;
use App\Http\Controllers\Admin\SiteController;
use App\Http\Controllers\Admin\SchemaController;
use App\Http\Controllers\Admin\ParameterController;
use App\Http\Controllers\Admin\RegisterController;
use App\Http\Controllers\Admin\NotifyController;
use App\Http\Controllers\Admin\ArticleController;
use App\Http\Controllers\Admin\TaxonomyController;
use App\Http\Controllers\Admin\TaxonomyTermController;
use App\Http\Controllers\Admin\MenuController;
use App\Http\Controllers\Admin\TemplateController;
use App\Http\Controllers\Admin\LayoutController;
use App\Http\Controllers\Admin\SliderController;
use App\Http\Controllers\Admin\PostTypeController;
use App\Http\Controllers\Admin\PostController;
use UniSharp\LaravelFilemanager\Lfm;

use Illuminate\Support\Facades\Route;

Route::middleware('auth')->prefix('admin')->group(function () {

    Route::get('schemas/root', [SchemaController::class, 'root'])->name('schemas.root');
    Route::get('schemas/{schema}/children', [SchemaController::class, 'children'])->name('schemas.children');

    Route::resource('profiles', ProfileController::class);
    Route::resource('users', UserController::class);
    Route::resource('langs', LangController::class);
    Route::resource('logs', LogController::class);
    Route::resource('translates', TranslateController::class);
    Route::resource('configs', ConfigController::class);

    Route::resource('sites', SiteController::class);
    Route::resource('schemas', SchemaController::class);
    Route::resource('parameters', ParameterController::class);
    Route::resource('registers', RegisterController::class);
    Route::resource('notifies', NotifyController::class);
    Route::resource('articles', ArticleController::class);
    Route::post('articles/sort', [ArticleController::class, 'sort'])->name('articles.sort');
    Route::resource('taxonomies', TaxonomyController::class);
    Route::resource('taxonomies.terms', TaxonomyTermController::class)->shallow();
    Route::post('taxonomies/terms/sort', [TaxonomyTermController::class, 'sort'])->name('taxonomies.terms.sort');
    
    Route::resource('menus', MenuController::class);
    Route::post('menus/{menu}/items', [MenuController::class, 'storeItems'])->name('menus.items.store');
    Route::post('menus/{menu}/items/sort', [MenuController::class, 'sortItems'])->name('menus.items.sort');
    Route::delete('menus/items/{item}', [MenuController::class, 'destroyItem'])->name('menus.items.destroy');

    Route::resource('templates', TemplateController::class)->except(['show']);
    Route::get('media', [MediaController::class, 'index'])->name('media.index');
    
    Route::get('api/sliders', [SliderController::class, 'apiList'])->name('sliders.api_list');
    Route::resource('sliders', SliderController::class);
    
    Route::resource('post-types', PostTypeController::class);
    Route::resource('posts', PostController::class);
    
    Route::get('layout', [LayoutController::class, 'index'])->name('layout.index');
    Route::post('layout', [LayoutController::class, 'update'])->name('layout.update');
});

Route::get('dashboard', function () {
    return Inertia::render('dashboard');
})->name('dashboard');
