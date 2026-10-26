<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Social links become one editable list. The old fixed settings (Facebook, Instagram,
 * Twitter, LinkedIn, YouTube) are copied into it in their footer order and kept as they are.
 * The value column grows from 512 characters to text, which the list and custom CSS need.
 */
return new class extends Migration
{
    private const LEGACY = [
        'layout_facebook' => 'facebook',
        'layout_instagram' => 'instagram',
        'layout_twitter' => 'x',
        'layout_linkedin' => 'linkedin',
        'layout_youtube' => 'youtube',
    ];

    public function up(): void
    {
        Schema::table('cms_configs', function (Blueprint $table): void {
            $table->text('value')->nullable()->change();
        });

        if (DB::table('cms_configs')->where('alias', 'layout_social_links')->exists()) {
            return;
        }

        $old = DB::table('cms_configs')->whereIn('alias', array_keys(self::LEGACY))->pluck('value', 'alias');
        $links = [];
        foreach (self::LEGACY as $alias => $network) {
            $url = trim((string) ($old[$alias] ?? ''));
            if ($url !== '') {
                $links[] = ['network' => $network, 'url' => $url, 'label' => ''];
            }
        }

        $now = now();
        DB::table('cms_configs')->insert([
            'type' => 'json',
            'name' => 'Redes sociales',
            'alias' => 'layout_social_links',
            'value' => json_encode($links, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }

    public function down(): void
    {
        DB::table('cms_configs')->where('alias', 'layout_social_links')->delete();
    }
};
