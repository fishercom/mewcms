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
        Schema::table('cms_articles', function (Blueprint $table): void {
            $table->index('slug');
            $table->index('active');
        });

        Schema::table('cms_translates', function (Blueprint $table): void {
            $table->index('alias');
        });

        Schema::table('cms_schemas', function (Blueprint $table): void {
            $table->index('active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cms_articles', function (Blueprint $table): void {
            $table->dropIndex(['slug']);
            $table->dropIndex(['active']);
        });

        Schema::table('cms_translates', function (Blueprint $table): void {
            $table->dropIndex(['alias']);
        });

        Schema::table('cms_schemas', function (Blueprint $table): void {
            $table->dropIndex(['active']);
        });
    }
};
