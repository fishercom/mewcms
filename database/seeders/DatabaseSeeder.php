<?php

namespace Database\Seeders;

use App\Models\AdmAction;
use App\Models\AdmEvent;
use App\Models\AdmMenu;
use App\Models\AdmModule;
use App\Models\CmsConfig;
use App\Models\CmsLang;
use App\Models\CmsSchema;
use App\Models\CmsSchemaGroup;
use App\Models\CmsSite;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Guard against duplicate execution if database has already been seeded
        if (! app()->environment('testing') && User::count() > 0) {
            $this->command?->info('Database is already seeded. Skipping to prevent duplicate records.');

            return;
        }

        // 1. Languages
        $langEs = CmsLang::create(['name' => 'Español', 'iso' => 'es', 'active' => true]);
        CmsLang::create(['name' => 'English', 'iso' => 'en', 'active' => true]);

        // 2. Schema groups and sites
        $schgDefault = CmsSchemaGroup::create([
            'name' => 'Site Principal',
            'layout' => 'front',
            'default' => '1',
            'active' => true,
        ]);

        CmsSite::create([
            'name' => 'Site Principal',
            'site_url' => config('app.url'),
            'domains' => ['localhost', '127.0.0.1'],
            'theme' => 'default',
            'lang_id' => $langEs->id,
            'default' => '1',
            'active' => true,
        ]);

        // 3. Profiles
        $profileSa = Profile::create(['name' => 'Super', 'active' => true, 'sa' => '1']);
        Profile::create(['name' => 'Admin', 'active' => true]);
        Profile::create(['name' => 'Webmaster', 'active' => true]);

        // 4. Default Administrator User
        User::create([
            'username' => 'admincms',
            'email' => 'adminc@mewcms.com',
            'password' => 'pwdMewCMS+77',
            'name' => 'Admin CMS',
            'profile_id' => $profileSa->id,
            'active' => '1',
            'default' => '1',
        ]);

        // 5. Admin actions
        $actionList = AdmAction::create(['name' => 'Listar (solo lectura)', 'alias' => 'listar', 'write_log' => '0']);
        $actionAdmin = AdmAction::create(['name' => 'Administrar (agregar/modificar/eliminar)', 'alias' => 'administrar', 'write_log' => '1']);
        $actionLogin = AdmAction::create(['name' => 'Login (ingresar al sistema)', 'alias' => 'login', 'write_log' => '1']);
        $actionLogout = AdmAction::create(['name' => 'Logout (salir del sistema)', 'alias' => 'logout', 'write_log' => '1']);

        // 6. Admin Navigation Menus (Groups)
        $menuPrincipal = AdmMenu::create(['name' => 'Principal', 'position' => 0, 'visible' => true]);
        $menuContent = AdmMenu::create(['name' => 'Contenido', 'position' => 1, 'visible' => true]);
        $menuCms = AdmMenu::create(['name' => 'Estructura CMS', 'position' => 2, 'visible' => true]);
        $menuForms = AdmMenu::create(['name' => 'Formularios & Leads', 'position' => 3, 'visible' => true]);
        $menuAdmin = AdmMenu::create(['name' => 'Administración & Sistema', 'position' => 4, 'visible' => true]);

        // 7. Admin Modules
        $modules = [
            // Principal
            [
                'menu_id' => $menuPrincipal->id,
                'name' => 'Panel Principal',
                'url' => '/admin',
                'route' => 'admin.dashboard',
                'icon' => 'layout-dashboard',
                'position' => 0,
                'visible' => true,
            ],
            [
                'menu_id' => $menuPrincipal->id,
                'name' => 'Acceso',
                'url' => '/admin/login',
                'route' => 'login',
                'icon' => null,
                'position' => 0,
                'visible' => false,
                'custom_actions' => [$actionLogin->id, $actionLogout->id],
            ],

            // Contenido
            [
                'menu_id' => $menuContent->id,
                'name' => 'Páginas',
                'url' => '/admin/articles',
                'route' => 'articles.index',
                'icon' => 'file-text',
                'position' => 1,
                'visible' => true,
            ],
            [
                'menu_id' => $menuContent->id,
                'name' => 'Posts',
                'url' => '/admin/posts',
                'route' => 'posts.index',
                'icon' => 'pen-tool',
                'position' => 2,
                'visible' => true,
            ],
            [
                'menu_id' => $menuContent->id,
                'name' => 'Etiquetas',
                'url' => '/admin/tags',
                'route' => 'tags.index',
                'icon' => 'tags',
                'position' => 3,
                'visible' => true,
            ],
            [
                'menu_id' => $menuContent->id,
                'name' => 'Menús',
                'url' => '/admin/menus',
                'route' => 'menus.index',
                'icon' => 'menu',
                'position' => 4,
                'visible' => true,
            ],
            [
                'menu_id' => $menuContent->id,
                'name' => 'Biblioteca de Medios',
                'url' => '/admin/media',
                'route' => 'media.index',
                'icon' => 'image',
                'position' => 5,
                'visible' => true,
            ],
            [
                'menu_id' => $menuContent->id,
                'name' => 'Sliders',
                'url' => '/admin/sliders',
                'route' => 'sliders.index',
                'icon' => 'gallery-horizontal',
                'position' => 6,
                'visible' => true,
            ],
            [
                'menu_id' => $menuContent->id,
                'name' => 'Bloques reutilizables',
                'url' => '/admin/block-patterns',
                'route' => 'block-patterns.index',
                'icon' => 'blocks',
                'position' => 7,
                'visible' => true,
            ],

            // Estructura CMS
            [
                'menu_id' => $menuCms->id,
                'name' => 'Sitios Web',
                'url' => '/admin/sites',
                'route' => 'sites.index',
                'icon' => 'globe',
                'position' => 1,
                'visible' => true,
            ],
            [
                'menu_id' => $menuCms->id,
                'name' => 'Campos Personalizados',
                'url' => '/admin/schemas',
                'route' => 'schemas.index',
                'icon' => 'sliders-horizontal',
                'position' => 2,
                'visible' => true,
            ],
            [
                'menu_id' => $menuCms->id,
                'name' => 'Plantillas',
                'url' => '/admin/templates',
                'route' => 'templates.index',
                'icon' => 'file-code',
                'position' => 3,
                'visible' => true,
            ],
            [
                'menu_id' => $menuCms->id,
                'name' => 'Redirecciones',
                'url' => '/admin/redirects',
                'route' => 'redirects.index',
                'icon' => 'corner-up-right',
                'position' => 5,
                'visible' => true,
            ],
            [
                'menu_id' => $menuCms->id,
                'name' => 'Tipos de Contenido',
                'url' => '/admin/post-types',
                'route' => 'post-types.index',
                'icon' => 'file-box',
                'position' => 4,
                'visible' => true,
            ],

            // Formularios & Leads
            [
                'menu_id' => $menuForms->id,
                'name' => 'Formularios',
                'url' => '/admin/forms',
                'route' => 'forms.index',
                'icon' => 'file-text',
                'position' => 1,
                'visible' => true,
            ],
            [
                'menu_id' => $menuForms->id,
                'name' => 'Mensajes recibidos',
                'url' => '/admin/registers',
                'route' => 'registers.index',
                'icon' => 'inbox',
                'position' => 2,
                'visible' => true,
            ],
            [
                'menu_id' => $menuForms->id,
                'name' => 'Cuentas de correo',
                'url' => '/admin/notifies',
                'route' => 'notifies.index',
                'icon' => 'mail',
                'position' => 3,
                'visible' => true,
            ],

            // Administración & Sistema
            [
                'menu_id' => $menuAdmin->id,
                'name' => 'Personalizar Layout',
                'url' => '/admin/layout',
                'route' => 'layout.index',
                'icon' => 'palette',
                'position' => 1,
                'visible' => true,
            ],
            [
                'menu_id' => $menuAdmin->id,
                'name' => 'Usuarios',
                'url' => '/admin/users',
                'route' => 'users.index',
                'icon' => 'users',
                'position' => 2,
                'visible' => true,
            ],
            [
                'menu_id' => $menuAdmin->id,
                'name' => 'Perfiles',
                'url' => '/admin/profiles',
                'route' => 'profiles.index',
                'icon' => 'shield-check',
                'position' => 3,
                'visible' => true,
            ],
            [
                'menu_id' => $menuAdmin->id,
                'name' => 'Idiomas',
                'url' => '/admin/langs',
                'route' => 'langs.index',
                'icon' => 'languages',
                'position' => 5,
                'visible' => true,
            ],
            [
                'menu_id' => $menuAdmin->id,
                'name' => 'Traducciones',
                'url' => '/admin/translations',
                'route' => 'translations.index',
                'icon' => 'list-checks',
                'position' => 6,
                'visible' => true,
            ],
            [
                'menu_id' => $menuAdmin->id,
                'name' => 'Registro de Logs',
                'url' => '/admin/logs',
                'route' => 'logs.index',
                'icon' => 'activity',
                'position' => 7,
                'visible' => true,
            ],
            [
                'menu_id' => $menuAdmin->id,
                'name' => 'Asistente IA',
                'description' => 'Proveedores, modelos y consumo del asistente de contenido',
                'url' => '/admin/ai',
                'route' => 'ai.index',
                'icon' => 'sparkles',
                'position' => 9,
                'visible' => true,
            ],
        ];

        foreach ($modules as $modData) {
            $customActions = $modData['custom_actions'] ?? null;
            unset($modData['custom_actions']);

            $module = AdmModule::create($modData);

            if ($customActions) {
                foreach ($customActions as $actionId) {
                    AdmEvent::create(['module_id' => $module->id, 'action_id' => $actionId]);
                }
            } else {
                AdmEvent::create(['module_id' => $module->id, 'action_id' => $actionList->id]);
                AdmEvent::create(['module_id' => $module->id, 'action_id' => $actionAdmin->id]);
            }
        }

        // 8. An empty field group for every page template, so the page editor offers them all.
        // Pages, menus, sliders and forms are a site's content: a theme may ship them in
        // content/content.json (php artisan cms:content-import <theme>).
        CmsSchema::ensureTemplateDefaults();

        // 9. Layout Configurations
        $configs = [
            ['type' => 'string', 'name' => 'Logo de Cabecera (URL)', 'alias' => 'layout_header_logo', 'value' => null],
            ['type' => 'string', 'name' => 'Logo de Pie de Página (URL)', 'alias' => 'layout_footer_logo', 'value' => null],
            ['type' => 'string', 'name' => 'Texto Copyright', 'alias' => 'layout_copyright', 'value' => '© '.date('Y').' MewCMS. Desarrollado por <a href="https://deepsoft.lat" target="_blank" rel="noopener noreferrer">DeepSoft</a>.'],
            ['type' => 'json', 'name' => 'Redes sociales', 'alias' => 'layout_social_links', 'value' => '[]'],
            ['type' => 'text', 'name' => 'Custom CSS', 'alias' => 'layout_custom_css', 'value' => ''],
        ];

        foreach ($configs as $cfg) {
            CmsConfig::create($cfg);
        }
    }
}
