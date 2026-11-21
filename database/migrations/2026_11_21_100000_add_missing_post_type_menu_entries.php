<?php

use App\Models\CmsPostType;
use Illuminate\Database\Migrations\Migration;

/**
 * Post types created before this fix got no entry in the admin sidebar: they looked for a
 * group named «Contenido Web», which the installer calls «Contenido». Add the missing ones.
 */
return new class extends Migration
{
    public function up(): void
    {
        CmsPostType::all()->each(fn (CmsPostType $type) => $type->syncAdminModule());
    }

    public function down(): void
    {
        // The entries stay: they are the ones a post type creates today
    }
};
