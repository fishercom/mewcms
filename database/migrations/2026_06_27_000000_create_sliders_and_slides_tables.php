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
        Schema::create('cms_sliders', function (Blueprint $table) {
            $table->increments('id');
            $table->string('name');
            $table->string('key')->unique();
            $table->string('description')->nullable();
            $table->json('settings')->nullable();
            $table->timestamps();
        });

        Schema::create('cms_slides', function (Blueprint $table) {
            $table->increments('id');
            $table->integer('slider_id')->unsigned();
            $table->string('title')->nullable();
            $table->text('caption')->nullable();
            $table->string('image_url');
            $table->string('link_url')->nullable();
            $table->integer('position')->unsigned()->default(0);
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->foreign('slider_id')
                ->references('id')
                ->on('cms_sliders')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cms_slides');
        Schema::dropIfExists('cms_sliders');
    }
};
