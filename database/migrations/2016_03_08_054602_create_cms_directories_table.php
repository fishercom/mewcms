<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCmsDirectoriesTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('cms_directories', function (Blueprint $table): void {
            $table->increments('id');
            $table->integer('type_id')->unsigned();
            $table->string('name');
            $table->string('alias', 50);
            $table->string('path');
            $table->boolean('active')->nullable();
            $table->timestamps();

            $table->foreign('type_id')
                ->references('id')
                ->on('cms_filetypes'); // ->onDelete('cascade');

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cms_directories');
    }
}
