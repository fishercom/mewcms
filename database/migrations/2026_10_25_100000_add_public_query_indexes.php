<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Indexes for the queries every public page runs: navigation, post listings and layout settings.
 */
return new class extends Migration
{
    /**
     * @var array<string, array{name: string, columns: list<string>}>
     */
    private array $indexes = [
        'cms_articles' => ['name' => 'cms_articles_active_parent_position_index', 'columns' => ['active', 'parent_id', 'position']],
        'cms_posts' => ['name' => 'cms_posts_type_status_active_published_index', 'columns' => ['post_type', 'status', 'active', 'published_at']],
        'cms_configs' => ['name' => 'cms_configs_alias_index', 'columns' => ['alias']],
    ];

    public function up(): void
    {
        foreach ($this->indexes as $table => $index) {
            if (! Schema::hasIndex($table, $index['name'])) {
                Schema::table($table, fn (Blueprint $blueprint) => $blueprint->index($index['columns'], $index['name']));
            }
        }
    }

    public function down(): void
    {
        foreach ($this->indexes as $table => $index) {
            if (Schema::hasIndex($table, $index['name'])) {
                Schema::table($table, fn (Blueprint $blueprint) => $blueprint->dropIndex($index['name']));
            }
        }
    }
};
