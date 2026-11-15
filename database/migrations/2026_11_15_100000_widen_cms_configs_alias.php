<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Setting names were limited to 20 characters, too short for theme settings such as
 * "layout_products_banner" (MySQL refuses them; SQLite does not check).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cms_configs', function (Blueprint $table): void {
            $table->string('alias', 100)->change();
        });
    }

    public function down(): void
    {
        Schema::table('cms_configs', function (Blueprint $table): void {
            $table->string('alias', 20)->change();
        });
    }
};
