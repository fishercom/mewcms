<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use UniSharp\LaravelFilemanager\Lfm;

Route::group(['prefix' => 'laravel-filemanager', 'middleware' => ['web', 'auth']], function () {
    Lfm::routes();
});



use App\Http\Controllers\Admin\DashboardController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('admin', [DashboardController::class, 'index'])->name('admin');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
require __DIR__.'/admin.php';

// Home route (named 'home' for compatibility with frontend components)
Route::get('/', [App\Http\Controllers\FrontController::class, 'show'])->name('home');

// Taxonomy listing routes
Route::get('category/{slug}', [App\Http\Controllers\FrontController::class, 'category'])->name('front.category');
Route::get('tag/{slug}', [App\Http\Controllers\FrontController::class, 'tag'])->name('front.tag');

// Catch-all route to resolve dynamic CMS pages on the frontend
Route::get('{any}', [App\Http\Controllers\FrontController::class, 'show'])
    ->where('any', '.*')
    ->name('front.show');
