<?php

use App\Support\ThemeTexts;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Translations become the texts of a site's theme: each theme ships its texts by key
 * ("shop.from_price") in resources/themes/<slug>/lang/<locale>.json, and a site only
 * stores the ones it changes, one row per key and language (BCP 47 tag, "es", "pt-BR").
 *
 * Replaces cms_translates (an alias with one value per language, which nothing read):
 * its values are copied to every site, then the table goes. Sites also get a currency
 * (ISO 4217), the default of their price fields.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('cms_translations')) {
            Schema::create('cms_translations', function (Blueprint $table): void {
                $table->id();
                $table->unsignedInteger('site_id')->nullable();
                $table->string('locale', 16);
                $table->string('key', 191);
                $table->text('value');
                $table->timestamps();

                $table->unique(['site_id', 'locale', 'key']);
                $table->foreign('site_id')->references('id')->on('cms_sites')->cascadeOnDelete();
            });
        }

        if (! Schema::hasColumn('cms_sites', 'currency')) {
            Schema::table('cms_sites', fn (Blueprint $table) => $table->char('currency', 3)->nullable()->after('lang_id'));
        }

        if (Schema::hasTable('cms_translates')) {
            $this->copyOldTranslations();
            Schema::drop('cms_translates');
        }

        DB::table('adm_modules')->where('route', 'translates.index')->update([
            'name' => 'Traducciones',
            'url' => '/admin/translations',
            'route' => 'translations.index',
            'updated_at' => now(),
        ]);
    }

    /**
     * Each old value goes to every site (or, with no sites, to no site), in its language
     * and under its alias as the key.
     */
    protected function copyOldTranslations(): void
    {
        $siteIds = DB::table('cms_sites')->orderBy('id')->pluck('id')->all() ?: [null];
        $now = now();

        foreach (DB::table('cms_translates')->orderBy('id')->get() as $old) {
            $key = mb_substr(trim((string) $old->alias), 0, 191);
            foreach ((array) json_decode((string) $old->metadata, true) as $entry) {
                if ($key === '' || ! is_array($entry) || ! is_string($entry['iso'] ?? null) || ! is_string($entry['value'] ?? null) || $entry['value'] === '') {
                    continue;
                }
                $locale = ThemeTexts::normalizeLocale($entry['iso']);
                foreach ($siteIds as $siteId) {
                    $taken = DB::table('cms_translations')->where('site_id', $siteId)->where('locale', $locale)->where('key', $key)->exists();
                    if (! $taken) {
                        DB::table('cms_translations')->insert(['site_id' => $siteId, 'locale' => $locale, 'key' => $key, 'value' => $entry['value'], 'created_at' => $now, 'updated_at' => $now]);
                    }
                }
            }
        }
    }

    public function down(): void
    {
        DB::table('adm_modules')->where('route', 'translations.index')->update([
            'url' => '/admin/translates',
            'route' => 'translates.index',
            'updated_at' => now(),
        ]);

        if (! Schema::hasTable('cms_translates')) {
            Schema::create('cms_translates', function (Blueprint $table): void {
                $table->increments('id');
                $table->string('alias')->index();
                $table->tinyInteger('input_type')->unsigned();
                $table->json('metadata')->nullable();
                $table->timestamps();
            });
        }

        if (Schema::hasColumn('cms_sites', 'currency')) {
            Schema::table('cms_sites', fn (Blueprint $table) => $table->dropColumn('currency'));
        }

        Schema::dropIfExists('cms_translations');
    }
};
