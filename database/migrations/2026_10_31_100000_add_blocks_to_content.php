<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Pages and posts are built from blocks. Each existing item gets its current content as
 * one rich text block; the content column is kept as it is (it now mirrors the blocks).
 */
return new class extends Migration
{
    private const TABLES = ['cms_articles', 'cms_posts', 'cms_revisions'];

    public function up(): void
    {
        foreach (self::TABLES as $table) {
            Schema::table($table, function (Blueprint $table): void {
                $table->json('blocks')->nullable()->after('content');
            });
        }

        $this->convert();
    }

    /** Give every page and post without blocks its content as one rich text block */
    public function convert(): void
    {
        foreach (['cms_articles', 'cms_posts'] as $table) {
            DB::table($table)->whereNull('blocks')->orderBy('id')->chunkById(200, function ($rows) use ($table): void {
                foreach ($rows as $row) {
                    $html = (string) $row->content;
                    $blocks = trim($html) === ''
                        ? []
                        : [['id' => (string) Str::uuid(), 'type' => 'rich_text', 'version' => 1, 'data' => ['html' => $html]]];

                    DB::table($table)->where('id', $row->id)->update(['blocks' => json_encode($blocks, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)]);
                }
            });
        }
    }

    public function down(): void
    {
        foreach (self::TABLES as $table) {
            Schema::table($table, function (Blueprint $table): void {
                $table->dropColumn('blocks');
            });
        }
    }
};
