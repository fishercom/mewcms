<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCmsFormFieldsTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('cms_form_fields', function (Blueprint $table): void {
            $table->increments('id');
            $table->integer('form_id')->unsigned();
            $table->string('name');
            $table->string('alias');
            $table->string('type', 15);
            $table->text('options')->nullable();
            $table->boolean('active')->nullable();
            $table->timestamps();

            $table->foreign('form_id')
                ->references('id')
                ->on('cms_forms')
                ->onDelete('cascade');

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::drop('cms_form_fields');
    }
}
