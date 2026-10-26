<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The media library: one row per uploaded file, with its alt text, caption and the
 * responsive WebP versions generated for images.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cms_media', function (Blueprint $table): void {
            $table->id();
            $table->string('disk', 32)->default('public');
            $table->string('path', 512);
            $table->string('filename');
            $table->string('mime', 128)->nullable();
            $table->unsignedBigInteger('size')->default(0);
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->string('alt', 512)->nullable();
            $table->text('caption')->nullable();
            $table->string('title')->nullable();
            $table->json('variants')->nullable();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['disk', 'path'], 'cms_media_disk_path_index');
            $table->index('mime');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cms_media');
    }
};
