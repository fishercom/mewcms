<?php

namespace App\Support;

use App\Models\CmsArticle;
use App\Models\CmsLang;
use App\Models\CmsPost;
use Illuminate\Support\Facades\Cache;

/**
 * Starts the version of a page or post in another language of its site: a draft copy
 * linked to it by translation_group, below the version of its parent page there.
 */
class ContentVersions
{
    /**
     * The version of $item in $lang: made now (with $attributes, e.g. translated texts),
     * or the one there is already.
     *
     * @param  array<string, mixed>  $attributes
     */
    public static function create(CmsArticle|CmsPost $item, CmsLang $lang, ?int $userId, array $attributes = []): CmsArticle|CmsPost
    {
        // One version at a time per item and language: two requests (a retried step, a
        // double click) must not both create one
        return Cache::lock('content-version:'.$item->getMorphClass().':'.$item->getKey().':'.$lang->id, 30)
            ->block(30, fn () => self::createNow($item, $lang, $userId, $attributes));
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    protected static function createNow(CmsArticle|CmsPost $item, CmsLang $lang, ?int $userId, array $attributes): CmsArticle|CmsPost
    {
        // Another request may have linked the item to a version since it was loaded
        $item->translation_group = $item->newQuery()->whereKey($item->getKey())->value('translation_group');
        $item->syncOriginalAttribute('translation_group');

        $existing = $item->translationIn($lang->id);
        if ($existing) {
            return $existing;
        }

        $item->loadMissing('tags');
        $version = $item instanceof CmsArticle ? $item->replicate(['uri', 'position', 'published_at']) : $item->replicate();
        $version->forceFill([
            // The same address in the other language (replicating gives it a new slug)
            'slug' => $item->slug,
            'lang_id' => $lang->id,
            'translation_group' => $item->translationGroup(),
            'status' => $item::STATUS_DRAFT,
        ]);

        if ($version instanceof CmsArticle) {
            // Below the parent's version in that language, else at the top
            $version->parent_id = $item->parent_id ? CmsArticle::find($item->parent_id)?->translationIn($lang->id)?->id : null;
            // A single-use template (the home page) is single-use per language
            if ($version->schema?->isUnique() && Locales::scope(CmsArticle::where('schema_id', $version->schema_id), $lang->id)->exists()) {
                $version->schema_id = null;
            }
        }

        $version->forceFill($attributes);

        // Post addresses are unique per language (pages make their own unique among siblings)
        if ($version instanceof CmsPost) {
            $version->slug = self::freePostSlug((string) $version->slug ?: $item->slug, $lang->id);
        }

        $version->save();
        $version->tags()->sync($item->tags->modelKeys());
        $version->recordSave($userId);

        return $version;
    }

    /**
     * $slug, or $slug-2, -3... when another post in $langId (trashed ones included) uses it.
     */
    protected static function freePostSlug(string $slug, int $langId): string
    {
        $taken = CmsPost::withTrashed()->where('lang_id', $langId)
            ->where(fn ($query) => $query->where('slug', $slug)->orWhere('slug', 'like', $slug.'-%'))
            ->pluck('slug')->all();

        $candidate = $slug;
        $n = 2;
        while (in_array($candidate, $taken, true)) {
            $candidate = $slug.'-'.$n++;
        }

        return $candidate;
    }
}
