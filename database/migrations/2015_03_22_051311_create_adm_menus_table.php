<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateAdmMenusTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('adm_menus', function (Blueprint $table): void {
            $table->increments('id');
            $table->integer('parent_id')->unsigned()->nullable();
            $table->string('name');
            $table->string('icon', 50)->nullable();
            $table->integer('position')->unsigned();
            $table->boolean('visible')->nullable();
            $table->timestamps();

            $table->foreign('parent_id')
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
        Schema::drop('adm_menus');
    }
}
