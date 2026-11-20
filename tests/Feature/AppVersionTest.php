<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\actingAs;

uses(RefreshDatabase::class);

it('shows the version from the VERSION file in the admin', function (): void {
    $version = trim(file_get_contents(base_path('VERSION')));
    expect($version)->toMatch('/^\d+\.\d+\.\d+$/');

    actingAs(User::factory()->superAdmin()->create())
        ->get('/admin/layout')
        ->assertInertia(fn (Assert $page): Assert => $page->where('app_version', $version));
});
