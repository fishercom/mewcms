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
        Schema::table('cms_schemas', function (Blueprint $table) {
            $table->string('type')->nullable()->change();
        });

        // Migrate existing HOME and OPTIONS schema types to PAGE
        \DB::table('cms_schemas')
            ->whereIn('type', ['HOME', 'OPTIONS'])
            ->update(['type' => 'PAGE']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cms_schemas', function (Blueprint $table) {
            $table->enum('type', ['PAGE', 'HOME', 'OPTIONS'])->nullable()->default('PAGE')->change();
        });
    }
};
