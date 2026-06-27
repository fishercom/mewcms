<?php

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
        $taxonomiesModule = AdmModule::where('url', '/admin/taxonomies')->first();
        $contenidoWebMenu = AdmMenu::where('name', 'Contenido Web')->first();

        if ($taxonomiesModule && $contenidoWebMenu) {
            $oldMenuId = $taxonomiesModule->menu_id;
            $oldPosition = $taxonomiesModule->position;

            // Make room in Contenido Web at position >= 2 (Páginas is position 1)
            AdmModule::where('menu_id', $contenidoWebMenu->id)
                ->where('position', '>=', 2)
                ->increment('position');

            // Move Taxonomías to Contenido Web menu at position 2
            $taxonomiesModule->menu_id = $contenidoWebMenu->id;
            $taxonomiesModule->position = 2;
            $taxonomiesModule->save();

            // Shift back subsequent modules in the old CMS menu to close the gap
            AdmModule::where('menu_id', $oldMenuId)
                ->where('position', '>', $oldPosition)
                ->decrement('position');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $taxonomiesModule = AdmModule::where('url', '/admin/taxonomies')->first();
        $cmsMenu = AdmMenu::where('name', 'CMS')->first();

        if ($taxonomiesModule && $cmsMenu) {
            $oldMenuId = $taxonomiesModule->menu_id;
            $oldPosition = $taxonomiesModule->position;

            // Shift forward CMS menu items at position >= 6 to restore position 6
            AdmModule::where('menu_id', $cmsMenu->id)
                ->where('position', '>=', 6)
                ->increment('position');

            // Move Taxonomías back to CMS menu at position 6
            $taxonomiesModule->menu_id = $cmsMenu->id;
            $taxonomiesModule->position = 6;
            $taxonomiesModule->save();

            // Shift back subsequent modules in the Contenido Web menu
            AdmModule::where('menu_id', $oldMenuId)
                ->where('position', '>', $oldPosition)
                ->decrement('position');
        }
    }
};
