<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Menus can add new pages by themselves, like WordPress: top-level pages, and
 * optionally subpages under their parent's item. The main menu starts with it on.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cms_menus', function (Blueprint $table): void {
            if (! Schema::hasColumn('cms_menus', 'auto_add_pages')) {
                $table->boolean('auto_add_pages')->default(false)->after('description');
            }
            if (! Schema::hasColumn('cms_menus', 'auto_add_subpages')) {
                $table->boolean('auto_add_subpages')->default(false)->after('auto_add_pages');
            }
        });

        DB::table('cms_menus')->whereIn('slug', ['main', 'principal', 'header', 'main-menu', 'menu-principal'])->update(['auto_add_pages' => true]);
    }

    public function down(): void
    {
        Schema::table('cms_menus', function (Blueprint $table): void {
            $table->dropColumn(['auto_add_pages', 'auto_add_subpages']);
        });
    }
};
