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
        $webMenu = AdmMenu::where('name', 'Contenido Web')->first();
        if ($webMenu && ! AdmModule::where('url', '/admin/forms')->exists()) {
            $nextPos = AdmModule::where('menu_id', $webMenu->id)->max('position') + 1;

            $module = new AdmModule;
            $module->menu_id = $webMenu->id;
            $module->name = 'Formularios';
            $module->url = '/admin/forms';
            $module->icon = 'file-question'; // Lucide question file icon
            $module->position = $nextPos;
            $module->setAttribute('visible', true);
            $module->save();

            // Register standard Listar (1) & Administrar (2) actions
            foreach ([1, 2] as $actionId) {
                $event = new AdmEvent;
                $event->module_id = $module->id;
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
        $module = AdmModule::where('url', '/admin/forms')->first();
        if ($module) {
            AdmEvent::where('module_id', $module->id)->delete();
            $module->delete();
        }
    }
};
