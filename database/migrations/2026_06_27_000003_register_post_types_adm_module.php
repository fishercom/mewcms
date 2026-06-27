<?php

use App\Models\AdmEvent;
use App\Models\AdmMenu;
use App\Models\AdmModule;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Register "Tipos de Contenido" under CMS menu
        $cmsMenu = AdmMenu::where('name', 'CMS')->first();
        if ($cmsMenu && ! AdmModule::where('url', '/admin/post-types')->exists()) {
            $cptModule = new AdmModule;
            $cptModule->menu_id = $cmsMenu->id;
            $cptModule->name = 'Tipos de Contenido';
            $cptModule->url = '/admin/post-types';
            $cptModule->icon = 'layout-grid';
            $cptModule->position = 4;
            $cptModule->visible = true;
            $cptModule->save();

            // Register standard Listar (1) & Administrar (2) actions
            foreach ([1, 2] as $actionId) {
                $event = new AdmEvent;
                $event->module_id = $cptModule->id;
                $event->action_id = $actionId;
                $event->save();
            }
        }

        // 2. Register "Entradas (Blog)" under Contenido Web menu
        $webMenu = AdmMenu::where('name', 'Contenido Web')->first();
        if ($webMenu && ! AdmModule::where('url', '/admin/posts')->exists()) {
            // Shift modules in "Contenido Web" with position >= 2
            AdmModule::where('menu_id', $webMenu->id)
                ->where('position', '>=', 2)
                ->increment('position');

            $blogModule = new AdmModule;
            $blogModule->menu_id = $webMenu->id;
            $blogModule->name = 'Entradas (Blog)';
            $blogModule->url = '/admin/posts';
            $blogModule->icon = 'pen-tool';
            $blogModule->position = 2;
            $blogModule->visible = true;
            $blogModule->save();

            // Register standard Listar (1) & Administrar (2) actions
            foreach ([1, 2] as $actionId) {
                $event = new AdmEvent;
                $event->module_id = $blogModule->id;
                $event->action_id = $actionId;
                $event->save();
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove "Entradas (Blog)"
        $blogModule = AdmModule::where('url', '/admin/posts')->first();
        if ($blogModule) {
            $menuId = $blogModule->menu_id;
            $pos = $blogModule->position;
            AdmEvent::where('module_id', $blogModule->id)->delete();
            $blogModule->delete();

            // Shift modules back
            AdmModule::where('menu_id', $menuId)
                ->where('position', '>', $pos)
                ->decrement('position');
        }

        // Remove "Tipos de Contenido"
        $cptModule = AdmModule::where('url', '/admin/post-types')->first();
        if ($cptModule) {
            AdmEvent::where('module_id', $cptModule->id)->delete();
            $cptModule->delete();
        }
    }
};
