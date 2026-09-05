<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCmsSitesTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('cms_sites', function (Blueprint $table): void {
            $table->increments('id');
            $table->string('name');
            $table->string('segment', 25)->nullable();
            $table->string('site_url')->unique();
            $table->text('metadata')->nullable(); // assets, upload, customs
            $table->integer('schema_group_id')->unsigned();
            $table->boolean('default')->nullable();
            $table->boolean('active')->nullable();
            $table->timestamps();

            $table->unique('segment');
            $table->foreign('schema_group_id')
                ->references('id')
                ->on('cms_schema_groups')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cms_sites');
    }
}
