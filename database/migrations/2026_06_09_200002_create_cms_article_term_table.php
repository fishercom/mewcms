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
        Schema::create('cms_article_term', function (Blueprint $table) {
            // article_id must be unsignedInteger to match cms_articles.id (legacy increments column)
            $table->unsignedInteger('article_id');
            $table->unsignedBigInteger('term_id');

            $table->primary(['article_id', 'term_id']);

            $table->foreign('article_id')->references('id')->on('cms_articles')->cascadeOnDelete();
            $table->foreign('term_id')->references('id')->on('cms_taxonomy_terms')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cms_article_term');
    }
};
