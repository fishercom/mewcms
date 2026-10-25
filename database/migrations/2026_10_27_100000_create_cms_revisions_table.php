<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Snapshots of pages and posts: one per save (the last 25 are kept) plus one
 * autosave per user with unsaved editor changes.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cms_revisions', function (Blueprint $table): void {
            $table->id();
            $table->morphs('revisionable');
            $table->unsignedBigInteger('user_id')->nullable()->index();
            $table->string('title');
            $table->longText('content')->nullable();
            $table->text('excerpt')->nullable();
            $table->json('metadata')->nullable();
            $table->string('status', 20)->nullable();
            $table->timestamp('published_at')->nullable();
            $table->json('tag_ids')->nullable();
            $table->boolean('is_autosave')->default(false);
            $table->timestamps();

            $table->index(['revisionable_type', 'revisionable_id', 'is_autosave'], 'cms_revisions_lookup_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cms_revisions');
    }
};
