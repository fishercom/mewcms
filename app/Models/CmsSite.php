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

    protected $fillable = ['name', 'site_url', 'domains', 'theme', 'theme_settings', 'lang_id', 'title', 'description', 'favicon', 'default', 'active'];

    protected $casts = [
        'domains' => 'array',
        'theme_settings' => 'array',
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

            if (blank($site->theme) || ! Themes::exists($site->theme)) {
                $site->theme = Themes::DEFAULT;
            }

            // Only the settings the theme declares, with valid values
            $site->theme_settings = Themes::cleanSettings($site->theme, (array) ($site->theme_settings ?? []));
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
     * Address of the public site: its site URL, or its first domain.
     */
    public function publicUrl(): ?string
    {
        if (filled($this->site_url)) {
            return rtrim($this->site_url, '/');
        }

        $domain = ((array) $this->domains)[0] ?? null;

        return $domain ? (request()->isSecure() ? 'https://' : 'http://').$domain : null;
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
        ];
    }

    public function adminActivityModule(): string
    {
        return 'sites';
    }
}
