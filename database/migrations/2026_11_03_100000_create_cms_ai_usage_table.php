<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * AI assistant: a log of every call (tokens and estimated cost, which feeds the monthly
 * budget) and the "Asistente IA" admin module that grants the assistant to a profile.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cms_ai_usage', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('provider', 30);
            $table->string('model', 80);
            $table->string('action', 40);
            $table->string('module', 40)->nullable();
            $table->unsignedBigInteger('item_id')->nullable();
            $table->unsignedInteger('input_tokens')->default(0);
            $table->unsignedInteger('output_tokens')->default(0);
            $table->decimal('cost', 10, 6)->default(0);
            $table->timestamps();

            $table->index('created_at');
        });

        $this->addAdminModule();
    }

    /** "Asistente IA" in the administration menu, with its two actions */
    protected function addAdminModule(): void
    {
        $sibling = DB::table('adm_modules')->where('route', 'configs.index')->first()
            ?? DB::table('adm_modules')->where('route', 'users.index')->first();
        if (! $sibling || DB::table('adm_modules')->where('route', 'ai.index')->exists()) {
            return;
        }

        $now = now();
        $moduleId = DB::table('adm_modules')->insertGetId([
            'menu_id' => $sibling->menu_id,
            'name' => 'Asistente IA',
            'description' => 'Proveedores, modelos y consumo del asistente de contenido',
            'url' => '/admin/ai',
            'route' => 'ai.index',
            'icon' => 'sparkles',
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
        $moduleId = DB::table('adm_modules')->where('route', 'ai.index')->value('id');
        if ($moduleId) {
            DB::table('adm_permissions')->whereIn('event_id', DB::table('adm_events')->where('module_id', $moduleId)->pluck('id'))->delete();
            DB::table('adm_events')->where('module_id', $moduleId)->delete();
            DB::table('adm_modules')->where('id', $moduleId)->delete();
        }

        Schema::dropIfExists('cms_ai_usage');
    }
};
