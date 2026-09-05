<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCmsConfigsTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('cms_configs', function (Blueprint $table): void {
            $table->increments('id');
            $table->string('type', 10);  // string, int, text, date
            $table->string('name');
            $table->string('alias', 20); // var_name
            $table->string('value', 512)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::drop('cms_configs');
    }
}
