<?php

namespace App\Support;

use App\Models\CmsArticle;
use App\Models\CmsConfig;

/**
 * The page that lists each kind of entry ("post" for the blog, or a post type's slug):
 * an entry's page takes its banner, title and "back" link from it. Pages belong to a site,
 * so the choice is saved per site, in the setting "listing_page_<type>".
 */
class ListingPages
{
    public const PREFIX = 'listing_page_';

    public static function alias(string $type): string
    {
        return self::PREFIX.$type;
    }

    /** The id of the page chosen for $type on the current site */
    public static function id(string $type): ?int
    {
        $id = (int) CmsConfig::valueForSite(self::alias($type));

        return $id > 0 ? $id : null;
    }

    public static function set(string $type, ?int $pageId): void
    {
        CmsConfig::saveForSite(self::alias($type), $pageId ? (string) $pageId : '', [
            'type' => 'string',
            'name' => 'Página del listado ('.$type.')',
        ]);
        FrontCache::flush();
    }

    /** A post type changed its slug: its choice follows it on every site */
    public static function rename(string $from, string $to): void
    {
        if ($from !== $to) {
            CmsConfig::where('alias', self::alias($from))->update(['alias' => self::alias($to)]);
        }
    }

    public static function forget(string $type): void
    {
        CmsConfig::where('alias', self::alias($type))->delete();
    }

    /**
     * The listing page of $type as the public pages use it, in the language $langId when
     * the page has a published translation in it; null when none is chosen or published.
     *
     * @return array{id: int, title: string, url: string, excerpt: string|null, featured_image: string|null}|null
     */
    public static function for(string $type, ?int $langId = null): ?array
    {
        $id = self::id($type);
        $page = $id ? CmsArticle::published()->find($id) : null;
        if (! $page) {
            return null;
        }

        if ($langId && $page->lang_id !== $langId && filled($page->translation_group)) {
            $page = CmsArticle::published()
                ->where('translation_group', $page->translation_group)
                ->where('lang_id', $langId)
                ->first() ?? $page;
        }

        return [
            'id' => $page->id,
            'title' => (string) $page->title,
            'url' => $page->url,
            'excerpt' => $page->excerpt,
            'featured_image' => $page->featured_image,
        ];
    }

    /**
     * The pages of the current site to choose from, with their language.
     *
     * @return list<array{id: int, title: string, lang: string|null}>
     */
    public static function options(): array
    {
        return CmsArticle::with('lang:id,iso')->orderBy('title')->get(['id', 'title', 'lang_id'])
            ->map(fn (CmsArticle $page): array => ['id' => $page->id, 'title' => (string) $page->title, 'lang' => $page->lang?->iso])
            ->values()->all();
    }
}
