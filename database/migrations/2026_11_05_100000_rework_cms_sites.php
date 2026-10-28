<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Sites drop the fields nothing used (segment, metadata, schema group) and get their
 * own language, SEO title and description, and favicon.
 *
 * Like the multisite migration, every step checks whether it already ran, so it
 * finishes when re-run after a failed attempt on MySQL.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('cms_sites', 'schema_group_id')) {
            if ($this->hasForeignKey('schema_group_id')) {
                Schema::table('cms_sites', fn (Blueprint $table) => $table->dropForeign(['schema_group_id']));
            }
            Schema::table('cms_sites', fn (Blueprint $table) => $table->dropColumn('schema_group_id'));
        }

        if (Schema::hasIndex('cms_sites', 'cms_sites_segment_unique')) {
            Schema::table('cms_sites', fn (Blueprint $table) => $table->dropUnique('cms_sites_segment_unique'));
        }
        foreach (['segment', 'metadata'] as $column) {
            if (Schema::hasColumn('cms_sites', $column)) {
                Schema::table('cms_sites', fn (Blueprint $table) => $table->dropColumn($column));
            }
        }

        Schema::table('cms_sites', function (Blueprint $table): void {
            if (! Schema::hasColumn('cms_sites', 'lang_id')) {
                $table->unsignedInteger('lang_id')->nullable()->after('theme_settings');
            }
            if (! Schema::hasColumn('cms_sites', 'title')) {
                $table->string('title')->nullable()->after('lang_id');
            }
            if (! Schema::hasColumn('cms_sites', 'description')) {
                $table->string('description', 500)->nullable()->after('title');
            }
            if (! Schema::hasColumn('cms_sites', 'favicon')) {
                $table->string('favicon', 2048)->nullable()->after('description');
            }
        });

        if (! $this->hasForeignKey('lang_id')) {
            Schema::table('cms_sites', fn (Blueprint $table) => $table->foreign('lang_id')->references('id')->on('cms_langs')->nullOnDelete());
        }
    }

    protected function hasForeignKey(string $column): bool
    {
        return collect(Schema::getForeignKeys('cms_sites'))->contains(fn (array $key): bool => $key['columns'] === [$column]);
    }

    public function down(): void
    {
        Schema::table('cms_sites', fn (Blueprint $table) => $table->dropForeign(['lang_id']));
        Schema::table('cms_sites', fn (Blueprint $table) => $table->dropColumn(['lang_id', 'title', 'description', 'favicon']));

        Schema::table('cms_sites', function (Blueprint $table): void {
            $table->string('segment', 25)->nullable()->unique()->after('name');
            $table->text('metadata')->nullable();
            $table->unsignedInteger('schema_group_id')->nullable();
            $table->foreign('schema_group_id')->references('id')->on('cms_schema_groups')->nullOnDelete();
        });
    }
};
