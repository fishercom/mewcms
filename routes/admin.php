<?php

use App\Http\Controllers\Admin\LangController;
use App\Http\Controllers\Admin\ProfileController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\LogController;
use App\Http\Controllers\Admin\TranslateController;
use App\Http\Controllers\Admin\ConfigController;
use App\Http\Controllers\Admin\DirectoryController;
use App\Http\Controllers\Admin\SiteController;
use App\Http\Controllers\Admin\SchemaController;
use App\Http\Controllers\Admin\ParameterController;
use App\Http\Controllers\Admin\RegisterController;
use App\Http\Controllers\Admin\NotifyController;
use App\Http\Controllers\Admin\ArticleController;
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
    Route::resource('directories', DirectoryController::class);
    Route::resource('sites', SiteController::class);
    Route::resource('schemas', SchemaController::class);
    Route::resource('parameters', ParameterController::class);
    Route::resource('registers', RegisterController::class);
    Route::resource('notifies', NotifyController::class);
    Route::resource('articles', ArticleController::class);
    Route::post('articles/sort', [ArticleController::class, 'sort'])->name('articles.sort');

});

Route::get('dashboard', function () {
    return Inertia::render('dashboard');
})->name('dashboard');
