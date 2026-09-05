<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateAdmModulesTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('adm_modules', function (Blueprint $table): void {
            $table->increments('id');
            $table->integer('menu_id')->unsigned();
            $table->string('name');
            $table->string('title')->nullable();
            $table->string('description', 1024)->nullable();
            $table->string('url', 50);
            $table->string('route', 50);
            $table->string('params')->nullable();
            $table->string('icon', 50)->nullable();
            $table->integer('position')->unsigned();
            $table->boolean('visible')->nullable();
            $table->timestamps();

            $table->foreign('menu_id')
                ->references('id')
                ->on('adm_menus')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::drop('adm_modules');
    }
}
