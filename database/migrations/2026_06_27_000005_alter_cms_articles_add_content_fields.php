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
        Schema::table('cms_articles', function (Blueprint $table) {
            // Drop foreign key first so MySQL allows modifying the column
            $table->dropForeign(['schema_id']);
        });

        Schema::table('cms_articles', function (Blueprint $table) {
            // Alter schema_id to be nullable
            $table->integer('schema_id')->unsigned()->nullable()->change();

            // Add standard WordPress-like columns
            $table->longText('content')->nullable()->after('title');
            $table->text('excerpt')->nullable()->after('content');
            $table->string('featured_image', 2048)->nullable()->after('excerpt');
            $table->string('status', 20)->default('published')->after('featured_image');
        });

        Schema::table('cms_articles', function (Blueprint $table) {
            // Restore foreign key constraint
            $table->foreign('schema_id')
                ->references('id')
                ->on('cms_schemas')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cms_articles', function (Blueprint $table) {
            $table->dropForeign(['schema_id']);
        });

        Schema::table('cms_articles', function (Blueprint $table) {
            // Change schema_id back to NOT nullable
            $table->integer('schema_id')->unsigned()->nullable(false)->change();

            // Drop added columns
            $table->dropColumn(['content', 'excerpt', 'featured_image', 'status']);
        });

        Schema::table('cms_articles', function (Blueprint $table) {
            $table->foreign('schema_id')
                ->references('id')
                ->on('cms_schemas')
                ->onDelete('cascade');
        });
    }
};
