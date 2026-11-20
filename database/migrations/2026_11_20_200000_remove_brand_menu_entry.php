<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * "Marca del panel" left the sidebar (it now lives in the user menu's Settings, for super
 * admins): removes the entry an earlier version added, where it ran.
 */
return new class extends Migration
{
    public function up(): void
    {
        $ids = DB::table('adm_modules')->where('route', 'configs.brand')->pluck('id');
        if ($ids->isEmpty()) {
            return;
        }

        $events = DB::table('adm_events')->whereIn('module_id', $ids)->pluck('id');
        DB::table('adm_permissions')->whereIn('event_id', $events)->delete();
        DB::table('adm_events')->whereIn('id', $events)->delete();
        DB::table('adm_modules')->whereIn('id', $ids)->delete();
    }

    public function down(): void
    {
        // Nothing to bring back
    }
};
