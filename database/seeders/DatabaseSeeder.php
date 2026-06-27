<?php

namespace Database\Seeders;

use App\Models\AdmAction;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use App\Models\AdmEvent;
use App\Models\AdmMenu;
use App\Models\AdmModule;
use App\Models\CmsForm;
use App\Models\CmsLang;
use App\Models\CmsParameterGroup;
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
        // User::factory(10)->create();

        // User::factory()->create([
        //    'name' => 'Test User',
        //    'email' => 'test@example.com',
        // ]);

        // Seeding cms_langs
        $lang_default = CmsLang::create(['name' => 'Español', 'iso' => 'es', 'active' => true]);
        $lang_english = CmsLang::create(['name' => 'English', 'iso' => 'en', 'active' => true]);

        // Seeding cms_schema_groups
        $schg_default = CmsSchemaGroup::create(['name' => 'Site Principal', 'layout' => 'front', 'default' => '1', 'active' => true]);

        // Seeding cms_sites
        $site_root = CmsSite::create(['name' => 'Site Principal', 'site_url' => 'http://localhost/lasbambas-reconocimientos', 'schema_group_id' => $schg_default->id, 'default' => '1', 'active' => true]);

        // Seeding cms_translates_alias

        // Seeding cms_parameters_group
        $pgroup_asunto = CmsParameterGroup::create(['name' => 'Asunto de Contacto', 'alias' => 'asunto', 'active' => true]);

        // Seeding cms_forms
        $form_contact = CmsForm::create(['name' => 'Formulario de Contacto', 'alias' => 'contacto', 'active' => true]);

        // Seeding profiles
        $perfil_sa = Profile::create(['name' => 'Super', 'active' => true, 'sa' => '1']);
        $perfil_admin = Profile::create(['name' => 'Admin', 'active' => true]);
        $perfil_webmaster = Profile::create(['name' => 'Webmaster', 'active' => true]);

        // Seeding users
        $user_admin = User::create(['username' => 'fischer', 'email' => 'fishdev@gmail.com', 'password' => 'admin$2277', 'name' => 'Administrador', 'profile_id' => $perfil_sa->id, 'active' => '1', 'default' => '1']);

        // Seeding menus
        $menu_home = AdmMenu::create(['name' => 'Inicio', 'position' => '0', 'visible' => false]);
        $menu_admin = AdmMenu::create(['name' => 'Administración', 'position' => '1', 'visible' => true]);
        $menu_web = AdmMenu::create(['name' => 'Website', 'position' => '2', 'visible' => true]);
        $menu_cms = AdmMenu::create(['name' => 'CMS', 'position' => '3', 'visible' => true]);
        $menu_forms = AdmMenu::create(['name' => 'Formularios', 'position' => '4', 'visible' => true]);
        $menu_modules = AdmMenu::create(['name' => 'Módulos del Sistema', 'position' => '5', 'visible' => true]);
        $module_contenido = AdmMenu::create(['name' => 'Contenido Web', 'position' => '6', 'visible' => true]);

        // Seeding adm_modules
        $module_inicio = AdmModule::create(['menu_id' => $menu_home->id, 'name' => 'admin', 'url' => '/admin/home', 'icon' => 'layout-dashboard', 'position' => '0', 'visible' => true]);
        $module_acceso = AdmModule::create(['menu_id' => $menu_home->id, 'name' => 'Acceso', 'url' => '/admin/login', 'position' => '0', 'visible' => false]);
        $module_usradm = AdmModule::create(['menu_id' => $menu_admin->id, 'name' => 'Usuarios', 'title' => 'usuario', 'url' => '/admin/users', 'icon' => 'users', 'position' => '1', 'visible' => true]);
        $module_perfil = AdmModule::create(['menu_id' => $menu_admin->id, 'name' => 'Perfiles', 'title' => 'perfil', 'url' => '/admin/profiles', 'icon' => 'flask-conical', 'position' => '2', 'visible' => true]);
        $module_reglog = AdmModule::create(['menu_id' => $menu_admin->id, 'name' => 'Registro de Logs', 'title' => 'log', 'url' => '/admin/logs', 'icon' => 'book', 'position' => '3', 'visible' => true]);
        $module_idioma = AdmModule::create(['menu_id' => $menu_web->id, 'name' => 'Idiomas', 'title' => 'idioma', 'url' => '/admin/langs', 'icon' => 'flag', 'position' => '2', 'visible' => true]);
        $module_transl = AdmModule::create(['menu_id' => $menu_web->id, 'name' => 'Traducciones', 'title' => 'traducción', 'url' => '/admin/translates', 'icon' => 'list', 'position' => '4', 'visible' => true]);
        $module_mensaje = AdmModule::create(['menu_id' => $menu_forms->id, 'name' => 'Mensajes recibidos', 'title' => 'mensaje', 'url' => '/admin/registers', 'icon' => 'inbox', 'position' => '1', 'visible' => true]);
        $module_cuenta = AdmModule::create(['menu_id' => $menu_forms->id, 'name' => 'Cuentas de correo', 'title' => 'cuenta', 'url' => '/admin/notifies', 'icon' => 'mail', 'position' => '2', 'visible' => true]);

        $module_config = AdmModule::create(['menu_id' => $menu_cms->id, 'name' => 'Configuración', 'title' => 'configuración', 'url' => '/admin/configs', 'icon' => 'cog', 'position' => '1', 'visible' => true]);
        $module_site = AdmModule::create(['menu_id' => $menu_cms->id, 'name' => 'Sites', 'title' => 'site', 'url' => '/admin/sites', 'icon' => 'globe', 'position' => '2', 'visible' => true]);
        $module_schema = AdmModule::create(['menu_id' => $menu_cms->id, 'name' => 'Campos Personalizados', 'title' => 'esquema', 'url' => '/admin/schemas', 'icon' => 'shuffle', 'position' => '3', 'visible' => true]);

        $module_taxonomy = AdmModule::create(['menu_id' => $menu_cms->id, 'name' => 'Taxonomías', 'url' => '/admin/taxonomies', 'icon' => 'tags', 'position' => '5', 'visible' => true]);
        $module_menu = AdmModule::create(['menu_id' => $menu_cms->id, 'name' => 'Menús', 'title' => 'menús', 'url' => '/admin/menus', 'icon' => 'menu', 'position' => '6', 'visible' => true]);

        $module_parameter = AdmModule::create(['menu_id' => $menu_modules->id, 'name' => 'Parámetros', 'title' => 'parámetro', 'url' => '/admin/parameters', 'icon' => 'cog', 'position' => '1', 'visible' => true]);
        $module_article = AdmModule::create(['menu_id' => $module_contenido->id, 'name' => 'Páginas', 'title' => 'contenido', 'url' => '/admin/articles', 'icon' => 'file', 'position' => '1', 'visible' => true]);

        // Seeding adm_actions
        $action_lista = AdmAction::create(['name' => 'Listar (solo lectura)', 'alias' => 'listar', 'write_log' => '0']);
        $action_admin = AdmAction::create(['name' => 'Administrar (agregar/modificar/eliminar)', 'alias' => 'administrar', 'write_log' => '1']);
        $action_login = AdmAction::create(['name' => 'Login (ingresar al sistema)', 'alias' => 'login', 'write_log' => '1']);
        $action_logout = AdmAction::create(['name' => 'Logout (salir del sistema)', 'alias' => 'logout', 'write_log' => '1']);

        // Seeding adm_events
        AdmEvent::create(['module_id' => $module_acceso->id, 'action_id' => $action_login->id]);
        AdmEvent::create(['module_id' => $module_acceso->id, 'action_id' => $action_logout->id]);
        AdmEvent::create(['module_id' => $module_usradm->id, 'action_id' => $action_lista->id]);
        AdmEvent::create(['module_id' => $module_usradm->id, 'action_id' => $action_admin->id]);
        AdmEvent::create(['module_id' => $module_perfil->id, 'action_id' => $action_lista->id]);
        AdmEvent::create(['module_id' => $module_perfil->id, 'action_id' => $action_admin->id]);
        AdmEvent::create(['module_id' => $module_reglog->id, 'action_id' => $action_lista->id]);
        AdmEvent::create(['module_id' => $module_reglog->id, 'action_id' => $action_admin->id]);
        AdmEvent::create(['module_id' => $module_idioma->id, 'action_id' => $action_lista->id]);
        AdmEvent::create(['module_id' => $module_idioma->id, 'action_id' => $action_admin->id]);
        AdmEvent::create(['module_id' => $module_transl->id, 'action_id' => $action_lista->id]);
        AdmEvent::create(['module_id' => $module_transl->id, 'action_id' => $action_admin->id]);

        AdmEvent::create(['module_id' => $module_config->id, 'action_id' => $action_lista->id]);
        AdmEvent::create(['module_id' => $module_config->id, 'action_id' => $action_admin->id]);
        AdmEvent::create(['module_id' => $module_site->id, 'action_id' => $action_lista->id]);
        AdmEvent::create(['module_id' => $module_site->id, 'action_id' => $action_admin->id]);
        AdmEvent::create(['module_id' => $module_schema->id, 'action_id' => $action_lista->id]);
        AdmEvent::create(['module_id' => $module_schema->id, 'action_id' => $action_admin->id]);

        AdmEvent::create(['module_id' => $module_taxonomy->id, 'action_id' => $action_lista->id]);
        AdmEvent::create(['module_id' => $module_taxonomy->id, 'action_id' => $action_admin->id]);
        AdmEvent::create(['module_id' => $module_menu->id, 'action_id' => $action_lista->id]);
        AdmEvent::create(['module_id' => $module_menu->id, 'action_id' => $action_admin->id]);
        AdmEvent::create(['module_id' => $module_mensaje->id, 'action_id' => $action_lista->id]);
        AdmEvent::create(['module_id' => $module_mensaje->id, 'action_id' => $action_admin->id]);
        AdmEvent::create(['module_id' => $module_cuenta->id, 'action_id' => $action_lista->id]);
        AdmEvent::create(['module_id' => $module_cuenta->id, 'action_id' => $action_admin->id]);

        AdmEvent::create(['module_id' => $module_parameter->id, 'action_id' => $action_lista->id]);
        AdmEvent::create(['module_id' => $module_parameter->id, 'action_id' => $action_admin->id]);

        AdmEvent::create(['module_id' => $module_article->id, 'action_id' => $action_lista->id]);
        AdmEvent::create(['module_id' => $module_article->id, 'action_id' => $action_admin->id]);

        // Seeding cms_schema
        CmsSchema::create(['group_id' => $schg_default->id, 'name' => 'Home Page', 'fields' => [], 'iterations' => 1, 'type' => 'HOME', 'active' => 1]);
        CmsSchema::create(['group_id' => $schg_default->id, 'name' => 'Options Page', 'fields' => [], 'iterations' => 1, 'type' => 'OPTIONS', 'active' => 1]);

    }
}
