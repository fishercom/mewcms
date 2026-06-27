<?php

use App\Models\AdmAction;
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
        $contenidoWebMenu = AdmMenu::where('name', 'Contenido Web')->first();
        if ($contenidoWebMenu) {
            // Shift modules with position >= 3 to make room
            AdmModule::where('menu_id', $contenidoWebMenu->id)
                ->where('position', '>=', 3)
                ->increment('position');

            $module = AdmModule::where('url', '/admin/menus')->first();
            if (! $module) {
                // Create module from scratch if it didn't exist
                $module = new AdmModule;
                $module->menu_id = $contenidoWebMenu->id;
                $module->name = 'Menús';
                $module->url = '/admin/menus';
                $module->route = 'menus.index';
                $module->icon = 'menu';
                $module->position = 3;
                $module->visible = true;
                $module->save();

                // Register action events (Listar = 1, Administrar = 2)
                $actionLista = AdmAction::where('alias', 'listar')->first();
                $actionAdmin = AdmAction::where('alias', 'administrar')->first();

                if ($actionLista) {
                    $eventExists = AdmEvent::where('module_id', $module->id)
                        ->where('action_id', $actionLista->id)
                        ->exists();
                    if (! $eventExists) {
                        $event = new AdmEvent;
                        $event->module_id = $module->id;
                        $event->action_id = $actionLista->id;
                        $event->save();
                    }
                }
                if ($actionAdmin) {
                    $eventExists = AdmEvent::where('module_id', $module->id)
                        ->where('action_id', $actionAdmin->id)
                        ->exists();
                    if (! $eventExists) {
                        $event = new AdmEvent;
                        $event->module_id = $module->id;
                        $event->action_id = $actionAdmin->id;
                        $event->save();
                    }
                }
            } else {
                // Relocate existing module
                $oldMenuId = $module->menu_id;
                $oldPosition = $module->position;

                $module->menu_id = $contenidoWebMenu->id;
                $module->position = 3;
                $module->save();

                // Shift back modules in the old menu to close the gap
                AdmModule::where('menu_id', $oldMenuId)
                    ->where('position', '>', $oldPosition)
                    ->decrement('position');
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $module = AdmModule::where('url', '/admin/menus')->first();
        $cmsMenu = AdmMenu::where('name', 'CMS')->first();

        if ($module && $cmsMenu) {
            $oldMenuId = $module->menu_id;
            $oldPosition = $module->position;

            // Shift forward CMS menu items at position >= 6 to make room
            AdmModule::where('menu_id', $cmsMenu->id)
                ->where('position', '>=', 6)
                ->increment('position');

            // Move Menús back to CMS menu at position 6
            $module->menu_id = $cmsMenu->id;
            $module->position = 6;
            $module->save();

            // Shift back subsequent modules in the old menu
            AdmModule::where('menu_id', $oldMenuId)
                ->where('position', '>', $oldPosition)
                ->decrement('position');
        }
    }
};
