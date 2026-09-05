<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCmsRegistersTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('cms_registers', function (Blueprint $table): void {
            $table->increments('id');
            $table->integer('form_id')->unsigned();
            $table->integer('contact_id')->nullable();
            $table->string('name')->nullable();
            $table->string('email')->nullable();
            $table->string('phone', 50)->nullable();
            $table->text('message')->nullable();
            $table->boolean('acceptance')->nullable();
            $table->boolean('review')->nullable();
            $table->dateTime('review_date')->nullable();
            $table->timestamps();

            $table->foreign('form_id')
                ->references('id')
                ->on('cms_forms'); // ->onDelete('cascade');

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::drop('cms_registers');
    }
}
