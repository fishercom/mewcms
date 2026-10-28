<?php

namespace App\Support;

use App\Models\CmsSite;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Unique;

/**
 * The site the current request belongs to. Public pages pick it by domain; the admin
 * works on the site chosen in its site switcher. Content models that belong to a site
 * (see BelongsToSite) only see the current site's rows.
 *
 * With no sites configured nothing is scoped, so a single-site install works as before.
 */
class Sites
{
    public const SESSION_KEY = 'cms.admin_site_id';

    private const CACHE_KEY = 'cms.sites';

    private const BINDING = 'cms.site';

    public static function current(): ?CmsSite
    {
        return app()->bound(self::BINDING) ? app(self::BINDING) : null;
    }

    public static function currentId(): ?int
    {
        return self::current()?->id;
    }

    public static function set(?CmsSite $site): void
    {
        app()->instance(self::BINDING, $site);
    }

    /**
     * Run $callback with $site as the current site, then restore the previous one.
     *
     * @template T
     *
     * @param  Closure(): T  $callback
     * @return T
     */
    public static function as(?CmsSite $site, Closure $callback): mixed
    {
        $previous = self::current();
        self::set($site);

        try {
            return $callback();
        } finally {
            self::set($previous);
        }
    }

    /**
     * All sites, cached until a site changes.
     *
     * @return Collection<int, CmsSite>
     */
    public static function all(): Collection
    {
        return Cache::rememberForever(self::CACHE_KEY, fn (): Collection => CmsSite::orderBy('id')->get());
    }

    public static function flush(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    public static function find(?int $id): ?CmsSite
    {
        return $id ? self::all()->firstWhere('id', $id) : null;
    }

    /**
     * The site marked as default, or else the first active one.
     */
    public static function default(): ?CmsSite
    {
        $active = self::all()->where('active', true);

        return $active->first(fn (CmsSite $site): bool => (bool) $site->default) ?? $active->first();
    }

    public static function defaultId(): ?int
    {
        return self::default()?->id;
    }

    /**
     * The site that answers on $host (one of its domains, or the host of its site URL).
     */
    public static function forHost(string $host): ?CmsSite
    {
        $host = CmsSite::normalizeDomain($host);

        return self::all()->first(fn (CmsSite $site): bool => in_array($host, $site->hosts(), true));
    }

    /**
     * Pick the site for a request: in the admin, the one chosen in the site switcher;
     * otherwise the one whose domain matches, falling back to the default site.
     * Returns null (and the request is not scoped) when there are no sites.
     */
    public static function resolve(Request $request): ?CmsSite
    {
        if (self::isAdminRequest($request) && $request->hasSession()) {
            $chosen = self::find((int) $request->session()->get(self::SESSION_KEY));
            if ($chosen) {
                return $chosen;
            }
        }

        $site = self::forHost($request->getHost());

        // A disabled site is not served; the admin can still reach it to turn it back on
        if ($site && ! $site->active && ! self::isAdminRequest($request)) {
            abort(404);
        }

        return $site ?? self::default();
    }

    /**
     * A unique validation rule limited to the current site (slugs, keys and aliases
     * may repeat across sites).
     */
    public static function unique(string $table, string $column, mixed $ignore = null): Unique
    {
        $siteId = self::currentId();

        return Rule::unique($table, $column)
            ->when($siteId !== null, fn (Unique $rule) => $rule->where('site_id', $siteId))
            ->ignore($ignore);
    }

    public static function isAdminRequest(Request $request): bool
    {
        return $request->is('admin', 'admin/*', 'laravel-filemanager', 'laravel-filemanager/*');
    }
}
