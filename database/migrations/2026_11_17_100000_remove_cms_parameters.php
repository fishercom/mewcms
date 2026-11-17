<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * The Parameters module is gone: its admin menu entry and permissions are removed, and its
 * tables are dropped when they hold no rows. Tables with data are kept (and logged), so an
 * install that still had parameters loses nothing; they can be dropped by hand later.
 */
return new class extends Migration
{
    public function up(): void
    {
        $moduleIds = DB::table('adm_modules')->where('url', '/admin/parameters')->pluck('id');
        if ($moduleIds->isNotEmpty()) {
            $eventIds = DB::table('adm_events')->whereIn('module_id', $moduleIds)->pluck('id');
            DB::table('adm_permissions')->whereIn('event_id', $eventIds)->delete();
            DB::table('adm_events')->whereIn('id', $eventIds)->delete();
            DB::table('adm_modules')->whereIn('id', $moduleIds)->delete();
        }

        $parameters = Schema::hasTable('cms_parameters') ? DB::table('cms_parameters')->count() : 0;
        $groups = Schema::hasTable('cms_parameters_group') ? DB::table('cms_parameters_group')->count() : 0;

        if ($parameters === 0 && $groups === 0) {
            Schema::dropIfExists('cms_parameters');
            Schema::dropIfExists('cms_parameters_group');
        } else {
            Log::warning("cms_parameters ({$parameters} rows) and cms_parameters_group ({$groups} rows) were kept because they hold data.");
        }

        if (Schema::hasColumn('cms_registers', 'contact_id')) {
            Schema::table('cms_registers', function (Blueprint $table): void {
                $table->dropColumn('contact_id');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('cms_registers', 'contact_id')) {
            Schema::table('cms_registers', function (Blueprint $table): void {
                $table->integer('contact_id')->nullable();
            });
        }
    }
};
