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
        Schema::create('cms_post_term', function (Blueprint $table): void {
            $table->unsignedBigInteger('post_id');
            $table->unsignedBigInteger('term_id');

            $table->primary(['post_id', 'term_id']);

            $table->foreign('post_id')
                ->references('id')
                ->on('cms_posts')
                ->cascadeOnDelete();

            $table->foreign('term_id')
                ->references('id')
                ->on('cms_taxonomy_terms')
                ->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cms_post_term');
    }
};
