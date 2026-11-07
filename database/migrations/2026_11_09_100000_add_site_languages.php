<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * One site, several languages. The site's main language stays in cms_sites.lang_id (its
 * pages have no prefix: /nosotros); the extra languages are listed in cms_site_langs and
 * answer under their code (/en/about).
 *
 * The versions of one page or post in each language share a translation_group, which is
 * how the language switcher and hreflang find them. Post slugs become unique per
 * language, like page addresses already were.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cms_site_langs', function (Blueprint $table): void {
            $table->id();
            $table->unsignedInteger('site_id');
            $table->unsignedInteger('lang_id');
            $table->timestamps();

            $table->unique(['site_id', 'lang_id']);
            $table->foreign('site_id')->references('id')->on('cms_sites')->cascadeOnDelete();
            $table->foreign('lang_id')->references('id')->on('cms_langs')->cascadeOnDelete();
        });

        foreach (['cms_articles', 'cms_posts'] as $table) {
            Schema::table($table, function (Blueprint $table): void {
                $table->uuid('translation_group')->nullable()->index();
            });
        }

        // A post and its translation may share a slug (/blog/hello, /en/blog/hello), as pages do
        Schema::table('cms_posts', function (Blueprint $table): void {
            $table->unique(['site_id', 'lang_id', 'slug'], 'cms_posts_site_lang_slug_unique');
        });
        Schema::table('cms_posts', function (Blueprint $table): void {
            $table->dropUnique('cms_posts_site_slug_unique');
        });

        $this->moveContentToSiteLanguage();
    }

    /**
     * Until now a site held the content of one language, whatever language each page was
     * saved in. From now on a page in another language belongs to that language's version
     * of the site (/en/...), so every page and post takes its site's language, unless the
     * site already has one at the same address in that language.
     */
    private function moveContentToSiteLanguage(): void
    {
        $keys = ['cms_articles' => 'uri', 'cms_posts' => 'slug'];

        foreach (DB::table('cms_sites')->whereNotNull('lang_id')->get(['id', 'lang_id']) as $site) {
            foreach ($keys as $table => $key) {
                $taken = DB::table($table)->where('site_id', $site->id)->where('lang_id', $site->lang_id)->pluck($key)->flip();
                $rows = DB::table($table)->where('site_id', $site->id)
                    ->where(fn ($query) => $query->whereNull('lang_id')->orWhere('lang_id', '!=', $site->lang_id))
                    ->orderBy('id')
                    ->get(['id', $key]);

                foreach ($rows as $row) {
                    if ($taken->has($row->{$key})) {
                        continue;
                    }
                    DB::table($table)->where('id', $row->id)->update(['lang_id' => $site->lang_id]);
                    $taken->put($row->{$key}, true);
                }
            }
        }
    }

    public function down(): void
    {
        Schema::table('cms_posts', function (Blueprint $table): void {
            $table->unique(['site_id', 'slug'], 'cms_posts_site_slug_unique');
        });
        Schema::table('cms_posts', function (Blueprint $table): void {
            $table->dropUnique('cms_posts_site_lang_slug_unique');
        });

        foreach (['cms_articles', 'cms_posts'] as $table) {
            Schema::table($table, function (Blueprint $table): void {
                $table->dropIndex(['translation_group']);
                $table->dropColumn('translation_group');
            });
        }

        Schema::dropIfExists('cms_site_langs');
    }
};
