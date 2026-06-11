<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        //User::factory()->create([
        //    'name' => 'Test User',
        //    'email' => 'test@example.com',
        //]);

		// Seeding cms_langs
		$lang_default = \App\Models\CmsLang::create(['name' => 'Español', 'iso' => 'es', 'active'=>true]);
		$lang_english = \App\Models\CmsLang::create(['name' => 'English', 'iso' => 'en', 'active'=>true]);

		// Seeding cms_schema_groups
		$schg_default= \App\Models\CmsSchemaGroup::create(['name' => 'Site Principal', 'layout'=>'front', 'default'=>'1', 'active'=>true]);

		// Seeding cms_sites
		$site_root= \App\Models\CmsSite::create(['name' => 'Site Principal', 'site_url'=>'http://localhost/lasbambas-reconocimientos', 'schema_group_id'=>$schg_default->id, 'default'=>'1', 'active'=>true]);

		// Seeding cms_translates_alias

		// Seeding cms_parameters_group
		$pgroup_asunto= \App\Models\CmsParameterGroup::create(['name' => 'Asunto de Contacto', 'alias'=>'asunto', 'active'=>true]);




		// Seeding cms_forms
		$form_contact = \App\Models\CmsForm::create(['name' => 'Formulario de Contacto', 'alias'=>'contacto', 'active'=>true]);

		// Seeding profiles
		$perfil_sa = \App\Models\Profile::create(['name' => 'Super', 'active'=>true, 'sa'=>'1']);
		$perfil_admin = \App\Models\Profile::create(['name' => 'Admin', 'active'=>true]);
		$perfil_webmaster = \App\Models\Profile::create(['name' => 'Webmaster', 'active'=>true]);


		// Seeding users
		$user_admin = \App\Models\User::create(['username'=>'fischer', 'email' => 'fishdev@gmail.com', 'password' => 'admin$2277', 'name' => 'Administrador', 'profile_id' => $perfil_sa->id, 'active' => '1', 'default' => '1']);


		// Seeding menus
		$menu_home = \App\Models\AdmMenu::create(['name' => 'Inicio', 'position'=>'0', 'visible'=>false]);
		$menu_admin = \App\Models\AdmMenu::create(['name' => 'Administración', 'position'=>'1', 'visible'=>true]);
		$menu_web = \App\Models\AdmMenu::create(['name' => 'Website', 'position'=>'2', 'visible'=>true]);
		$menu_cms = \App\Models\AdmMenu::create(['name' => 'CMS', 'position'=>'3', 'visible'=>true]);
		$menu_forms = \App\Models\AdmMenu::create(['name' => 'Formularios', 'position'=>'4', 'visible'=>true]);
		$menu_modules = \App\Models\AdmMenu::create(['name' => 'Módulos del Sistema', 'position'=>'5', 'visible'=>true]);
		$module_contenido = \App\Models\AdmMenu::create(['name' => 'Contenido Web', 'position'=>'6', 'visible'=>true]);


		// Seeding adm_modules
		$module_inicio = \App\Models\AdmModule::create(['menu_id' => $menu_home->id, 'name' => 'admin', 'url' => '/admin/home', 'icon'=>'layout-dashboard', 'position'=>'0', 'visible'=>true]);
		$module_acceso = \App\Models\AdmModule::create(['menu_id' => $menu_home->id, 'name' => 'Acceso', 'url' => '/admin/login', 'position'=>'0', 'visible'=>false]);
		$module_usradm = \App\Models\AdmModule::create(['menu_id' => $menu_admin->id, 'name' => 'Usuarios', 'title' => 'usuario', 'url' => '/admin/users', 'icon'=>'users', 'position'=>'1', 'visible'=>true]);
		$module_perfil = \App\Models\AdmModule::create(['menu_id' => $menu_admin->id, 'name' => 'Perfiles', 'title' => 'perfil', 'url' => '/admin/profiles', 'icon'=>'flask-conical', 'position'=>'2', 'visible'=>true]);
		$module_reglog = \App\Models\AdmModule::create(['menu_id' => $menu_admin->id, 'name' => 'Registro de Logs', 'title' => 'log', 'url' => '/admin/logs', 'icon'=>'book', 'position'=>'3', 'visible'=>true]);
		$module_idioma = \App\Models\AdmModule::create(['menu_id' => $menu_web->id, 'name' => 'Idiomas', 'title' => 'idioma', 'url' => '/admin/langs', 'icon'=>'flag', 'position'=>'2', 'visible'=>true]);
		$module_transl= \App\Models\AdmModule::create(['menu_id' => $menu_web->id, 'name' => 'Traducciones', 'title' => 'traducción', 'url' => '/admin/translates', 'icon'=>'list', 'position'=>'4', 'visible'=>true]);
		$module_mensaje= \App\Models\AdmModule::create(['menu_id' => $menu_forms->id, 'name' => 'Mensajes recibidos', 'title' => 'mensaje', 'url' => '/admin/registers', 'icon'=>'inbox', 'position'=>'1', 'visible'=>true]);
		$module_cuenta = \App\Models\AdmModule::create(['menu_id' => $menu_forms->id, 'name' => 'Cuentas de correo', 'title' => 'cuenta', 'url' => '/admin/notifies', 'icon'=>'mail', 'position'=>'2', 'visible'=>true]);

		$module_config = \App\Models\AdmModule::create(['menu_id' => $menu_cms->id, 'name' => 'Configuración', 'title' => 'configuración', 'url' => '/admin/configs', 'icon'=>'cog', 'position'=>'1', 'visible'=>true]);
		$module_site = \App\Models\AdmModule::create(['menu_id' => $menu_cms->id, 'name' => 'Sites', 'title' => 'site', 'url' => '/admin/sites', 'icon'=>'globe', 'position'=>'2', 'visible'=>true]);
		$module_schema = \App\Models\AdmModule::create(['menu_id' => $menu_cms->id, 'name' => 'Esquemas', 'title' => 'esquema', 'url' => '/admin/schemas', 'icon'=>'shuffle', 'position'=>'3', 'visible'=>true]);

		$module_taxonomy = \App\Models\AdmModule::create(['menu_id' => $menu_cms->id, 'name' => 'Taxonomías', 'url' => '/admin/taxonomies', 'icon'=>'tags', 'position'=>'5', 'visible'=>true]);
		$module_menu = \App\Models\AdmModule::create(['menu_id' => $menu_cms->id, 'name' => 'Menús', 'title' => 'menús', 'url' => '/admin/menus', 'icon'=>'menu', 'position'=>'6', 'visible'=>true]);

		$module_parameter = \App\Models\AdmModule::create(['menu_id' => $menu_modules->id, 'name' => 'Parámetros', 'title' => 'parámetro', 'url' => '/admin/parameters', 'icon'=>'cog', 'position'=>'1', 'visible'=>true]);
		$module_article = \App\Models\AdmModule::create(['menu_id' => $module_contenido->id, 'name' => 'Páginas', 'title' => 'contenido', 'url' => '/admin/articles', 'icon'=>'file', 'position'=>'1', 'visible'=>true]);

		// Seeding adm_actions
		$action_lista = \App\Models\AdmAction::create(['name' => 'Listar (solo lectura)', 'alias'=>'listar', 'write_log'=>'0']);
		$action_admin = \App\Models\AdmAction::create(['name' => 'Administrar (agregar/modificar/eliminar)', 'alias'=>'administrar', 'write_log'=>'1']);
		$action_login = \App\Models\AdmAction::create(['name' => 'Login (ingresar al sistema)', 'alias'=>'login', 'write_log'=>'1']);
		$action_logout = \App\Models\AdmAction::create(['name' => 'Logout (salir del sistema)', 'alias'=>'logout', 'write_log'=>'1']);


		// Seeding adm_events
		\App\Models\AdmEvent::create(['module_id' => $module_acceso->id, 'action_id' => $action_login->id]);
		\App\Models\AdmEvent::create(['module_id' => $module_acceso->id, 'action_id' => $action_logout->id]);
		\App\Models\AdmEvent::create(['module_id' => $module_usradm->id, 'action_id' => $action_lista->id]);
		\App\Models\AdmEvent::create(['module_id' => $module_usradm->id, 'action_id' => $action_admin->id]);
		\App\Models\AdmEvent::create(['module_id' => $module_perfil->id, 'action_id' => $action_lista->id]);
		\App\Models\AdmEvent::create(['module_id' => $module_perfil->id, 'action_id' => $action_admin->id]);
		\App\Models\AdmEvent::create(['module_id' => $module_reglog->id, 'action_id' => $action_lista->id]);
		\App\Models\AdmEvent::create(['module_id' => $module_reglog->id, 'action_id' => $action_admin->id]);
		\App\Models\AdmEvent::create(['module_id' => $module_idioma->id, 'action_id' => $action_lista->id]);
		\App\Models\AdmEvent::create(['module_id' => $module_idioma->id, 'action_id' => $action_admin->id]);
		\App\Models\AdmEvent::create(['module_id' => $module_transl->id, 'action_id' => $action_lista->id]);
		\App\Models\AdmEvent::create(['module_id' => $module_transl->id, 'action_id' => $action_admin->id]);

		\App\Models\AdmEvent::create(['module_id' => $module_config->id, 'action_id' => $action_lista->id]);
		\App\Models\AdmEvent::create(['module_id' => $module_config->id, 'action_id' => $action_admin->id]);
		\App\Models\AdmEvent::create(['module_id' => $module_site->id, 'action_id' => $action_lista->id]);
		\App\Models\AdmEvent::create(['module_id' => $module_site->id, 'action_id' => $action_admin->id]);
		\App\Models\AdmEvent::create(['module_id' => $module_schema->id, 'action_id' => $action_lista->id]);
		\App\Models\AdmEvent::create(['module_id' => $module_schema->id, 'action_id' => $action_admin->id]);

		\App\Models\AdmEvent::create(['module_id' => $module_taxonomy->id, 'action_id' => $action_lista->id]);
		\App\Models\AdmEvent::create(['module_id' => $module_taxonomy->id, 'action_id' => $action_admin->id]);
		\App\Models\AdmEvent::create(['module_id' => $module_menu->id, 'action_id' => $action_lista->id]);
		\App\Models\AdmEvent::create(['module_id' => $module_menu->id, 'action_id' => $action_admin->id]);
		\App\Models\AdmEvent::create(['module_id' => $module_mensaje->id, 'action_id' => $action_lista->id]);
		\App\Models\AdmEvent::create(['module_id' => $module_mensaje->id, 'action_id' => $action_admin->id]);
		\App\Models\AdmEvent::create(['module_id' => $module_cuenta->id, 'action_id' => $action_lista->id]);
		\App\Models\AdmEvent::create(['module_id' => $module_cuenta->id, 'action_id' => $action_admin->id]);

		\App\Models\AdmEvent::create(['module_id' => $module_parameter->id, 'action_id' => $action_lista->id]);
		\App\Models\AdmEvent::create(['module_id' => $module_parameter->id, 'action_id' => $action_admin->id]);

        \App\Models\AdmEvent::create(['module_id' => $module_article->id, 'action_id' => $action_lista->id]);
		\App\Models\AdmEvent::create(['module_id' => $module_article->id, 'action_id' => $action_admin->id]);

		//Seeding cms_schema
		\App\Models\CmsSchema::create(['group_id' => $schg_default->id, 'name' => 'Home Page', 'fields' => [], 'iterations'=>1, 'type'=>'HOME', 'active'=>1]);
		\App\Models\CmsSchema::create(['group_id' => $schg_default->id, 'name' => 'Options Page', 'fields' => [], 'iterations'=>1, 'type'=>'OPTIONS', 'active'=>1]);

    }
}
