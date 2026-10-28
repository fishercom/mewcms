<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Multisite and themes. Sites get their domains and theme; pages, posts, menus,
 * sliders, forms and redirects belong to a site, and their unique keys (slug, uri,
 * alias...) become unique per site. Layout settings may be set per site; a setting
 * without a site applies to every site.
 *
 * Existing content moves to the default site (created from APP_URL when an install
 * with content has no site yet).
 */
return new class extends Migration
{
    /**
     * Unique keys that become per site: table => [old index, columns, new index].
     *
     * @var array<string, array{0: string, 1: list<string>, 2: string}>
     */
    private array $uniques = [
        'cms_articles' => ['cms_articles_lang_uri_unique', ['lang_id', 'uri'], 'cms_articles_site_lang_uri_unique'],
        'cms_posts' => ['cms_posts_slug_unique', ['slug'], 'cms_posts_site_slug_unique'],
        'cms_menus' => ['cms_menus_slug_unique', ['slug'], 'cms_menus_site_slug_unique'],
        'cms_sliders' => ['cms_sliders_key_unique', ['key'], 'cms_sliders_site_key_unique'],
        'cms_forms' => ['cms_forms_alias_unique', ['alias'], 'cms_forms_site_alias_unique'],
        'cms_redirects' => ['cms_redirects_from_path_unique', ['from_path'], 'cms_redirects_site_from_path_unique'],
    ];

    /**
     * Safe to run again after a failed attempt: MySQL does not roll back schema changes,
     * so every step checks whether it already happened.
     */
    public function up(): void
    {
        Schema::table('cms_sites', function (Blueprint $table): void {
            if (! Schema::hasColumn('cms_sites', 'domains')) {
                $table->json('domains')->nullable()->after('site_url');
            }
            if (! Schema::hasColumn('cms_sites', 'theme')) {
                $table->string('theme', 50)->default('default')->after('domains');
            }
            if (! Schema::hasColumn('cms_sites', 'theme_settings')) {
                $table->json('theme_settings')->nullable()->after('theme');
            }
            $table->string('site_url')->nullable()->change();
            $table->unsignedInteger('schema_group_id')->nullable()->change();
        });

        foreach ([...array_keys($this->uniques), 'cms_configs'] as $table) {
            if (! Schema::hasColumn($table, 'site_id')) {
                Schema::table($table, fn (Blueprint $blueprint) => $blueprint->unsignedInteger('site_id')->nullable()->after('id'));
            }
            if (! $this->hasForeignKey($table, 'site_id')) {
                Schema::table($table, fn (Blueprint $blueprint) => $blueprint->foreign('site_id')->references('id')->on('cms_sites')->restrictOnDelete());
            }
        }

        $siteId = $this->defaultSiteId();
        if ($siteId !== null) {
            foreach (array_keys($this->uniques) as $table) {
                DB::table($table)->whereNull('site_id')->update(['site_id' => $siteId]);
            }
        }

        // MySQL backs the lang_id foreign key with the old (lang_id, uri) index: give it
        // its own index before that one goes
        if (! Schema::hasIndex('cms_articles', 'cms_articles_lang_id_index')) {
            Schema::table('cms_articles', fn (Blueprint $table) => $table->index('lang_id', 'cms_articles_lang_id_index'));
        }

        foreach ($this->uniques as $table => [$old, $columns, $new]) {
            if (! Schema::hasIndex($table, $new)) {
                Schema::table($table, fn (Blueprint $blueprint) => $blueprint->unique(['site_id', ...$columns], $new));
            }
            if (Schema::hasIndex($table, $old)) {
                Schema::table($table, fn (Blueprint $blueprint) => $blueprint->dropUnique($old));
            }
        }

        if (! Schema::hasIndex('cms_configs', 'cms_configs_site_alias_index')) {
            Schema::table('cms_configs', fn (Blueprint $table) => $table->index(['site_id', 'alias'], 'cms_configs_site_alias_index'));
        }
    }

    protected function hasForeignKey(string $table, string $column): bool
    {
        return collect(Schema::getForeignKeys($table))->contains(fn (array $key): bool => $key['columns'] === [$column]);
    }

    /**
     * The default (or first) site; one is created when there is content but no site.
     */
    protected function defaultSiteId(): ?int
    {
        $site = DB::table('cms_sites')->orderByDesc('default')->orderBy('id')->first();
        if ($site) {
            DB::table('cms_sites')->where('id', $site->id)->update(['default' => true]);

            return $site->id;
        }

        $hasContent = collect(array_keys($this->uniques))->contains(fn (string $table): bool => DB::table($table)->exists());
        if (! $hasContent) {
            return null;
        }

        $url = (string) config('app.url');
        $host = parse_url($url, PHP_URL_HOST);

        return DB::table('cms_sites')->insertGetId([
            'name' => (string) config('app.name', 'MewCMS'),
            'site_url' => $url ?: null,
            'domains' => json_encode($host ? [strtolower($host)] : []),
            'theme' => 'default',
            'schema_group_id' => DB::table('cms_schema_groups')->orderByDesc('default')->orderBy('id')->value('id'),
            'default' => true,
            'active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        // Foreign keys first: MySQL will not drop an index a foreign key relies on
        foreach ([...array_keys($this->uniques), 'cms_configs'] as $table) {
            Schema::table($table, fn (Blueprint $blueprint) => $blueprint->dropForeign(['site_id']));
        }

        Schema::table('cms_configs', fn (Blueprint $table) => $table->dropIndex('cms_configs_site_alias_index'));

        // Settings saved for one site only are dropped: the shared ones stay
        DB::table('cms_configs')->whereNotNull('site_id')->delete();

        foreach ($this->uniques as $table => [$old, $columns, $new]) {
            Schema::table($table, function (Blueprint $blueprint) use ($old, $columns, $new): void {
                $blueprint->unique($columns, $old);
                $blueprint->dropUnique($new);
            });
        }

        Schema::table('cms_articles', fn (Blueprint $table) => $table->dropIndex('cms_articles_lang_id_index'));

        foreach ([...array_keys($this->uniques), 'cms_configs'] as $table) {
            Schema::table($table, fn (Blueprint $blueprint) => $blueprint->dropColumn('site_id'));
        }

        Schema::table('cms_sites', function (Blueprint $table): void {
            $table->dropColumn(['domains', 'theme', 'theme_settings']);
        });
    }
};
