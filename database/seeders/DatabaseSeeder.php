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
            'name' => 'Página de Inicio',
            'fields' => [
                ['key' => 'slider', 'label' => 'Clave del Slider', 'name' => 'Clave del Slider', 'alias' => 'slider', 'type' => 'text'],
                ['key' => 'badge_text', 'label' => 'Texto de la Insignia', 'name' => 'Texto de la Insignia', 'alias' => 'badge_text', 'type' => 'text'],
                ['key' => 'hero_title', 'label' => 'Título Hero (H1)', 'name' => 'Título Hero (H1)', 'alias' => 'hero_title', 'type' => 'text'],
                ['key' => 'hero_subtitle', 'label' => 'Subtítulo Hero', 'name' => 'Subtítulo Hero', 'alias' => 'hero_subtitle', 'type' => 'text'],
                ['key' => 'hero_description', 'label' => 'Descripción Hero', 'name' => 'Descripción Hero', 'alias' => 'hero_description', 'type' => 'textarea'],
                ['key' => 'stat_speed', 'label' => 'Métrica: Rendimiento', 'name' => 'Métrica: Rendimiento', 'alias' => 'stat_speed', 'type' => 'text'],
                ['key' => 'stat_typesafe', 'label' => 'Métrica: Tipado Seguro', 'name' => 'Métrica: Tipado Seguro', 'alias' => 'stat_typesafe', 'type' => 'text'],
                ['key' => 'stat_stack', 'label' => 'Métrica: Stack Tecnológico', 'name' => 'Métrica: Stack Tecnológico', 'alias' => 'stat_stack', 'type' => 'text'],
                ['key' => 'stat_navigation', 'label' => 'Métrica: Navegación SPA', 'name' => 'Métrica: Navegación SPA', 'alias' => 'stat_navigation', 'type' => 'text'],
                ['key' => 'section_features_title', 'label' => 'Título Sección Características', 'name' => 'Título Sección Características', 'alias' => 'section_features_title', 'type' => 'text'],
                ['key' => 'section_features_subtitle', 'label' => 'Subtítulo Sección Características', 'name' => 'Subtítulo Sección Características', 'alias' => 'section_features_subtitle', 'type' => 'textarea'],
                [
                    'key' => 'features',
                    'label' => 'Tarjetas de Características (Repeater)',
                    'name' => 'Tarjetas de Características (Repeater)',
                    'alias' => 'features',
                    'type' => 'repeater',
                    'fields' => [
                        ['key' => 'title', 'label' => 'Título de la Tarjeta', 'name' => 'Título', 'alias' => 'title', 'type' => 'text'],
                        ['key' => 'description', 'label' => 'Descripción', 'name' => 'Descripción', 'alias' => 'description', 'type' => 'textarea'],
                        ['key' => 'badge', 'label' => 'Insignia (Badge)', 'name' => 'Insignia', 'alias' => 'badge', 'type' => 'text'],
                        ['key' => 'icon', 'label' => 'Icono (Cpu, Layers, Palette, Command, FileText, Lock, Zap, Sparkles, Database, Globe)', 'name' => 'Icono', 'alias' => 'icon', 'type' => 'text'],
                        ['key' => 'color', 'label' => 'Color (violet, blue, amber, emerald, rose, indigo)', 'name' => 'Color', 'alias' => 'color', 'type' => 'text'],
                    ],
                ],
                ['key' => 'cta_title', 'label' => 'Título Call to Action', 'name' => 'Título Call to Action', 'alias' => 'cta_title', 'type' => 'text'],
                ['key' => 'cta_description', 'label' => 'Descripción Call to Action', 'name' => 'Descripción Call to Action', 'alias' => 'cta_description', 'type' => 'textarea'],
                ['key' => 'cta_button_text', 'label' => 'Texto Botón CTA', 'name' => 'Texto Botón CTA', 'alias' => 'cta_button_text', 'type' => 'text'],
                ['key' => 'cta_button_url', 'label' => 'URL Botón CTA', 'name' => 'URL Botón CTA', 'alias' => 'cta_button_url', 'type' => 'url'],
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

        // 10. Demo Sliders (Default and Home)
        $defaultSlider = CmsSlider::create([
            'name' => 'Slider Predeterminado',
            'key' => 'default',
            'description' => 'Slider predeterminado del sistema para páginas principales y secciones de bienvenida',
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
            'slider_id' => $defaultSlider->id,
            'title' => 'Bienvenido a MewCMS',
            'caption' => 'La plataforma de contenidos flexible, ágil y de código abierto construida para desarrolladores y creadores.',
            'image_url' => 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=2072&q=80',
            'link_url' => '/admin',
            'position' => 1,
            'active' => true,
        ]);

        CmsSlide::create([
            'slider_id' => $defaultSlider->id,
            'title' => 'Estructura Dinámica y Extensible',
            'caption' => 'Crea campos personalizados a medida, colecciones complejas y taxonomías sin límites de diseño.',
            'image_url' => 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2070&q=80',
            'link_url' => '/admin/schemas',
            'position' => 2,
            'active' => true,
        ]);

        CmsSlide::create([
            'slider_id' => $defaultSlider->id,
            'title' => 'Rendimiento Extremo con React e Inertia',
            'caption' => 'Carga instantánea de páginas, navegación fluida tipo aplicación móvil y diseño adaptable.',
            'image_url' => 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=2070&q=80',
            'link_url' => '/admin/articles',
            'position' => 3,
            'active' => true,
        ]);

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
            'featured_image' => 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
            'content' => '<h2>Potencia, Agilidad y Control Total</h2><p>MewCMS une la solidez y seguridad de <strong>Laravel 11</strong> con la interactividad y fluidez de una Single Page Application con <strong>React 19</strong> e <strong>Inertia.js v2</strong>.</p><p>Administra con total comodidad estructuras de datos complejas mediante esquemas dinámicos, organiza tus publicaciones con taxonomías jerárquicas y diseña presentaciones visuales impactantes con sliders y galerías adaptables a cualquier dispositivo.</p>',
            'excerpt' => 'Gestor de contenidos moderno con navegación fluida sin recargas, esquemas dinámicos y arquitectura en TypeScript.',
            'status' => 'published',
            'metadata' => [
                'slider' => 'home_slider',
                'badge_text' => 'Plataforma Web de Nueva Generación',
                'hero_title' => 'Construye experiencias web extraordinarias',
                'hero_subtitle' => 'Un CMS ágil, potente y elegante con React e Inertia.js.',
                'hero_description' => 'Personaliza cada sección, gestiona taxonomías y administra contenidos con esquemas dinámicos directamente desde el panel de control.',
                'stat_speed' => '< 100ms',
                'stat_typesafe' => '100% Type-Safe',
                'stat_stack' => 'Laravel 11 + React 19',
                'stat_navigation' => 'Inertia.js v2 SPA',
                'section_features_title' => 'Todo lo que necesitas para tu proyecto web',
                'section_features_subtitle' => 'Diseñado tanto para creadores de contenido no técnicos como para ingenieros que exigen código limpio, modular y escalable.',
                'features' => [
                    [
                        '_id' => 'feat-1',
                        'title' => 'Arquitectura SPA Unificada',
                        'description' => 'Combina la robustez de Laravel 11 con la velocidad instantánea de Inertia.js v2 y React 19 sin recargas de página.',
                        'badge' => 'Alto Rendimiento',
                        'icon' => 'Cpu',
                        'color' => 'violet',
                    ],
                    [
                        '_id' => 'feat-2',
                        'title' => 'Esquemas y Campos a Medida',
                        'description' => 'Modela cualquier tipo de dato con campos de texto, repetidores, selecciones y metadatos dinámicos sin tocar código de base de datos.',
                        'badge' => 'Modular',
                        'icon' => 'Layers',
                        'color' => 'blue',
                    ],
                    [
                        '_id' => 'feat-3',
                        'title' => 'Plantillas React & Tailwind',
                        'description' => 'Diseña tus páginas con componentes limpios en TypeScript y estilos con Tailwind CSS con soporte nativo para temas claro y oscuro.',
                        'badge' => 'UI Vanguardista',
                        'icon' => 'Palette',
                        'color' => 'amber',
                    ],
                    [
                        '_id' => 'feat-4',
                        'title' => 'Paleta de Comandos ⌘K',
                        'description' => 'Navegación ultra rápida por teclado para saltar a cualquier módulo, editar páginas o realizar acciones al vuelo.',
                        'badge' => 'Productividad',
                        'icon' => 'Command',
                        'color' => 'emerald',
                    ],
                    [
                        '_id' => 'feat-5',
                        'title' => 'Editor Enriquecido TipTap',
                        'description' => 'Crea y maqueta publicaciones, blogs y artículos con un editor de texto enriquecido moderno, potente e intuitivo.',
                        'badge' => 'Edición Ágil',
                        'icon' => 'FileText',
                        'color' => 'rose',
                    ],
                    [
                        '_id' => 'feat-6',
                        'title' => 'Seguridad y Roles Granulares',
                        'description' => 'Control de acceso detallado por módulos y acciones, auditoría de eventos y protección integrada de datos.',
                        'badge' => 'Enterprise',
                        'icon' => 'Lock',
                        'color' => 'indigo',
                    ],
                ],
                'cta_title' => 'Comienza a administrar tu contenido hoy mismo',
                'cta_description' => 'Accede al panel de control para crear nuevas páginas, gestionar artículos de blog, configurar menús y personalizar cada aspecto de tu sitio.',
                'cta_button_text' => 'Abrir Dashboard',
                'cta_button_url' => '/admin',
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
