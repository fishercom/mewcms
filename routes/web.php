<?php

use Illuminate\Support\Facades\Route;
use UniSharp\LaravelFilemanager\Lfm;

Route::group(['prefix' => 'laravel-filemanager', 'middleware' => ['web', 'auth']], function () {
    Lfm::routes();
});

use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\FrontController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('admin', [DashboardController::class, 'index'])->name('admin');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
require __DIR__.'/admin.php';

// Home route (named 'home' for compatibility with frontend components)
Route::get('/', [FrontController::class, 'show'])->name('home');

// Taxonomy listing routes
Route::get('category/{slug}', [FrontController::class, 'category'])->name('front.category');
Route::get('tag/{slug}', [FrontController::class, 'tag'])->name('front.tag');

// Public blog post routes
Route::get('blog', [FrontController::class, 'blogIndex'])->name('front.blog.index');
Route::get('blog/{slug}', [FrontController::class, 'blogShow'])->name('front.blog.show');

// Public form submission API
Route::get('api/forms/{alias}', [FrontController::class, 'getFormConfig'])->name('front.forms.config');
Route::post('api/forms/submit', [FrontController::class, 'publicFormSubmit'])->name('front.forms.submit');

// Public search route
Route::get('search', [FrontController::class, 'search'])->name('front.search');

// Dynamic SEO Sitemap and Robots
Route::get('sitemap.xml', [FrontController::class, 'sitemap'])->name('front.sitemap');
Route::get('robots.txt', [FrontController::class, 'robots'])->name('front.robots');

// Catch-all route to resolve dynamic CMS pages on the frontend
Route::get('{any}', [FrontController::class, 'show'])
    ->where('any', '.*')
    ->name('front.show');
