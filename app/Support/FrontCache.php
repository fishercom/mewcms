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
 * Caches data every public page needs; content models flush it when they change.
 */
class FrontCache
{
    public const TTL = 3600;

    private const KEYS = ['front.shared', 'front.menus', 'front.layout', 'front.sitemap'];

    /**
     * Navigation, popular tags and recent articles shared by the public templates.
     *
     * @return array{navigation: array<int, mixed>, popularTags: list<array{id: int, name: string, slug: string, count: int}>, recentArticles: array<int, mixed>}
     */
    public static function shared(): array
    {
        return Cache::remember('front.shared', self::ttl(...), fn (): array => [
            // Root navigation links (all published top-level pages)
            'navigation' => CmsArticle::published()
                ->whereNull('parent_id')
                ->orderBy('position')
                ->get(['id', 'title', 'slug'])
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
        return Cache::remember('front.menus', self::ttl(...), fn (): array => CmsMenu::with(['items' => function ($query): void {
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
        return Cache::remember('front.layout', self::TTL, fn (): array => CmsConfig::where('alias', 'like', 'layout_%')
            ->pluck('value', 'alias')
            ->all());
    }

    /**
     * @param  Closure(): string  $build
     */
    public static function sitemap(Closure $build): string
    {
        return Cache::remember('front.sitemap', self::ttl(...), $build);
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

    public static function flush(): void
    {
        foreach (self::KEYS as $key) {
            Cache::forget($key);
        }
    }
}
