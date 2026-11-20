<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * The generic Configuración module (/admin/configs, a raw editor of cms_configs) is gone: every
 * setting there has its own screen (Personalizar Layout, Asistente IA, Marca del panel). Its menu
 * entry and permissions are removed; its log entries move to Personalizar Layout so the history
 * stays. The cms_configs table and its rows are kept.
 */
return new class extends Migration
{
    public function up(): void
    {
        $moduleIds = DB::table('adm_modules')->where('route', 'configs.index')->orWhere('url', '/admin/configs')->pluck('id');
        if ($moduleIds->isEmpty()) {
            return;
        }

        $events = DB::table('adm_events')->whereIn('module_id', $moduleIds)->get(['id', 'action_id']);

        // Keep the history: each log moves to Personalizar Layout's event for the same action
        $layout = DB::table('adm_modules')->where('route', 'layout.index')->value('id');
        foreach ($events as $event) {
            $target = $layout ? DB::table('adm_events')->where('module_id', $layout)->where('action_id', $event->action_id)->value('id') : null;
            if ($target) {
                DB::table('adm_logs')->where('event_id', $event->id)->update(['event_id' => $target]);
            }
        }

        $eventIds = $events->pluck('id');
        DB::table('adm_permissions')->whereIn('event_id', $eventIds)->delete();
        DB::table('adm_events')->whereIn('id', $eventIds)->delete();
        DB::table('adm_modules')->whereIn('id', $moduleIds)->delete();
    }

    public function down(): void
    {
        // Nothing to bring back: the screen is gone
    }
};
