<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCmsRegisterFieldsTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('cms_register_fields', function (Blueprint $table): void {
            $table->increments('id');
            $table->integer('register_id')->unsigned();
            $table->integer('field_id')->unsigned();
            $table->string('value');
            $table->text('txt_value')->nullable();
            $table->timestamps();

            $table->foreign('register_id')
                ->references('id')
                ->on('cms_registers')
                ->onDelete('cascade');

            $table->foreign('field_id')
                ->references('id')
                ->on('cms_form_fields'); // ->onDelete('cascade');

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::drop('cms_register_fields');
    }
}
