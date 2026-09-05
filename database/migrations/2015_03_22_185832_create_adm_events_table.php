<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateAdmEventsTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('adm_events', function (Blueprint $table): void {
            $table->increments('id');
            $table->integer('module_id')->unsigned();
            $table->integer('action_id')->unsigned();
            $table->timestamps();

            $table->foreign('module_id')
                ->references('id')
                ->on('adm_modules')
                ->onDelete('cascade');

            $table->foreign('action_id')
                ->references('id')
                ->on('adm_actions')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::drop('adm_events');
    }
}
