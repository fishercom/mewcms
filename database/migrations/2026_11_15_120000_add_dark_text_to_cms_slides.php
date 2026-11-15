<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A slide on a light picture can ask for dark text, so the theme writes its title and
 * caption in black instead of white.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cms_slides', function (Blueprint $table): void {
            $table->boolean('dark_text')->default(false)->after('button_label');
        });
    }

    public function down(): void
    {
        Schema::table('cms_slides', function (Blueprint $table): void {
            $table->dropColumn('dark_text');
        });
    }
};
