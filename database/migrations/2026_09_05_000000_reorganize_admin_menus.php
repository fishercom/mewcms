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
        // 1. Ensure Dashboard module is active and properly mapped
        $dashModule = AdmModule::where('id', 1)->first();
        if ($dashModule) {
            $dashModule->update([
                'name' => 'Panel Principal',
                'url' => '/admin',
                'route' => 'admin.dashboard',
                'icon' => 'layout-dashboard',
                'visible' => 1,
                'position' => 0,
            ]);
        }

        // 2. Set Groups and Positions
        // Group 1: Principal
        $groupMain = AdmMenu::find(1);
        if ($groupMain) {
            $groupMain->update(['name' => 'Principal', 'position' => 0, 'visible' => 1]);
            if ($dashModule) {
                $dashModule->update(['menu_id' => 1]);
            }
        }

        // Group 7: Contenido
        $groupContent = AdmMenu::find(7);
        if ($groupContent) {
            $groupContent->update(['name' => 'Contenido', 'position' => 1, 'visible' => 1]);
        }

        // Group 4: Estructura CMS
        $groupCms = AdmMenu::find(4);
        if ($groupCms) {
            $groupCms->update(['name' => 'Estructura CMS', 'position' => 2, 'visible' => 1]);
        }

        // Group 5: Formularios & Leads
        $groupForms = AdmMenu::find(5);
        if ($groupForms) {
            $groupForms->update(['name' => 'Formularios & Leads', 'position' => 3, 'visible' => 1]);
        }

        // Group 2: Administración & Sistema
        $groupAdmin = AdmMenu::find(2);
        if ($groupAdmin) {
            $groupAdmin->update(['name' => 'Administración & Sistema', 'position' => 4, 'visible' => 1]);
        }

        // Hide empty legacy groups (Website id 3, Módulos del Sistema id 6)
        AdmMenu::whereIn('id', [3, 6])->update(['visible' => 0]);

        // 3. Move and assign modules
        AdmModule::where('url', '/admin/articles')->update(['icon' => 'file-text', 'position' => 1]);
        AdmModule::where('url', '/admin/posts')->update(['icon' => 'pen-tool', 'position' => 2]);
        AdmModule::where('url', '/admin/taxonomies')->update(['icon' => 'tags', 'position' => 3]);
        AdmModule::where('url', '/admin/menus')->update(['icon' => 'menu', 'position' => 4]);
        AdmModule::where('url', '/admin/media')->update(['icon' => 'image', 'position' => 5]);
        AdmModule::where('url', '/admin/sliders')->update(['icon' => 'gallery-horizontal', 'position' => 6]);

        AdmModule::where('url', '/admin/schemas')->update(['icon' => 'sliders-horizontal']);

        AdmModule::where('url', '/admin/forms')->update(['menu_id' => 5, 'position' => 1, 'icon' => 'file-text']);
        AdmModule::where('url', '/admin/registers')->update(['menu_id' => 5, 'position' => 2, 'icon' => 'inbox']);
        AdmModule::where('url', '/admin/notifies')->update(['menu_id' => 5, 'position' => 3, 'icon' => 'mail']);

        AdmModule::where('url', '/admin/layout')->update(['menu_id' => 2, 'position' => 1, 'icon' => 'palette']);
        AdmModule::where('url', '/admin/users')->update(['menu_id' => 2, 'position' => 2, 'icon' => 'users']);
        AdmModule::where('url', '/admin/profiles')->update(['menu_id' => 2, 'position' => 3, 'icon' => 'shield-check']);
        AdmModule::where('url', '/admin/parameters')->update(['menu_id' => 2, 'position' => 4, 'icon' => 'settings']);
        AdmModule::where('url', '/admin/langs')->update(['menu_id' => 2, 'position' => 5, 'icon' => 'languages', 'visible' => 1]);
        AdmModule::where('url', '/admin/translates')->update(['menu_id' => 2, 'position' => 6, 'icon' => 'list-checks', 'visible' => 1]);
        AdmModule::where('url', '/admin/logs')->update(['menu_id' => 2, 'position' => 7, 'icon' => 'activity', 'visible' => 1]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reversible if needed
    }
};
