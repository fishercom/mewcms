<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCmsParametersTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('cms_parameters', function (Blueprint $table): void {
            $table->increments('id');
            $table->integer('group_id')->unsigned();
            $table->integer('parent_id')->unsigned()->nullable();
            $table->string('name');
            $table->string('value')->nullable();
            $table->json('metadata')->nullable();
            $table->integer('position')->unsigned();
            $table->boolean('active')->nullable();
            $table->timestamps();

            $table->foreign('group_id')
                ->references('id')
                ->on('cms_parameters_group')
                ->onDelete('cascade');

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cms_parameters');
    }
}
