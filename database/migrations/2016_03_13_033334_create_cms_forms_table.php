<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCmsFormsTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('cms_forms', function (Blueprint $table): void {
            $table->increments('id');
            $table->string('name');
            $table->string('alias', 50)->unique();
            $table->string('info', 512)->nullable();
            $table->string('color', 25)->nullable();
            $table->boolean('active')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::drop('cms_forms');
    }
}
