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
        Schema::create('cms_taxonomy_terms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('taxonomy_id')->constrained('cms_taxonomies')->cascadeOnDelete();
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->string('name');
            $table->string('slug');
            $table->text('description')->nullable();
            $table->boolean('active')->default(true);
            $table->integer('position')->default(0);
            $table->timestamps();

            $table->foreign('parent_id')->references('id')->on('cms_taxonomy_terms')->nullOnDelete();
            $table->unique(['taxonomy_id', 'slug']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cms_taxonomy_terms');
    }
};
