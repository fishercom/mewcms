<?php

namespace App\Support;

use App\Models\CmsArticle;
use App\Models\CmsConfig;
use App\Models\CmsMenu;
use App\Models\CmsTaxonomy;
use Closure;
use Illuminate\Support\Facades\Cache;

/**
 * Caches data every public page needs; content models flush it when they change.
 */
class FrontCache
{
    public const TTL = 3600;

    private const KEYS = ['front.shared', 'front.menus', 'front.layout', 'front.sitemap'];

    /**
     * Navigation, taxonomies and recent articles shared by the public templates.
     *
     * @return array{navigation: array<int, mixed>, allTaxonomies: array<int, mixed>, recentArticles: array<int, mixed>}
     */
    public static function shared(): array
    {
        return Cache::remember('front.shared', self::TTL, fn (): array => [
            // Root navigation links (all active top-level pages)
            'navigation' => CmsArticle::whereNull('parent_id')
                ->where('active', 1)
                ->orderBy('position')
                ->get(['id', 'title', 'slug'])
                ->toArray(),
            // Active taxonomies with active terms and their articles count
            'allTaxonomies' => CmsTaxonomy::with(['terms' => function ($q): void {
                $q->where('active', true)->orderBy('position')->withCount('articles');
            }])->where('active', true)->get()->toArray(),
            // Recent active articles (except home page)
            'recentArticles' => CmsArticle::where('active', 1)
                ->where('slug', '!=', 'home-page')
                ->latest()
                ->take(5)
                ->get(['id', 'title', 'slug', 'created_at'])
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
        return Cache::remember('front.menus', self::TTL, fn (): array => CmsMenu::with(['items' => function ($query): void {
            $query->where('active', true)->orderBy('position')->with('article');
        }])->where('active', true)->get()->toArray());
    }

    /**
     * Layout settings keyed by alias.
     *
     * @return array<string, mixed>
     */
    public static function layoutSettings(): array
    {
        return Cache::remember('front.layout', self::TTL, fn (): array => CmsConfig::where('alias', 'like', 'layout_%')
            ->pluck('value', 'alias')
            ->all());
    }

    /**
     * @param  Closure(): string  $build
     */
    public static function sitemap(Closure $build): string
    {
        return Cache::remember('front.sitemap', self::TTL, $build);
    }

    public static function flush(): void
    {
        foreach (self::KEYS as $key) {
            Cache::forget($key);
        }
    }
}
