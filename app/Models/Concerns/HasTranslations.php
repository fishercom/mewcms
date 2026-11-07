<?php

namespace App\Models\Concerns;

use App\Support\Locales;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

/**
 * A page or post with versions in the site's other languages. The versions share a
 * translation_group; each is a full item of its own (title, address, content, status).
 */
trait HasTranslations
{
    /**
     * The other versions of this item, keyed by the language the site serves them in.
     *
     * @return Collection<int, static>
     */
    public function translations(): Collection
    {
        if (blank($this->translation_group)) {
            return collect();
        }

        return static::query()
            ->where('translation_group', $this->translation_group)
            ->whereKeyNot($this->getKey())
            ->orderBy('id')
            ->get()
            ->keyBy(fn (self $version): ?int => Locales::forContent($version->lang_id)?->id);
    }

    /**
     * The version of this item in $langId, if there is one.
     */
    public function translationIn(int $langId): ?static
    {
        return $this->translations()->get($langId);
    }

    /**
     * The group that links this item with its versions, created the first time it is translated.
     */
    public function translationGroup(): string
    {
        if (blank($this->translation_group)) {
            $this->forceFill(['translation_group' => (string) Str::uuid()])->saveQuietly();
        }

        return $this->translation_group;
    }
}
