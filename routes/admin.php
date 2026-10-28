<?php

use App\Http\Controllers\Admin\AiController;
use App\Http\Controllers\Admin\ArticleController;
use App\Http\Controllers\Admin\BlockPatternController;
use App\Http\Controllers\Admin\ConfigController;
use App\Http\Controllers\Admin\ContentRevisionController;
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
use App\Http\Controllers\Admin\RedirectController;
use App\Http\Controllers\Admin\RegisterController;
use App\Http\Controllers\Admin\SchemaController;
use App\Http\Controllers\Admin\SeoReviewController;
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
    // Site switcher: every admin user picks the site they work on
    Route::post('sites/{site}/switch', [SiteController::class, 'switch'])->name('sites.switch');
    Route::get('themes/{theme}/screenshot', [SiteController::class, 'themeScreenshot'])->where('theme', '[a-z0-9_-]+')->name('themes.screenshot');
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

    Route::get('ai', [AiController::class, 'index'])->name('ai.index');
    Route::put('ai', [AiController::class, 'update'])->name('ai.update');
    Route::middleware('throttle:ai')->group(function (): void {
        Route::post('ai/test', [AiController::class, 'test'])->name('ai.test');
        Route::post('ai/metadata', [AiController::class, 'metadata'])->name('ai.metadata');
        Route::post('ai/improve-block', [AiController::class, 'improveBlock'])->name('ai.improve-block');
        Route::post('ai/outline', [AiController::class, 'outline'])->name('ai.outline');
        Route::post('ai/draft', [AiController::class, 'draft'])->name('ai.draft');
    });

    Route::resource('sites', SiteController::class);
    Route::resource('schemas', SchemaController::class);
    Route::resource('parameters', ParameterController::class);
    Route::resource('forms', FormController::class);
    Route::resource('registers', RegisterController::class);
    Route::resource('notifies', NotifyController::class);
    // Revisions, autosave and preview of pages and posts (permissions follow each module)
    foreach (['articles', 'posts'] as $contentModule) {
        Route::prefix($contentModule)->name($contentModule.'.')->group(function () use ($contentModule): void {
            Route::post('preview', [ContentRevisionController::class, 'preview'])->name('preview')->defaults('module', $contentModule);
            Route::post('seo-review', [SeoReviewController::class, 'review'])->name('seo-review')->defaults('module', $contentModule);
            Route::get('{id}/revisions', [ContentRevisionController::class, 'index'])->name('revisions.index')->defaults('module', $contentModule);
            Route::get('{id}/revisions/{revisionId}', [ContentRevisionController::class, 'show'])->name('revisions.show')->defaults('module', $contentModule);
            Route::post('{id}/revisions/{revisionId}/restore', [ContentRevisionController::class, 'restore'])->name('revisions.restore')->defaults('module', $contentModule);
            Route::post('{id}/autosave', [ContentRevisionController::class, 'autosave'])->name('autosave')->defaults('module', $contentModule);
            Route::delete('{id}/autosave', [ContentRevisionController::class, 'discardAutosave'])->name('autosave.destroy')->defaults('module', $contentModule);
        });
    }

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
    Route::resource('redirects', RedirectController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::get('media/picker', [MediaController::class, 'picker'])->name('media.picker');
    Route::post('media/bulk', [MediaController::class, 'bulk'])->name('media.bulk');
    Route::resource('media', MediaController::class)->only(['index', 'store', 'update', 'destroy'])->parameters(['media' => 'medium']);

    Route::resource('sliders', SliderController::class);

    Route::post('block-patterns/quick', [BlockPatternController::class, 'quickStore'])->name('block-patterns.quick');
    Route::resource('block-patterns', BlockPatternController::class)->except(['show']);

    Route::resource('post-types', PostTypeController::class);
    Route::post('posts/bulk', [PostController::class, 'bulk'])->name('posts.bulk');
    Route::resource('posts', PostController::class);

    Route::get('layout', [LayoutController::class, 'index'])->name('layout.index');
    Route::post('layout', [LayoutController::class, 'update'])->name('layout.update');
});

Route::redirect('dashboard', 'admin')->name('dashboard');
