<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {

    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up(): void
    {
        // 1. Delete associated event actions and permissions in adm_events
        $module = DB::table('adm_modules')->where('url', '/admin/directories')->first();
        if ($module) {
            DB::table('adm_events')->where('module_id', $module->id)->delete();
            DB::table('adm_modules')->where('id', $module->id)->delete();
        }

        // 2. Drop the dependent tables
        Schema::dropIfExists('cms_directories');
        Schema::dropIfExists('cms_filetypes');
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down(): void
    {
        // Recreate filetypes table
        Schema::create('cms_filetypes', function (Blueprint $table) {
            $table->increments('id');
            $table->string('name');
            $table->string('extensions');
            $table->boolean('active')->nullable();
            $table->timestamps();
        });

        // Recreate directories table
        Schema::create('cms_directories', function (Blueprint $table) {
            $table->increments('id');
            $table->integer('type_id')->unsigned();
            $table->string('name');
            $table->string('alias', 50);
            $table->string('path');
            $table->boolean('active')->nullable();
            $table->timestamps();

            $table->foreign('type_id')
                  ->references('id')
                  ->on('cms_filetypes');
        });
    }
};
