<?php

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

it('no longer has the parameters module, its tables or its admin page', function (): void {
    expect(Schema::hasTable('cms_parameters'))->toBeFalse()
        ->and(Schema::hasTable('cms_parameters_group'))->toBeFalse()
        ->and(Schema::hasColumn('cms_registers', 'contact_id'))->toBeFalse()
        ->and(DB::table('adm_modules')->where('url', '/admin/parameters')->exists())->toBeFalse();

    $this->actingAs(User::factory()->create())->get('/admin/parameters')->assertNotFound();
});

it('keeps the parameter tables when they still hold data', function (): void {
    Schema::create('cms_parameters_group', function ($table): void {
        $table->increments('id');
        $table->string('name');
    });
    Schema::create('cms_parameters', function ($table): void {
        $table->increments('id');
        $table->string('name');
    });
    DB::table('cms_parameters')->insert(['name' => 'Lima']);

    $migration = require database_path('migrations/2026_11_17_100000_remove_cms_parameters.php');
    $migration->up();

    expect(Schema::hasTable('cms_parameters'))->toBeTrue()
        ->and(DB::table('cms_parameters')->count())->toBe(1);
});
