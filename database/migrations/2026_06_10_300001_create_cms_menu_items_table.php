<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('cms_menu_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('menu_id')->constrained('cms_menus')->cascadeOnDelete();
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->string('title');
            $table->string('url')->nullable();
            // article_id must match unsignedInteger of cms_articles.id
            $table->unsignedInteger('article_id')->nullable();
            $table->string('target')->default('_self');
            $table->integer('position')->default(0);
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->foreign('parent_id')->references('id')->on('cms_menu_items')->nullOnDelete();
            $table->foreign('article_id')->references('id')->on('cms_articles')->nullOnDelete();
        });

        // Insert Admin Module to populate admin sidebar menu
        try {
            $menuCms = \App\Models\AdmMenu::where('name', 'CMS')->first();
            if ($menuCms) {
                $module = \App\Models\AdmModule::firstOrCreate([
                    'url' => '/admin/menus'
                ], [
                    'menu_id' => $menuCms->id,
                    'name' => 'Menús',
                    'title' => 'menús',
                    'icon' => 'menu',
                    'position' => 6,
                    'visible' => true,
                ]);

                $actionLista = \App\Models\AdmAction::where('alias', 'listar')->first();
                $actionAdmin = \App\Models\AdmAction::where('alias', 'administrar')->first();

                if ($actionLista) {
                    \App\Models\AdmEvent::firstOrCreate([
                        'module_id' => $module->id,
                        'action_id' => $actionLista->id
                    ]);
                }
                if ($actionAdmin) {
                    \App\Models\AdmEvent::firstOrCreate([
                        'module_id' => $module->id,
                        'action_id' => $actionAdmin->id
                    ]);
                }
            }
        } catch (\Exception $e) {
            // Log or ignore if db is not seeded yet during migration
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove Admin Module
        try {
            $module = \App\Models\AdmModule::where('url', '/admin/menus')->first();
            if ($module) {
                \App\Models\AdmEvent::where('module_id', $module->id)->delete();
                $module->delete();
            }
        } catch (\Exception $e) {
            // Ignore
        }

        Schema::dropIfExists('cms_menu_items');
    }
};
