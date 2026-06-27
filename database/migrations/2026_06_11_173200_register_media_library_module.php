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
        $contenidoWebMenu = AdmMenu::where('name', 'Contenido Web')->first();
        if ($contenidoWebMenu) {
            // Shift modules in "Contenido Web" with position >= 4 to make room at position 4
            AdmModule::where('menu_id', $contenidoWebMenu->id)
                ->where('position', '>=', 4)
                ->increment('position');

            $module = new AdmModule;
            $module->menu_id = $contenidoWebMenu->id;
            $module->name = 'Biblioteca de Medios';
            $module->url = '/admin/media';
            $module->icon = 'folder-open';
            $module->position = 4;
            $module->visible = true;
            $module->save();

            // Register actions: Listar (1) & Administrar (2)
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
        $module = AdmModule::where('url', '/admin/media')->first();
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
