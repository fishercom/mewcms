<?php

namespace App\Support;

use App\Models\CmsArticle;
use App\Models\CmsConfig;
use App\Models\CmsMenu;
use App\Models\CmsPost;
use App\Models\CmsTag;
use Closure;
use Illuminate\Support\Facades\Cache;

/**
 * Caches data every public page needs, per site; content models flush it when they change.
 */
class FrontCache
{
    public const TTL = 3600;

    private const KEYS = ['shared', 'menus', 'layout', 'sitemap'];

    /**
     * Navigation, popular tags and recent articles shared by the public templates.
     *
     * @return array{navigation: array<int, mixed>, popularTags: list<array{id: int, name: string, slug: string, count: int}>, recentArticles: array<int, mixed>}
     */
    public static function shared(): array
    {
        return Cache::remember(self::key('shared'), self::ttl(...), fn (): array => [
            // Root navigation links (all published top-level pages)
            'navigation' => CmsArticle::published()
                ->whereNull('parent_id')
                ->orderBy('position')
                ->get(['id', 'lang_id', 'title', 'slug', 'uri'])
                ->toArray(),
            // Most used tags across published pages and posts
            'popularTags' => CmsTag::where('active', true)
                ->withPublishedCounts()
                ->get()
                ->map(fn (CmsTag $tag): array => [...$tag->only(['id', 'name', 'slug']), 'count' => $tag->articles_count + $tag->posts_count])
                ->filter(fn (array $tag): bool => $tag['count'] > 0)
                ->sortByDesc('count')
                ->take(20)
                ->values()
                ->all(),
            // Recent published articles (except home page)
            'recentArticles' => CmsArticle::published()
                ->where('slug', '!=', 'home-page')
                ->latest()
                ->take(5)
                ->get(['id', 'lang_id', 'title', 'slug', 'uri', 'created_at'])
                ->toArray(),
        ]);
    }

    /**
     * Active menus with their active items.
     *
     * @return array<int, mixed>
     */
    public static function menus(): array
    {
        return Cache::remember(self::key('menus'), self::ttl(...), fn (): array => CmsMenu::with(['items' => function ($query): void {
            // Items pointing at a draft, scheduled or trashed page are hidden
            $query->where('active', true)
                ->where(fn ($query) => $query->whereNull('article_id')->orWhereHas('article', fn ($query) => $query->published()))
                ->orderBy('position')
                ->with('article');
        }])->where('active', true)->get()->toArray());
    }

    /**
     * Layout settings keyed by alias.
     *
     * @return array<string, mixed>
     */
    public static function layoutSettings(): array
    {
        return Cache::remember(self::key('layout'), self::TTL, function (): array {
            $settings = CmsConfig::forSite('layout_%');

            // Rendered as HTML in the footer: sanitize again in case it was written around the model
            if (isset($settings['layout_copyright'])) {
                $settings['layout_copyright'] = ContentSanitizer::inline($settings['layout_copyright']);
            }

            return $settings;
        });
    }

    /**
     * @param  Closure(): string  $build
     */
    public static function sitemap(Closure $build): string
    {
        return Cache::remember(self::key('sitemap'), self::ttl(...), $build);
    }

    /**
     * Seconds to keep published content, cut short so scheduled pages and posts
     * appear as soon as their publication date passes.
     */
    public static function ttl(): int
    {
        $next = collect([CmsArticle::class, CmsPost::class])
            ->map(fn (string $model) => $model::query()
                ->where('status', 'published')
                ->where('active', true)
                ->where('published_at', '>', now())
                ->min('published_at'))
            ->filter()
            ->min();

        if ($next === null) {
            return self::TTL;
        }

        return max(1, min(self::TTL, (int) ceil(now()->diffInSeconds($next, true))));
    }

    /**
     * Cache key of $name for the current site ("front.shared" when there are no sites).
     */
    public static function key(string $name): string
    {
        return self::siteKey($name, Sites::currentId());
    }

    /**
     * Forget every site's cached data: settings without a site are shared by all sites.
     */
    public static function flush(): void
    {
        foreach ([null, ...Sites::all()->pluck('id')] as $siteId) {
            foreach (self::KEYS as $name) {
                Cache::forget(self::siteKey($name, $siteId));
            }
        }
    }

    private static function siteKey(string $name, ?int $siteId): string
    {
        return $siteId === null ? 'front.'.$name : 'front.'.$siteId.'.'.$name;
    }
}
