<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCmsArticlesTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('cms_articles', function (Blueprint $table): void {
            $table->increments('id');
            $table->integer('parent_id')->unsigned()->nullable();
            $table->integer('schema_id')->unsigned();
            $table->integer('lang_id')->unsigned();
            $table->string('title');
            $table->json('metadata')->nullable();
            $table->integer('position')->unsigned()->nullable();
            $table->string('slug', 500);
            $table->boolean('active')->nullable();
            $table->timestamps();

            $table->foreign('parent_id')
                ->references('id')
                ->on('cms_articles')
                ->onDelete('cascade');

            $table->foreign('schema_id')
                ->references('id')
                ->on('cms_schemas')
                ->onDelete('cascade');

            $table->foreign('lang_id')
                ->references('id')
                ->on('cms_langs')
                ->onDelete('cascade');

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::drop('cms_articles');
    }
}
