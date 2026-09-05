<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateAdmLogsTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('adm_logs', function (Blueprint $table): void {
            $table->bigincrements('id');
            $table->integer('event_id')->unsigned();
            $table->biginteger('user_id')->unsigned();
            $table->string('comment', 512)->nullable();
            $table->timestamps();

            $table->foreign('event_id')
                ->references('id')
                ->on('adm_events')
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
        Schema::drop('adm_logs');
    }
}
