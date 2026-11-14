<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Slides can carry more than one picture and a button: an image for phones, a video
 * that plays instead of the image, a second picture laid over the slide (a cut-out, an
 * icon or a logo) and the button's text.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cms_slides', function (Blueprint $table): void {
            $table->string('image_mobile_url')->nullable()->after('image_url');
            $table->string('video_url')->nullable()->after('image_mobile_url');
            $table->string('secondary_image_url')->nullable()->after('video_url');
            $table->string('button_label')->nullable()->after('link_url');
        });
    }

    public function down(): void
    {
        Schema::table('cms_slides', function (Blueprint $table): void {
            $table->dropColumn(['image_mobile_url', 'video_url', 'secondary_image_url', 'button_label']);
        });
    }
};
