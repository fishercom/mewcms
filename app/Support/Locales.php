<?php

namespace App\Support;

use App\Models\CmsLang;
use App\Models\CmsSite;
use Closure;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

/**
 * The languages of a site and the one the current request is in.
 *
 * A site has a main language (cms_sites.lang_id), whose pages have no prefix
 * ("/nosotros"), and may have extra languages (cms_site_langs), whose pages answer under
 * their code ("/en/about"). Public pages take the language from the address (see
 * ResolveLocale); the admin edits the one picked in its language switcher.
 *
 * Content in the main language is every row that is not in an extra language, so a site
 * with a single language shows all its content whatever language it was saved in.
 */
class Locales
{
    /** Request attribute set by ResolveLocale: the language id taken from the address */
    public const ATTRIBUTE = 'cms.locale';

    /** Request attribute set by ResolveLocale: the address before its prefix was taken off */
    public const ORIGINAL_URI = 'cms.original_uri';

    /** Session key of the language the admin edits, per site */
    public const SESSION_KEY = 'cms.admin_lang';

    private const BINDING = 'cms.locale';

    /**
     * The site's main language.
     */
    public static function main(?CmsSite $site = null): ?CmsLang
    {
        $site ??= Sites::current();

        return $site?->lang;
    }

    /**
     * The site's extra languages (active ones, other than the main one), by name.
     *
     * @return Collection<int, CmsLang>
     */
    public static function extra(?CmsSite $site = null): Collection
    {
        $site ??= Sites::current();
        if (! $site) {
            return collect();
        }

        return $site->langs
            ->filter(fn (CmsLang $lang): bool => $lang->active && $lang->id !== $site->lang_id)
            ->sortBy('name')
            ->values();
    }

    /**
     * Every language of the site: the main one first.
     *
     * @return Collection<int, CmsLang>
     */
    public static function of(?CmsSite $site = null): Collection
    {
        $site ??= Sites::current();
        $main = self::main($site);

        return collect($main ? [$main] : [])->concat(self::extra($site))->values();
    }

    /**
     * Whether the site answers in more than one language.
     */
    public static function multiple(?CmsSite $site = null): bool
    {
        return self::extra($site)->isNotEmpty();
    }

    /**
     * The language of the current request: the one in the address on public pages, the
     * one picked in the admin, else the site's main language.
     */
    public static function current(): ?CmsLang
    {
        $bound = app()->bound(self::BINDING) ? app(self::BINDING) : null;

        // Set for another site (see Sites::as): that site's language does not apply here
        if ($bound && ! self::of()->contains('id', $bound->id)) {
            $bound = null;
        }

        return $bound ?? self::main();
    }

    public static function currentId(): ?int
    {
        return self::current()?->id;
    }

    public static function set(?CmsLang $lang): void
    {
        app()->instance(self::BINDING, $lang);
    }

    /**
     * Run $callback in $lang, then restore the previous language.
     *
     * @template T
     *
     * @param  Closure(): T  $callback
     * @return T
     */
    public static function as(?CmsLang $lang, Closure $callback): mixed
    {
        $previous = app()->bound(self::BINDING) ? app(self::BINDING) : null;
        self::set($lang);

        try {
            return $callback();
        } finally {
            self::set($previous);
        }
    }

    /**
     * Whether the current request is in an extra language (and its addresses carry a prefix).
     */
    public static function isExtra(?int $langId = null): bool
    {
        $langId ??= self::currentId();

        return $langId !== null && self::extra()->contains('id', $langId);
    }

    /**
     * Language of the content saved in $langId, as the current site serves it: the extra
     * language it is in, else the main language.
     */
    public static function forContent(?int $langId): ?CmsLang
    {
        return self::extra()->firstWhere('id', $langId) ?? self::main();
    }

    /**
     * Address prefix of $langId on the current site: "" for the main language, "/en" for an extra one.
     */
    public static function prefix(?int $langId = null): string
    {
        $langId ??= self::currentId();
        $lang = self::extra()->firstWhere('id', $langId);

        return $lang ? '/'.self::segment($lang) : '';
    }

    /**
     * $path ("/blog/hello") in $langId (the current language by default): "/en/blog/hello".
     * External addresses and anchors are left alone.
     */
    public static function url(string $path, ?int $langId = null): string
    {
        if (! str_starts_with($path, '/') || str_starts_with($path, '//')) {
            return $path;
        }

        $prefix = self::prefix($langId);
        if ($prefix === '') {
            return $path;
        }

        return $path === '/' ? $prefix : $prefix.$path;
    }

    /**
     * The address segment of a language: its code in lowercase ("en", "pt-br").
     */
    public static function segment(CmsLang $lang): string
    {
        return strtolower((string) $lang->iso);
    }

    /**
     * Limit $query to the content in $langId (the current language by default). The main
     * language holds every row that is not in an extra language. A site with one language
     * is not filtered.
     *
     * @template T of Builder
     *
     * @param  T  $query
     * @return T
     */
    public static function scope(Builder $query, ?int $langId = null, string $column = 'lang_id'): Builder
    {
        $extra = self::extra()->pluck('id')->all();
        if ($extra === []) {
            return $query;
        }

        $langId ??= self::currentId();
        $column = $query->qualifyColumn($column);

        if (in_array($langId, $extra, true)) {
            return $query->where($column, $langId);
        }

        return $query->where(fn (Builder $query) => $query->whereNull($column)->orWhereNotIn($column, $extra));
    }

    /**
     * The language of a request: on public pages the one ResolveLocale read from the
     * address; in the admin the one picked for the site, else the main language.
     */
    public static function resolve(Request $request): ?CmsLang
    {
        if (Sites::isAdminRequest($request)) {
            $chosen = $request->hasSession() ? $request->session()->get(self::SESSION_KEY.'.'.Sites::currentId()) : null;

            return self::of()->firstWhere('id', (int) $chosen) ?? self::main();
        }

        $fromAddress = $request->attributes->get(self::ATTRIBUTE);

        return self::extra()->firstWhere('id', $fromAddress) ?? self::main();
    }

    /**
     * Make the admin edit the current site in $langId (one of the site's languages).
     */
    public static function choose(Request $request, int $langId): ?CmsLang
    {
        $lang = self::of()->firstWhere('id', $langId);
        if ($lang) {
            $request->session()->put(self::SESSION_KEY.'.'.Sites::currentId(), $lang->id);
            self::set($lang);
        }

        return $lang;
    }

    /**
     * The extra language whose code starts $path on $site ("/en/about" → English).
     */
    public static function fromPath(CmsSite $site, string $path): ?CmsLang
    {
        $first = strtolower(explode('/', ltrim($path, '/'), 2)[0]);
        if ($first === '') {
            return null;
        }

        return self::extra($site)->first(fn (CmsLang $lang): bool => self::segment($lang) === $first);
    }

    /**
     * What the public pages need: the current language and every language of the site,
     * each with its address prefix.
     *
     * @return list<array{id: int, iso: string, name: string, prefix: string, main: bool}>
     */
    public static function summary(): array
    {
        return self::of()->map(fn (CmsLang $lang, int $index): array => [
            'id' => $lang->id,
            'iso' => (string) $lang->iso,
            'name' => (string) $lang->name,
            'prefix' => self::prefix($lang->id),
            'main' => $index === 0,
        ])->all();
    }

    /**
     * The address of the current page in each language of the site, for the language
     * switcher and hreflang. For a page or post, its versions in the other languages
     * (marked "missing", and pointing at that language's home, where it has none);
     * otherwise $path (the current address by default) under each prefix.
     *
     * @return list<array{iso: string, name: string, url: string, current: bool, missing: bool}>
     */
    public static function alternates(?Model $item = null, ?string $path = null): array
    {
        if (! self::multiple()) {
            return [];
        }

        $byLang = collect();
        if ($item) {
            $versions = filled($item->getAttribute('translation_group'))
                ? $item->newQuery()->where('translation_group', $item->getAttribute('translation_group'))->published()->get()
                : $item->newCollection();
            if ($item->exists && ! $versions->contains($item)) {
                $versions->push($item);
            }
            // The version being shown wins over another one saved in the same language
            $byLang = $versions->sortBy(fn (Model $version): int => $version->is($item) ? 0 : 1)
                ->unique(fn (Model $version): ?int => self::forContent($version->getAttribute('lang_id'))?->id)
                ->keyBy(fn (Model $version): ?int => self::forContent($version->getAttribute('lang_id'))?->id);
        }

        if ($path === null) {
            $request = request();
            $query = $request->getQueryString();
            $path = '/'.ltrim($request->getPathInfo(), '/').($query ? '?'.$query : '');
        }

        $current = self::currentId();

        return self::of()->map(function (CmsLang $lang) use ($item, $byLang, $path, $current): array {
            $version = $byLang->get($lang->id);

            return [
                'iso' => (string) $lang->iso,
                'name' => (string) $lang->name,
                'url' => $item ? ($version ? $version->getAttribute('url') : self::url('/', $lang->id)) : self::url($path, $lang->id),
                'current' => $lang->id === $current,
                'missing' => $item !== null && $version === null,
            ];
        })->all();
    }
}
