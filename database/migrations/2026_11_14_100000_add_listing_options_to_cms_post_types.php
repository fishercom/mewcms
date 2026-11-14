<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * How the public listing of a post type is paged and sorted: a catalog may show every
 * product at once, by name, while a news section shows the newest first, a few per page.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cms_post_types', function (Blueprint $table): void {
            // Items per page of the listing; 0 shows them all on one page
            $table->unsignedSmallInteger('per_page')->default(6)->after('default_schema_id');
            // newest, oldest or title
            $table->string('order', 20)->default('newest')->after('per_page');
        });
    }

    public function down(): void
    {
        Schema::table('cms_post_types', function (Blueprint $table): void {
            $table->dropColumn(['per_page', 'order']);
        });
    }
};
