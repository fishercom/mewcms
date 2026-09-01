<?php

namespace Database\Seeders;

use App\Models\AdmAction;
use App\Models\AdmEvent;
use App\Models\AdmMenu;
use App\Models\AdmModule;
use Illuminate\Database\Seeder;

class AdmModulesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $actions = AdmAction::all();
        $listar = $actions->where('alias', 'listar')->first() ?? AdmAction::find(1);
        $admin = $actions->where('alias', 'administrar')->first() ?? AdmAction::find(2);

        $modulesData = [
            // Administración
            'Administración' => [
                ['name' => 'Usuarios', 'title' => 'usuario', 'url' => '/admin/users', 'route' => 'users.index', 'icon' => 'users', 'position' => 1],
                ['name' => 'Perfiles', 'title' => 'perfil', 'url' => '/admin/profiles', 'route' => 'profiles.index', 'icon' => 'flask-conical', 'position' => 2],
                ['name' => 'Registro de Logs', 'title' => 'log', 'url' => '/admin/logs', 'route' => 'logs.index', 'icon' => 'book', 'position' => 3],
            ],
            // Website
            'Website' => [
                ['name' => 'Idiomas', 'title' => 'idioma', 'url' => '/admin/langs', 'route' => 'langs.index', 'icon' => 'languages', 'position' => 1],
                ['name' => 'Traducciones', 'title' => 'traducción', 'url' => '/admin/translates', 'route' => 'translates.index', 'icon' => 'list', 'position' => 2],
                ['name' => 'Diseño / Layout', 'title' => 'layout', 'url' => '/admin/layout', 'route' => 'layout.index', 'icon' => 'palette', 'position' => 3],
            ],
            // CMS
            'CMS' => [
                ['name' => 'Configuración', 'title' => 'configuración', 'url' => '/admin/configs', 'route' => 'configs.index', 'icon' => 'settings', 'position' => 1],
                ['name' => 'Sites', 'title' => 'site', 'url' => '/admin/sites', 'route' => 'sites.index', 'icon' => 'globe', 'position' => 2],
                ['name' => 'Campos Personalizados', 'title' => 'esquema', 'url' => '/admin/schemas', 'route' => 'schemas.index', 'icon' => 'shuffle', 'position' => 3],
                ['name' => 'Tipos de Contenido', 'title' => 'post-types', 'url' => '/admin/post-types', 'route' => 'post-types.index', 'icon' => 'layout-grid', 'position' => 4],
                ['name' => 'Taxonomías', 'title' => 'taxonomías', 'url' => '/admin/taxonomies', 'route' => 'taxonomies.index', 'icon' => 'tag', 'position' => 5],
                ['name' => 'Menús', 'title' => 'menús', 'url' => '/admin/menus', 'route' => 'menus.index', 'icon' => 'menu', 'position' => 6],
                ['name' => 'Sliders', 'title' => 'sliders', 'url' => '/admin/sliders', 'route' => 'sliders.index', 'icon' => 'images', 'position' => 7],
            ],
            // Formularios
            'Formularios' => [
                ['name' => 'Formularios', 'title' => 'formulario', 'url' => '/admin/forms', 'route' => 'forms.index', 'icon' => 'file-text', 'position' => 1],
                ['name' => 'Mensajes recibidos', 'title' => 'mensaje', 'url' => '/admin/registers', 'route' => 'registers.index', 'icon' => 'inbox', 'position' => 2],
                ['name' => 'Cuentas de correo', 'title' => 'cuenta', 'url' => '/admin/notifies', 'route' => 'notifies.index', 'icon' => 'mail', 'position' => 3],
            ],
            // Módulos del Sistema
            'Módulos del Sistema' => [
                ['name' => 'Parámetros', 'title' => 'parámetro', 'url' => '/admin/parameters', 'route' => 'parameters.index', 'icon' => 'sliders', 'position' => 1],
            ],
            // Contenido Web
            'Contenido Web' => [
                ['name' => 'Páginas', 'title' => 'contenido', 'url' => '/admin/articles', 'route' => 'articles.index', 'icon' => 'file-text', 'position' => 1],
                ['name' => 'Entradas (Blog)', 'title' => 'entradas', 'url' => '/admin/posts', 'route' => 'posts.index', 'icon' => 'newspaper', 'position' => 2],
                ['name' => 'Biblioteca de Medios', 'title' => 'medios', 'url' => '/admin/media', 'route' => 'media.index', 'icon' => 'folder-open', 'position' => 3],
            ],
        ];

        foreach ($modulesData as $menuName => $items) {
            $menu = AdmMenu::where('name', $menuName)->first();
            if (! $menu) {
                continue;
            }

            foreach ($items as $itemData) {
                $module = AdmModule::updateOrCreate(
                    ['url' => $itemData['url']],
                    [
                        'menu_id' => $menu->id,
                        'name' => $itemData['name'],
                        'title' => $itemData['title'],
                        'route' => $itemData['route'],
                        'icon' => $itemData['icon'],
                        'position' => $itemData['position'],
                        'visible' => true,
                    ]
                );

                if ($listar) {
                    AdmEvent::firstOrCreate([
                        'module_id' => $module->id,
                        'action_id' => $listar->id,
                    ]);
                }

                if ($admin) {
                    AdmEvent::firstOrCreate([
                        'module_id' => $module->id,
                        'action_id' => $admin->id,
                    ]);
                }
            }
        }
    }
}
