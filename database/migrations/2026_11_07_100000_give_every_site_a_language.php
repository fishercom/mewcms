<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * A site's language is now required: each site holds the content of one language, and
 * another language is another site. Sites saved without one get the CMS default language
 * (APP_LOCALE), or the first active language.
 */
return new class extends Migration
{
    public function up(): void
    {
        $langId = DB::table('cms_langs')->where('iso', config('app.locale'))->value('id')
            ?? DB::table('cms_langs')->where('active', true)->orderBy('id')->value('id')
            ?? DB::table('cms_langs')->orderBy('id')->value('id');

        if ($langId !== null) {
            DB::table('cms_sites')->whereNull('lang_id')->update(['lang_id' => $langId]);
        }
    }

    public function down(): void
    {
        // Nothing to undo: the languages filled in stay valid
    }
};
