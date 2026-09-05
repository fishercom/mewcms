<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCmsNotifiesTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('cms_notifies', function (Blueprint $table): void {
            $table->increments('id');
            $table->integer('form_id')->unsigned();
            $table->biginteger('user_id')->unsigned();
            $table->text('recipients')->nullable();
            $table->boolean('active')->nullable();
            $table->timestamps();

            $table->foreign('form_id')
                ->references('id')
                ->on('cms_forms')
                ->onDelete('cascade');

            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::drop('cms_notifies');
    }
}
