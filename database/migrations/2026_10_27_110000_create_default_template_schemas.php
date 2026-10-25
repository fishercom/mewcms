<?php

use App\Models\CmsSchema;
use Illuminate\Database\Migrations\Migration;

/**
 * Every page template gets an active field group, so the page editor can always offer
 * all templates. Existing field groups and pages are not changed.
 */
return new class extends Migration
{
    public function up(): void
    {
        CmsSchema::ensureTemplateDefaults();
    }

    public function down(): void
    {
        // The created field groups are kept as regular data
    }
};
