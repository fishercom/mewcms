<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * "Marca del panel" in the sidebar, under the group that holds Configuración: a shortcut to
 * Configuración > Marca, with no actions of its own (it follows Configuración's permissions).
 */
return new class extends Migration
{
    public function up(): void
    {
        $configs = DB::table('adm_modules')->where('route', 'configs.index')->first();
        if (! $configs || DB::table('adm_modules')->where('route', 'configs.brand')->exists()) {
            return;
        }

        $layout = DB::table('adm_modules')->where('route', 'layout.index')->where('menu_id', $configs->menu_id)->first();

        DB::table('adm_modules')->insert([
            'menu_id' => $configs->menu_id,
            'name' => 'Marca del panel',
            'description' => 'Logo del cliente en el panel y en el inicio de sesión',
            'url' => '/admin/configs/brand',
            'route' => 'configs.brand',
            'icon' => 'badge-check',
            'position' => $layout->position ?? $configs->position,
            'visible' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        DB::table('adm_modules')->where('route', 'configs.brand')->delete();
    }
};
