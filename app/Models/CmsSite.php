<?php

namespace App\Models;

use App\Models\Concerns\LogsAdminActivity;
use App\Support\FrontCache;
use App\Support\Sites;
use App\Support\Themes;
use Illuminate\Database\Eloquent\Model;

class CmsSite extends Model
{
    use LogsAdminActivity;

    protected $table = 'cms_sites';

    protected $fillable = ['name', 'site_url', 'domains', 'theme', 'lang_id', 'currency', 'title', 'description', 'favicon', 'head_scripts', 'body_scripts', 'default', 'active'];

    /** Currency of sites that have not chosen one */
    public const DEFAULT_CURRENCY = 'USD';

    protected $casts = [
        'domains' => 'array',
        'default' => 'boolean',
        'active' => 'boolean',
    ];

    /**
     * Content tables that belong to a site (see BelongsToSite). Settings (cms_configs)
     * also carry a site, but a row without one is shared by every site.
     */
    public const CONTENT_TABLES = ['cms_articles', 'cms_posts', 'cms_menus', 'cms_sliders', 'cms_forms', 'cms_redirects'];

    protected static function booted(): void
    {
        static::saving(function (self $site): void {
            $site->domains = array_values(array_unique(array_filter(array_map(
                fn ($domain): string => self::normalizeDomain((string) $domain),
                (array) $site->domains,
            ))));

            $site->currency = filled($site->currency) ? strtoupper((string) $site->currency) : null;

            if (blank($site->theme) || ! Themes::exists($site->theme)) {
                $site->theme = Themes::DEFAULT;
            }
        });

        // Only one default site
        static::saved(function (self $site): void {
            if ($site->default) {
                self::whereKeyNot($site->getKey())->where('default', true)->update(['default' => false]);
            }
            Sites::flush();
            FrontCache::flush();
        });

        static::deleted(function (): void {
            Sites::flush();
            FrontCache::flush();
        });
    }

    /**
     * "https://www.Example.com:8000/path" and "www.example.com" both become "www.example.com".
     */
    public static function normalizeDomain(string $domain): string
    {
        $domain = strtolower(trim($domain));
        if ($domain === '') {
            return '';
        }

        $host = parse_url(str_contains($domain, '://') ? $domain : 'http://'.$domain, PHP_URL_HOST);

        return is_string($host) ? rtrim($host, '.') : '';
    }

    /**
     * Every host name this site answers on.
     *
     * @return list<string>
     */
    public function hosts(): array
    {
        $hosts = (array) ($this->domains ?? []);
        if (filled($this->site_url)) {
            $hosts[] = self::normalizeDomain($this->site_url);
        }

        return array_values(array_unique(array_filter($hosts)));
    }

    /**
     * Address of the public site: its site URL, or its first domain. A local address
     * (localhost, 127.0.0.1, *.test, *.localhost) is skipped while the CMS is reached on a
     * public one, since it was written on a developer's machine (a seeded APP_URL, an
     * imported database) and would send "View site" to that machine.
     */
    public function publicUrl(): ?string
    {
        // On the command line this is a stand-in request for localhost, so nothing is skipped
        $request = request();
        $local = self::isLocalHost($request->getHost());
        $usable = fn (string $host): bool => $local || ! self::isLocalHost($host);

        if (filled($this->site_url) && $usable(self::normalizeDomain($this->site_url))) {
            return rtrim($this->site_url, '/');
        }

        $scheme = $request->isSecure() ? 'https://' : 'http://';
        foreach ((array) $this->domains as $domain) {
            if (filled($domain) && $usable(self::normalizeDomain($domain))) {
                return $scheme.$domain;
            }
        }

        // Only local addresses on record: the site is the one this request is served on
        if (Sites::currentId() === $this->id || ($this->default && Sites::forHost($request->getHost()) === null)) {
            return $request->getSchemeAndHttpHost();
        }

        return filled($this->site_url) ? rtrim($this->site_url, '/') : null;
    }

    /**
     * Whether $host only answers on a developer's machine.
     */
    public static function isLocalHost(string $host): bool
    {
        $host = self::normalizeDomain($host);

        return $host === 'localhost'
            || $host === '::1'
            || str_starts_with($host, '127.')
            || str_ends_with($host, '.localhost')
            || str_ends_with($host, '.test');
    }

    /**
     * Whether any content still belongs to this site.
     */
    public function hasContent(): bool
    {
        foreach (self::CONTENT_TABLES as $table) {
            if ($this->getConnection()->table($table)->where('site_id', $this->id)->exists()) {
                return true;
            }
        }

        return false;
    }

    public function lang()
    {
        return $this->belongsTo(CmsLang::class, 'lang_id');
    }

    /**
     * Extra languages of the site, besides its main language (see Locales).
     */
    public function langs()
    {
        return $this->belongsToMany(CmsLang::class, 'cms_site_langs', 'site_id', 'lang_id')->withTimestamps();
    }

    /**
     * Whether "/" shows something: the home page, or else the first published page
     * (see FrontController::show).
     */
    public function hasHomePage(): bool
    {
        return CmsArticle::withoutGlobalScope(CmsArticle::SITE_SCOPE)
            ->where('site_id', $this->id)
            ->published()
            ->exists();
    }

    /**
     * What the public pages and the admin need to know about the site.
     *
     * @return array<string, mixed>
     */
    public function summary(): array
    {
        return [
            ...$this->only(['id', 'name', 'description', 'favicon']),
            'title' => $this->title ?: $this->name,
            'url' => $this->publicUrl(),
            'locale' => $this->lang?->iso,
            // ISO 4217, the default currency of price fields
            'currency' => $this->currency ?: self::DEFAULT_CURRENCY,
        ];
    }

    public function adminActivityModule(): string
    {
        return 'sites';
    }
}
