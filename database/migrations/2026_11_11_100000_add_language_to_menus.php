<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Each language of a site has its own menus (the English "main" menu next to the Spanish
 * one). The menus there are now belong to their site's main language.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cms_menus', function (Blueprint $table): void {
            $table->unsignedInteger('lang_id')->nullable()->after('site_id');
            $table->foreign('lang_id')->references('id')->on('cms_langs')->nullOnDelete();
        });

        foreach (DB::table('cms_sites')->whereNotNull('lang_id')->get(['id', 'lang_id']) as $site) {
            DB::table('cms_menus')->where('site_id', $site->id)->whereNull('lang_id')->update(['lang_id' => $site->lang_id]);
        }

        Schema::table('cms_menus', function (Blueprint $table): void {
            $table->unique(['site_id', 'lang_id', 'slug'], 'cms_menus_site_lang_slug_unique');
        });
        Schema::table('cms_menus', function (Blueprint $table): void {
            $table->dropUnique('cms_menus_site_slug_unique');
        });
    }

    public function down(): void
    {
        Schema::table('cms_menus', function (Blueprint $table): void {
            $table->unique(['site_id', 'slug'], 'cms_menus_site_slug_unique');
        });
        Schema::table('cms_menus', function (Blueprint $table): void {
            $table->dropUnique('cms_menus_site_lang_slug_unique');
            $table->dropForeign(['lang_id']);
            $table->dropColumn('lang_id');
        });
    }
};
