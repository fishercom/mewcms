<?php

namespace App\Http\Controllers\Admin\Concerns;

use App\Models\CmsLang;
use App\Support\Locales;
use Illuminate\Database\Eloquent\Model;

/**
 * The "Translations" panel of the page and post editors: the item's version in each
 * language of the site, and the language a new version would be created in.
 */
trait TranslatesContent
{
    /**
     * Each language of the site with this item's version in it (null when it has none).
     * Empty on a site with a single language.
     *
     * @return list<array<string, mixed>>
     */
    protected function translationOptions(Model $item): array
    {
        if (! Locales::multiple()) {
            return [];
        }

        $versions = $item->translations();
        $own = Locales::forContent($item->lang_id)?->id;

        return Locales::of()->map(function (CmsLang $lang, int $index) use ($versions, $own, $item): array {
            $version = $lang->id === $own ? $item : $versions->get($lang->id);

            return [
                'id' => $lang->id,
                'iso' => (string) $lang->iso,
                'name' => (string) $lang->name,
                'main' => $index === 0,
                'current' => $lang->id === $own,
                'item' => $version?->only(['id', 'title', 'status']),
            ];
        })->all();
    }

    /**
     * The site language $langId, or a 404.
     */
    protected function targetLanguage(int $langId): CmsLang
    {
        $lang = Locales::of()->firstWhere('id', $langId);
        abort_unless($lang, 404);

        return $lang;
    }
}
