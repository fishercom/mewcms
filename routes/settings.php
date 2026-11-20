<?php

use App\Http\Controllers\Settings\BrandController;
use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('auth')->group(function (): void {
    Route::redirect('settings', 'settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/password', [PasswordController::class, 'edit'])->name('password.edit');
    Route::put('settings/password', [PasswordController::class, 'update'])->name('password.update');

    Route::get('settings/appearance', fn () => Inertia::render('settings/appearance'))->name('appearance');

    // The client's logo in the panel and on the login screen: super admins only (checked in the controller)
    Route::get('settings/brand', [BrandController::class, 'edit'])->name('brand.edit');
    Route::post('settings/brand', [BrandController::class, 'update'])->name('brand.update');
});
