<?php

namespace Database\Seeders;

use App\Models\AdmAction;
use App\Models\AdmEvent;
use App\Models\AdmMenu;
use App\Models\AdmModule;
use App\Models\CmsArticle;
use App\Models\CmsConfig;
use App\Models\CmsForm;
use App\Models\CmsLang;
use App\Models\CmsMenu;
use App\Models\CmsMenuItem;
use App\Models\CmsParameterGroup;
use App\Models\CmsSchema;
use App\Models\CmsSchemaGroup;
use App\Models\CmsSite;
use App\Models\CmsSlide;
use App\Models\CmsSlider;
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
            'site_url' => 'http://localhost/lasbambas-reconocimientos',
            'schema_group_id' => $schgDefault->id,
            'default' => '1',
            'active' => true,
        ]);

        // 3. Parameter groups and forms
        CmsParameterGroup::create(['name' => 'Asunto de Contacto', 'alias' => 'asunto', 'active' => true]);
        CmsForm::create(['name' => 'Formulario de Contacto', 'alias' => 'contacto', 'active' => true]);

        // 4. Profiles
        $profileSa = Profile::create(['name' => 'Super', 'active' => true, 'sa' => '1']);
        Profile::create(['name' => 'Admin', 'active' => true]);
        Profile::create(['name' => 'Webmaster', 'active' => true]);

        // 5. Default Administrator User
        User::create([
            'username' => 'fischer',
            'email' => 'fishdev@gmail.com',
            'password' => 'admin$2277',
            'name' => 'Administrador',
            'profile_id' => $profileSa->id,
            'active' => '1',
            'default' => '1',
        ]);

        // 6. Admin actions
        $actionList = AdmAction::create(['name' => 'Listar (solo lectura)', 'alias' => 'listar', 'write_log' => '0']);
        $actionAdmin = AdmAction::create(['name' => 'Administrar (agregar/modificar/eliminar)', 'alias' => 'administrar', 'write_log' => '1']);
        $actionLogin = AdmAction::create(['name' => 'Login (ingresar al sistema)', 'alias' => 'login', 'write_log' => '1']);
        $actionLogout = AdmAction::create(['name' => 'Logout (salir del sistema)', 'alias' => 'logout', 'write_log' => '1']);

        // 7. Admin Navigation Menus (Groups)
        $menuPrincipal = AdmMenu::create(['name' => 'Principal', 'position' => 0, 'visible' => true]);
        $menuContent = AdmMenu::create(['name' => 'Contenido', 'position' => 1, 'visible' => true]);
        $menuCms = AdmMenu::create(['name' => 'Estructura CMS', 'position' => 2, 'visible' => true]);
        $menuForms = AdmMenu::create(['name' => 'Formularios & Leads', 'position' => 3, 'visible' => true]);
        $menuAdmin = AdmMenu::create(['name' => 'Administración & Sistema', 'position' => 4, 'visible' => true]);

        // 8. Admin Modules
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
                'name' => 'Taxonomías',
                'url' => '/admin/taxonomies',
                'route' => 'taxonomies.index',
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

            // Estructura CMS
            [
                'menu_id' => $menuCms->id,
                'name' => 'Sites',
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
                'name' => 'Parámetros',
                'url' => '/admin/parameters',
                'route' => 'parameters.index',
                'icon' => 'settings',
                'position' => 4,
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
                'url' => '/admin/translates',
                'route' => 'translates.index',
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
                'name' => 'Configuración',
                'url' => '/admin/configs',
                'route' => 'configs.index',
                'icon' => 'cog',
                'position' => 8,
                'visible' => false,
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

        // 9. Base Schemas
        $homeSchema = CmsSchema::create([
            'group_id' => $schgDefault->id,
            'name' => 'Home Page',
            'fields' => [
                ['name' => 'Hero Title', 'alias' => 'hero_title', 'type' => 'text'],
                ['name' => 'Hero Subtitle', 'alias' => 'hero_subtitle', 'type' => 'text'],
                ['name' => 'Hero Description', 'alias' => 'hero_description', 'type' => 'textarea'],
            ],
            'iterations' => 1,
            'type' => 'PAGE',
            'front_view' => 'front/templates/home',
            'active' => 1,
        ]);

        CmsSchema::create([
            'group_id' => $schgDefault->id,
            'name' => 'Options Page',
            'fields' => [],
            'iterations' => 1,
            'type' => 'PAGE',
            'active' => 1,
        ]);

        // 10. Demo Home Slider
        $homeSlider = CmsSlider::create([
            'name' => 'Slider Principal Home',
            'key' => 'home_slider',
            'description' => 'Slider visual destacado para la página de inicio',
            'settings' => [
                'autoplay' => true,
                'autoplaySpeed' => 5000,
                'transitionSpeed' => 600,
                'effect' => 'fade',
                'loop' => true,
                'dots' => true,
                'arrows' => true,
            ],
        ]);

        CmsSlide::create([
            'slider_id' => $homeSlider->id,
            'title' => 'Construye Experiencias Web Extraordinarias',
            'caption' => 'Plataforma CMS moderna impulsada por la potencia y robustez de Laravel 11 y la velocidad de React 19.',
            'image_url' => 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=2072&q=80',
            'link_url' => '/admin',
            'position' => 1,
            'active' => true,
        ]);

        CmsSlide::create([
            'slider_id' => $homeSlider->id,
            'title' => 'Gestión Dinámica de Contenidos y Esquemas',
            'caption' => 'Modela campos dinámicos personalizados, taxonomías, repetidores y menús jerárquicos con facilidad.',
            'image_url' => 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=2070&q=80',
            'link_url' => '/admin/schemas',
            'position' => 2,
            'active' => true,
        ]);

        CmsSlide::create([
            'slider_id' => $homeSlider->id,
            'title' => 'Diseño de Vanguardia y Máxima Velocidad',
            'caption' => 'Paleta de comandos ⌘K, modo oscuro impecable, y componentes de alta fidelidad en TypeScript.',
            'image_url' => 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=2015&q=80',
            'link_url' => '/admin/articles',
            'position' => 3,
            'active' => true,
        ]);

        // 11. Demo Home Page Article
        $homeArticle = CmsArticle::create([
            'schema_id' => $homeSchema->id,
            'lang_id' => $langEs->id,
            'title' => 'Inicio',
            'slug' => 'home',
            'content' => 'Bienvenido a MewCMS, un gestor de contenidos moderno, potente y flexible construido con Laravel, Inertia.js y React.',
            'excerpt' => 'Página principal de demostración con secciones dinámicas y diseño responsive.',
            'status' => 'published',
            'metadata' => [
                'slider' => 'home_slider',
                'hero_title' => 'Construye experiencias web extraordinarias',
                'hero_subtitle' => 'Un CMS ágil, potente y elegante con React e Inertia.js.',
                'hero_description' => 'Personaliza cada sección, gestiona taxonomías y administra contenidos con esquemas dinámicos directamente desde el panel de control.',
                'arquitectura_moderna' => 'Desarrollado sobre la arquitectura de componentes React y TypeScript con la robustez de Laravel 11.',
                'esquemas_dinamicos' => 'Define plantillas y campos personalizados a medida para cualquier tipo de contenido sin código repetitivo.',
                'optimizacion_seo' => 'Metadatos personalizables, URLs limpias y rendimiento optimizado para motores de búsqueda y móviles.',
            ],
            'position' => 1,
            'active' => 1,
        ]);

        // 11. Layout Configurations
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

        foreach ($configs as $cfg) {
            CmsConfig::create($cfg);
        }

        // 12. Default Front Menus
        $mainMenu = CmsMenu::create([
            'name' => 'Main',
            'slug' => 'main',
            'description' => 'Main navigation menu displayed in the header.',
            'active' => true,
        ]);

        CmsMenuItem::create([
            'menu_id' => $mainMenu->id,
            'title' => 'Inicio',
            'article_id' => $homeArticle->id,
            'url' => '/',
            'position' => 1,
            'active' => true,
        ]);

        $footerMenu = CmsMenu::create([
            'name' => 'Footer',
            'slug' => 'footer',
            'description' => 'Footer navigation menu with policy and contact links.',
            'active' => true,
        ]);

        CmsMenuItem::create([
            'menu_id' => $footerMenu->id,
            'title' => 'Políticas de Privacidad',
            'url' => '/politicas-de-privacidad',
            'position' => 1,
            'active' => true,
        ]);

        CmsMenuItem::create([
            'menu_id' => $footerMenu->id,
            'title' => 'Términos y Condiciones',
            'url' => '/terminos-y-condiciones',
            'position' => 2,
            'active' => true,
        ]);

        CmsMenuItem::create([
            'menu_id' => $footerMenu->id,
            'title' => 'Contáctenos',
            'url' => '/contactenos',
            'position' => 3,
            'active' => true,
        ]);
    }
}
