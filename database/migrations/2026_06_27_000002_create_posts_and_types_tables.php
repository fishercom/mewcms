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
        // 1. Create Custom Post Types table
        Schema::create('cms_post_types', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name');
            $table->string('singular_name');
            $table->string('slug')->unique();
            $table->string('icon')->default('book-open');
            $table->text('description')->nullable();
            $table->unsignedInteger('default_schema_id')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->foreign('default_schema_id')
                ->references('id')
                ->on('cms_schemas')
                ->nullOnDelete();
        });

        // 2. Create Unified Posts table (handles standard blog posts and custom CPT posts)
        Schema::create('cms_posts', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('user_id'); // Author
            $table->unsignedInteger('lang_id');
            $table->unsignedInteger('schema_id')->nullable();
            $table->string('post_type')->default('post'); // 'post' or custom post type slug
            $table->string('title');
            $table->string('slug')->unique();
            $table->longText('content')->nullable();
            $table->text('excerpt')->nullable();
            $table->string('featured_image')->nullable();
            $table->json('metadata')->nullable();
            $table->string('status')->default('draft'); // 'draft', 'published'
            $table->timestamp('published_at')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->cascadeOnDelete();

            $table->foreign('lang_id')
                ->references('id')
                ->on('cms_langs')
                ->cascadeOnDelete();

            $table->foreign('schema_id')
                ->references('id')
                ->on('cms_schemas')
                ->nullOnDelete();
                
            $table->index('post_type');
        });

        // 3. Create Pivot table linking posts to taxonomy terms
        Schema::create('cms_post_term', function (Blueprint $table) {
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
        Schema::dropIfExists('cms_posts');
        Schema::dropIfExists('cms_post_types');
    }
};
