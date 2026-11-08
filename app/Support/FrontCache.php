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
 * Caches data every public page needs, per site and language; content models flush it when they change.
 * The theme texts (ThemeTexts) are cached here too, under "texts".
 */
class FrontCache
{
    public const TTL = 3600;

    private const KEYS = ['shared', 'menus', 'layout', 'sitemap', 'texts'];

    /**
     * Navigation, popular tags, recent articles and recent posts shared by the public templates.
     *
     * @return array{navigation: array<int, mixed>, popularTags: list<array{id: int, name: string, slug: string, count: int}>, recentArticles: array<int, mixed>, recentPosts: array<int, mixed>}
     */
    public static function shared(): array
    {
        return Cache::remember(self::key('shared'), self::ttl(...), fn (): array => [
            // Root navigation links (all published top-level pages)
            'navigation' => CmsArticle::published()
                ->tap(fn ($query) => Locales::scope($query))
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
                ->tap(fn ($query) => Locales::scope($query))
                ->where('slug', '!=', 'home-page')
                ->latest()
                ->take(5)
                ->get(['id', 'lang_id', 'title', 'slug', 'uri', 'created_at'])
                ->toArray(),
            // Latest published blog posts, for home pages and "read next" lists
            'recentPosts' => CmsPost::published()
                ->tap(fn ($query) => Locales::scope($query))
                ->where('post_type', 'post')
                ->with('tags:id,name,slug')
                ->latest('published_at')
                ->take(7)
                ->get(['id', 'lang_id', 'post_type', 'title', 'slug', 'excerpt', 'featured_image', 'published_at'])
                ->map(fn (CmsPost $post): array => [...$post->toArray(), 'url' => $post->url])
                ->all(),
        ]);
    }

    /**
     * Active menus of the current language with their active items. A language without
     * its own copy of a menu (same slug) shows the main language's, whose page links go
     * to each page's version in the current language when it has one.
     *
     * @return array<int, mixed>
     */
    public static function menus(): array
    {
        return Cache::remember(self::key('menus'), self::ttl(...), function (): array {
            $load = fn ($query) => $query->with(['items' => function ($query): void {
                // Items pointing at a draft, scheduled or trashed page are hidden
                $query->where('active', true)
                    ->where(fn ($query) => $query->whereNull('article_id')->orWhereHas('article', fn ($query) => $query->published()))
                    ->orderBy('position')
                    ->with('article');
            }])->where('active', true)->get();

            $menus = $load(Locales::scope(CmsMenu::query()));
            if (! Locales::isExtra()) {
                return $menus->toArray();
            }

            $lang = Locales::current();
            $borrowed = $load(Locales::scope(CmsMenu::query(), Locales::main()?->id)->whereNotIn('slug', $menus->pluck('slug')));
            foreach ($borrowed as $menu) {
                foreach ($menu->items as $item) {
                    $version = $item->article ? MenuCopier::versionIn($item->article, $lang) : null;
                    if ($version && $version->isLive()) {
                        // A label that is the page's title follows the translated title
                        if ($item->title === $item->article->title) {
                            $item->title = $version->title;
                        }
                        $item->setRelation('article', $version);
                    }
                }
            }

            return $menus->concat($borrowed)->values()->toArray();
        });
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
     * Cache key of $name for the current site and language ("front.shared" when there
     * are no sites, "front.1.en.shared" for a site's extra language).
     */
    public static function key(string $name): string
    {
        return self::siteKey($name, Sites::currentId(), Locales::isExtra() ? Locales::currentId() : null);
    }

    /**
     * Forget every site's cached data, in every language: settings without a site are
     * shared by all sites.
     */
    public static function flush(): void
    {
        $keys = [[null, null]];
        foreach (Sites::all() as $site) {
            foreach ([null, ...Locales::extra($site)->pluck('id')] as $langId) {
                $keys[] = [$site->id, $langId];
            }
        }

        foreach ($keys as [$siteId, $langId]) {
            foreach (self::KEYS as $name) {
                Cache::forget(self::siteKey($name, $siteId, $langId));
            }
        }
    }

    private static function siteKey(string $name, ?int $siteId, ?int $langId = null): string
    {
        if ($siteId === null) {
            return 'front.'.$name;
        }

        return 'front.'.$siteId.'.'.($langId !== null ? 'lang'.$langId.'.' : '').$name;
    }
}
