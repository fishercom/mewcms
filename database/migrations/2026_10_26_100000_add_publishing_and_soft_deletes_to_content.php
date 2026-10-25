<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Pages get a publication date like posts, so both can be scheduled, and both
 * move to a trash (soft deletes) instead of being removed right away.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('cms_articles', 'published_at')) {
            Schema::table('cms_articles', function (Blueprint $table): void {
                $table->timestamp('published_at')->nullable()->after('status');
            });
        }

        foreach (['cms_articles', 'cms_posts'] as $table) {
            if (! Schema::hasColumn($table, 'deleted_at')) {
                Schema::table($table, fn (Blueprint $blueprint) => $blueprint->softDeletes());
            }
        }

        // Pages used to treat an empty status as published
        DB::table('cms_articles')
            ->where('active', true)
            ->where(fn ($query) => $query->whereNull('status')->orWhere('status', ''))
            ->update(['status' => 'published']);

        DB::table('cms_articles')
            ->where('active', true)
            ->whereNull('published_at')
            ->update(['published_at' => DB::raw('created_at')]);
    }

    public function down(): void
    {
        foreach (['cms_articles', 'cms_posts'] as $table) {
            if (Schema::hasColumn($table, 'deleted_at')) {
                Schema::table($table, fn (Blueprint $blueprint) => $blueprint->dropSoftDeletes());
            }
        }

        if (Schema::hasColumn('cms_articles', 'published_at')) {
            Schema::table('cms_articles', fn (Blueprint $table) => $table->dropColumn('published_at'));
        }
    }
};
