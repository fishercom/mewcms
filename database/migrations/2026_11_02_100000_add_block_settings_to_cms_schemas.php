<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Each schema (template) may limit which blocks its pages offer in the editor
 * (allowed_blocks, null = all) and give new pages a starter layout (default_blocks).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cms_schemas', function (Blueprint $table): void {
            $table->json('allowed_blocks')->nullable()->after('fields');
            $table->json('default_blocks')->nullable()->after('allowed_blocks');
        });
    }

    public function down(): void
    {
        Schema::table('cms_schemas', function (Blueprint $table): void {
            $table->dropColumn(['allowed_blocks', 'default_blocks']);
        });
    }
};
