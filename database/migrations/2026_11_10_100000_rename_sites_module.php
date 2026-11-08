<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * The Sites module reads "Sitios Web" in the Spanish admin (the English admin keeps "Sites").
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('adm_modules')->where('route', 'sites.index')->where('name', 'Sites')->update(['name' => 'Sitios Web']);
    }

    public function down(): void
    {
        DB::table('adm_modules')->where('route', 'sites.index')->where('name', 'Sitios Web')->update(['name' => 'Sites']);
    }
};
