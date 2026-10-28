<?php

namespace App\Models\Concerns;

use App\Models\CmsSite;
use App\Support\Sites;
use Closure;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Content that belongs to one site. Queries only see the current site's rows, and new
 * rows are created in the current site (or the default one outside a request).
 * Without a current site (no sites configured) nothing is filtered.
 */
trait BelongsToSite
{
    public const SITE_SCOPE = 'site';

    public static function bootBelongsToSite(): void
    {
        static::addGlobalScope(self::SITE_SCOPE, function (Builder $query): void {
            $siteId = Sites::currentId();
            if ($siteId !== null) {
                $query->where($query->qualifyColumn('site_id'), $siteId);
            }
        });

        // On saving rather than creating, so the model's own saving hooks know its site
        static::saving(function (self $model): void {
            if (! $model->exists) {
                $model->site_id ??= Sites::currentId() ?? Sites::defaultId();
            }
        });
    }

    /**
     * Run $callback with this model's site as the current site, so queries made for it
     * (sibling slugs, redirects...) stay in its site whatever site the request is on.
     *
     * @template T
     *
     * @param  Closure(): T  $callback
     * @return T
     */
    public function inOwnSite(Closure $callback): mixed
    {
        return Sites::as(Sites::find($this->site_id) ?? Sites::current(), $callback);
    }

    public function site(): BelongsTo
    {
        return $this->belongsTo(CmsSite::class, 'site_id');
    }

    /**
     * Rows of the same site as this model, whatever the current site is.
     */
    public function scopeSameSiteAs(Builder $query, self $model): Builder
    {
        $query->withoutGlobalScope(self::SITE_SCOPE);

        return $model->site_id === null
            ? $query->whereNull($query->qualifyColumn('site_id'))
            : $query->where($query->qualifyColumn('site_id'), $model->site_id);
    }
}
