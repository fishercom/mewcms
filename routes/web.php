<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use UniSharp\LaravelFilemanager\Lfm;

Route::group(['prefix' => 'laravel-filemanager', 'middleware' => ['web', 'auth']], function () {
    Lfm::routes();
});



Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('admin', function () {
        return Inertia::render('admin');
    })->name('admin');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
require __DIR__.'/admin.php';

// Home route (named 'home' for compatibility with frontend components)
Route::get('/', [App\Http\Controllers\FrontController::class, 'show'])->name('home');

// Catch-all route to resolve dynamic CMS pages on the frontend
Route::get('{any}', [App\Http\Controllers\FrontController::class, 'show'])
    ->where('any', '.*')
    ->name('front.show');
