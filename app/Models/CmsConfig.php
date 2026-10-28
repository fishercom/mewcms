<?php

namespace App\Models;

use App\Models\Concerns\FlushesFrontCache;
use App\Models\Concerns\LogsAdminActivity;
use App\Support\ContentSanitizer;
use App\Support\Sites;
use App\Support\SocialLinks;
use Illuminate\Database\Eloquent\Model;

class CmsConfig extends Model
{
    use FlushesFrontCache;
    use LogsAdminActivity;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $table = 'cms_configs';

    protected $fillable = ['site_id', 'type', 'name', 'alias', 'value'];

    /**
     * Layout settings printed as link targets on the public site.
     */
    public const URL_ALIASES = [
        'layout_header_logo',
        'layout_footer_logo',
        'layout_facebook',
        'layout_instagram',
        'layout_twitter',
        'layout_linkedin',
        'layout_youtube',
    ];

    protected static function booted(): void
    {
        static::saving(function (self $config): void {
            if ($config->alias === 'layout_copyright') {
                $config->value = ContentSanitizer::inline($config->value);
            } elseif ($config->alias === 'layout_custom_css') {
                $config->value = ContentSanitizer::css($config->value);
            } elseif ($config->alias === SocialLinks::ALIAS) {
                $config->value = json_encode(SocialLinks::decode($config->value), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            } elseif (in_array($config->alias, self::URL_ALIASES, true) && ! ContentSanitizer::isSafeUrl($config->value)) {
                $config->value = '';
            }
        });
    }

    /**
     * Values of the settings whose alias matches $aliasLike (SQL LIKE), keyed by alias,
     * for the current site: a site's own value wins over the shared one (no site).
     *
     * @return array<string, mixed>
     */
    public static function forSite(string $aliasLike): array
    {
        $siteId = Sites::currentId();

        return self::where('alias', 'like', $aliasLike)
            ->where(fn ($query) => $query->whereNull('site_id')->when($siteId, fn ($query) => $query->orWhere('site_id', $siteId)))
            // Shared rows first, so the site's own rows overwrite them
            ->orderByRaw('site_id is null desc')
            ->orderBy('id')
            ->pluck('value', 'alias')
            ->all();
    }

    /**
     * The current site's value of one setting (or the shared one).
     */
    public static function valueForSite(string $alias): mixed
    {
        $siteId = Sites::currentId();

        return self::where('alias', $alias)
            ->where(fn ($query) => $query->whereNull('site_id')->when($siteId, fn ($query) => $query->orWhere('site_id', $siteId)))
            ->orderByRaw('site_id is null asc')
            ->value('value');
    }

    /**
     * Save a setting for the current site, or the shared one when there are no sites.
     * The site's row is created from the shared one (same name and type) when missing.
     *
     * @param  array<string, mixed>  $attributes  defaults for a new row (type, name)
     */
    public static function saveForSite(string $alias, mixed $value, array $attributes = []): void
    {
        $siteId = Sites::currentId();
        $shared = self::whereNull('site_id')->where('alias', $alias)->first();

        $row = self::where('alias', $alias)->where('site_id', $siteId)->first()
            ?? ($siteId === null ? $shared : null)
            ?? new self([
                'site_id' => $siteId,
                'alias' => $alias,
                'type' => $shared->type ?? ($attributes['type'] ?? 'string'),
                'name' => $shared->name ?? ($attributes['name'] ?? $alias),
            ]);

        $row->value = $value;
        // Written without model events: callers log the whole save once
        $row->saveQuietly();
    }

    public function adminActivityModule(): string
    {
        return 'configs';
    }
}
