<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCmsSchemasTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('cms_schemas', function (Blueprint $table): void {
            $table->increments('id');
            $table->integer('parent_id')->unsigned()->nullable();
            $table->integer('group_id')->unsigned();
            $table->string('name');
            $table->json('fields')->nullable();
            $table->integer('iterations')->unsigned()->nullable();
            $table->string('type')->nullable();
            $table->string('front_view')->nullable();
            $table->integer('position')->unsigned()->nullable();
            $table->boolean('active')->nullable()->index();
            $table->timestamps();

            $table->foreign('parent_id')
                ->references('id')
                ->on('cms_schemas')
                ->onDelete('cascade');

            $table->foreign('group_id')
                ->references('id')
                ->on('cms_schema_groups')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::drop('cms_schemas');
    }
}
