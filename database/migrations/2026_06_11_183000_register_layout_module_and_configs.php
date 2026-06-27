<?php

use App\Models\AdmEvent;
use App\Models\AdmMenu;
use App\Models\AdmModule;
use App\Models\CmsConfig;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Register Administrative Module (only if not already present)
        $contenidoWebMenu = AdmMenu::where('name', 'Contenido Web')->first();
        if ($contenidoWebMenu && ! AdmModule::where('url', '/admin/layout')->exists()) {
            // Shift modules in "Contenido Web" with position >= 5 to make room at position 5
            AdmModule::where('menu_id', $contenidoWebMenu->id)
                ->where('position', '>=', 5)
                ->increment('position');

            $module = new AdmModule;
            $module->menu_id = $contenidoWebMenu->id;
            $module->name = 'Configuración del Sitio';
            $module->url = '/admin/layout';
            $module->icon = 'palette';
            $module->position = 5;
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

        // 2. Hide the old "Configuración" module (replaced by this one)
        AdmModule::where('url', '/admin/configs')->update(['visible' => false]);

        // 3. Seed Layout Configuration Variables
        $configs = [
            ['type' => 'string', 'name' => 'Logo de Cabecera (URL)', 'alias' => 'layout_header_logo', 'value' => null],
            ['type' => 'string', 'name' => 'Logo de Pie de Página (URL)', 'alias' => 'layout_footer_logo', 'value' => null],
            ['type' => 'string', 'name' => 'Texto Copyright', 'alias' => 'layout_copyright', 'value' => '© '.date('Y').' MewCMS. Powered by Laravel, Inertia, and React.'],
            ['type' => 'string', 'name' => 'Facebook Link', 'alias' => 'layout_facebook', 'value' => ''],
            ['type' => 'string', 'name' => 'Instagram Link', 'alias' => 'layout_instagram', 'value' => ''],
            ['type' => 'string', 'name' => 'Twitter/X Link', 'alias' => 'layout_twitter', 'value' => ''],
            ['type' => 'string', 'name' => 'LinkedIn Link', 'alias' => 'layout_linkedin', 'value' => ''],
            ['type' => 'string', 'name' => 'YouTube Link', 'alias' => 'layout_youtube', 'value' => ''],
            ['type' => 'text', 'name' => 'Custom CSS', 'alias' => 'layout_custom_css', 'value' => ''],
        ];

        foreach ($configs as $config) {
            CmsConfig::updateOrCreate(
                ['alias' => $config['alias']],
                [
                    'type' => $config['type'],
                    'name' => $config['name'],
                    'value' => $config['value'],
                ]
            );
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 1. Remove Layout Configurations
        CmsConfig::where('alias', 'like', 'layout_%')->delete();

        // 2. Restore old "Configuración" module visibility
        AdmModule::where('url', '/admin/configs')->update(['visible' => true]);

        // 3. Unregister Module
        $module = AdmModule::where('url', '/admin/layout')->first();
        if ($module) {
            $menuId = $module->menu_id;
            AdmEvent::where('module_id', $module->id)->delete();
            $module->delete();

            // Shift back modules with position > 5
            AdmModule::where('menu_id', $menuId)
                ->where('position', '>', 5)
                ->decrement('position');
        }
    }
};
