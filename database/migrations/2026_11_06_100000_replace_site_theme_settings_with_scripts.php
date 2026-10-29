<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Sites stop adjusting their theme (accent colours, font): each theme carries its own
 * design. Instead a site gets the external scripts it needs (Google Analytics, Tag
 * Manager, a pixel), printed in <head> and at the end of <body> of its public pages.
 *
 * Every step checks whether it already ran, so it finishes when re-run after a failed
 * attempt on MySQL.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('cms_sites', 'theme_settings')) {
            Schema::table('cms_sites', fn (Blueprint $table) => $table->dropColumn('theme_settings'));
        }

        Schema::table('cms_sites', function (Blueprint $table): void {
            if (! Schema::hasColumn('cms_sites', 'head_scripts')) {
                $table->text('head_scripts')->nullable()->after('favicon');
            }
            if (! Schema::hasColumn('cms_sites', 'body_scripts')) {
                $table->text('body_scripts')->nullable()->after('head_scripts');
            }
        });
    }

    public function down(): void
    {
        Schema::table('cms_sites', fn (Blueprint $table) => $table->dropColumn(['head_scripts', 'body_scripts']));
        Schema::table('cms_sites', fn (Blueprint $table) => $table->json('theme_settings')->nullable()->after('theme'));
    }
};
