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
        $cmsMenu = AdmMenu::where('name', 'CMS')->first();
        if ($cmsMenu) {
            // Shift modules with position >= 4 to make room at position 4
            AdmModule::where('menu_id', $cmsMenu->id)
                ->where('position', '>=', 4)
                ->increment('position');

            $module = new AdmModule;
            $module->menu_id = $cmsMenu->id;
            $module->name = 'Plantillas';
            $module->url = '/admin/templates';
            $module->route = 'templates.index';
            $module->icon = 'file-code';
            $module->position = 4;
            $module->visible = true;
            $module->save();

            // Register action events (Listar = 1, Administrar = 2)
            $event1 = new AdmEvent;
            $event1->module_id = $module->id;
            $event1->action_id = 1;
            $event1->save();

            $event2 = new AdmEvent;
            $event2->module_id = $module->id;
            $event2->action_id = 2;
            $event2->save();
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $module = AdmModule::where('url', '/admin/templates')->first();
        if ($module) {
            $menuId = $module->menu_id;
            AdmEvent::where('module_id', $module->id)->delete();
            $module->delete();

            // Shift back modules with position > 4
            AdmModule::where('menu_id', $menuId)
                ->where('position', '>', 4)
                ->decrement('position');
        }
    }
};
