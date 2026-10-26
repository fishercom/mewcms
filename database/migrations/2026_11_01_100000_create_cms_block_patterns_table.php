<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Reusable blocks: a named list of blocks that editors insert into any page or post.
 * A synced pattern stays linked (the page shows whatever the pattern holds now); an
 * unsynced one is copied into the content and from then on lives its own life.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cms_block_patterns', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('key')->unique();
            $table->string('description', 500)->nullable();
            $table->string('category', 60)->default('general');
            $table->json('blocks')->nullable();
            $table->boolean('synced')->default(false);
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->index(['active', 'synced']);
        });

        $this->addAdminModule();
    }

    /** "Bloques reutilizables" next to the other content modules, with its two actions */
    protected function addAdminModule(): void
    {
        $sibling = DB::table('adm_modules')->where('route', 'sliders.index')->first()
            ?? DB::table('adm_modules')->where('route', 'articles.index')->first();
        if (! $sibling || DB::table('adm_modules')->where('route', 'block-patterns.index')->exists()) {
            return;
        }

        $now = now();
        $moduleId = DB::table('adm_modules')->insertGetId([
            'menu_id' => $sibling->menu_id,
            'name' => 'Bloques reutilizables',
            'url' => '/admin/block-patterns',
            'route' => 'block-patterns.index',
            'icon' => 'blocks',
            'position' => (int) DB::table('adm_modules')->where('menu_id', $sibling->menu_id)->max('position') + 1,
            'visible' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        foreach (DB::table('adm_actions')->whereIn('alias', ['listar', 'administrar'])->pluck('id') as $actionId) {
            DB::table('adm_events')->insert(['module_id' => $moduleId, 'action_id' => $actionId, 'created_at' => $now, 'updated_at' => $now]);
        }
    }

    public function down(): void
    {
        $moduleId = DB::table('adm_modules')->where('route', 'block-patterns.index')->value('id');
        if ($moduleId) {
            DB::table('adm_permissions')->whereIn('event_id', DB::table('adm_events')->where('module_id', $moduleId)->pluck('id'))->delete();
            DB::table('adm_events')->where('module_id', $moduleId)->delete();
            DB::table('adm_modules')->where('id', $moduleId)->delete();
        }

        Schema::dropIfExists('cms_block_patterns');
    }
};
