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
        Schema::create('cms_post_types', function (Blueprint $table): void {
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
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cms_post_types');
    }
};
