<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasColumn('cms_schemas', 'front_view')) {
            Schema::table('cms_schemas', function (Blueprint $table) {
                $table->string('front_view')->nullable()->after('type');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cms_schemas', function (Blueprint $table) {
            $table->dropColumn('front_view');
        });
    }
};
