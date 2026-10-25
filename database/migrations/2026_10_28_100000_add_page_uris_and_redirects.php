<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Pages get a full path ("nosotros/historia") in `uri`, and `slug` keeps only the last
 * segment. Child slugs used to carry the parent slug ("nosotros-historia"); they are
 * shortened, and the old addresses redirect (301) to the new ones.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('cms_redirects')) {
            Schema::create('cms_redirects', function (Blueprint $table): void {
                $table->id();
                $table->string('from_path', 500)->unique();
                $table->string('to_path', 1000);
                $table->unsignedSmallInteger('status_code')->default(301);
                $table->unsignedInteger('hits')->default(0);
                $table->timestamp('last_hit_at')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasColumn('cms_articles', 'uri')) {
            Schema::table('cms_articles', function (Blueprint $table): void {
                $table->string('uri', 500)->nullable()->after('slug');
            });
        }

        $this->backfill();

        if (! Schema::hasIndex('cms_articles', 'cms_articles_lang_uri_unique')) {
            Schema::table('cms_articles', fn (Blueprint $table) => $table->unique(['lang_id', 'uri'], 'cms_articles_lang_uri_unique'));
        }

        $this->addAdminModule();
    }

    protected function backfill(): void
    {
        $pages = DB::table('cms_articles')->orderBy('id')->get(['id', 'parent_id', 'lang_id', 'slug'])->keyBy('id');
        $slugs = [];
        $uris = [];

        // Last segment: drop the parent slug that older versions prefixed to child slugs
        foreach ($pages as $page) {
            $slug = (string) $page->slug;
            $parent = $page->parent_id ? $pages->get($page->parent_id) : null;
            if ($parent) {
                foreach (['-', '_'] as $separator) {
                    $prefix = $parent->slug.$separator;
                    if (Str::startsWith($slug, $prefix) && strlen($slug) > strlen($prefix)) {
                        $slug = substr($slug, strlen($prefix));
                        break;
                    }
                }
            }
            $slugs[$page->id] = $slug !== '' ? $slug : 'pagina-'.$page->id;
        }

        $resolve = function (int $id, array $seen = []) use (&$resolve, $pages, $slugs, &$uris): string {
            if (isset($uris[$id])) {
                return $uris[$id];
            }
            $page = $pages->get($id);
            $parentId = $page->parent_id;
            // Guard against broken parent chains or cycles
            $prefix = ($parentId && $pages->has($parentId) && ! in_array($parentId, $seen, true))
                ? $resolve($parentId, [...$seen, $id]).'/'
                : '';

            return $uris[$id] = $prefix.$slugs[$id];
        };

        $taken = [];
        foreach ($pages as $page) {
            $uri = $resolve($page->id);

            // Keep paths unique per language
            $candidate = $uri;
            $n = 2;
            while (isset($taken[$page->lang_id][$candidate])) {
                $candidate = $uri.'-'.$n++;
            }
            if ($candidate !== $uri) {
                $slugs[$page->id] .= '-'.($n - 1);
                $uris[$page->id] = $candidate;
            }
            $taken[$page->lang_id][$candidate] = true;
        }

        $now = now();
        foreach ($pages as $page) {
            DB::table('cms_articles')->where('id', $page->id)->update(['slug' => $slugs[$page->id], 'uri' => $uris[$page->id]]);

            // The page used to live at "/{slug}"
            $from = '/'.$page->slug;
            $to = '/'.$uris[$page->id];
            if ($from !== $to && ! DB::table('cms_redirects')->where('from_path', $from)->exists()) {
                DB::table('cms_redirects')->insert(['from_path' => $from, 'to_path' => $to, 'status_code' => 301, 'hits' => 0, 'created_at' => $now, 'updated_at' => $now]);
            }
        }

        // A redirect must never hide a live page
        $live = collect($uris)->map(fn (string $uri): string => '/'.$uri)->all();
        DB::table('cms_redirects')->whereIn('from_path', $live)->delete();
    }

    protected function addAdminModule(): void
    {
        $sibling = DB::table('adm_modules')->where('route', 'schemas.index')->first();
        if (! $sibling || DB::table('adm_modules')->where('route', 'redirects.index')->exists()) {
            return;
        }

        $now = now();
        $moduleId = DB::table('adm_modules')->insertGetId([
            'menu_id' => $sibling->menu_id,
            'name' => 'Redirecciones',
            'url' => '/admin/redirects',
            'route' => 'redirects.index',
            'icon' => 'corner-up-right',
            'position' => (int) DB::table('adm_modules')->where('menu_id', $sibling->menu_id)->max('position') + 1,
            'visible' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        foreach (DB::table('adm_actions')->whereIn('alias', ['listar', 'administrar'])->pluck('id') as $actionId) {
            DB::table('adm_events')->insert(['module_id' => $moduleId, 'action_id' => $actionId, 'created_at' => $now, 'updated_at' => $now]);
        }
    }

    public function down(): void
    {
        $moduleId = DB::table('adm_modules')->where('route', 'redirects.index')->value('id');
        if ($moduleId) {
            DB::table('adm_permissions')->whereIn('event_id', DB::table('adm_events')->where('module_id', $moduleId)->pluck('id'))->delete();
            DB::table('adm_events')->where('module_id', $moduleId)->delete();
            DB::table('adm_modules')->where('id', $moduleId)->delete();
        }

        if (Schema::hasColumn('cms_articles', 'uri')) {
            Schema::table('cms_articles', function (Blueprint $table): void {
                $table->dropUnique('cms_articles_lang_uri_unique');
                $table->dropColumn('uri');
            });
        }

        // Shortened slugs are kept: they still work, now as the last segment
        Schema::dropIfExists('cms_redirects');
    }
};
