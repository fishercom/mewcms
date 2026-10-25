<?php

namespace App\Models\Concerns;

use App\Support\FrontCache;

/**
 * Clears the cached public navigation, menus, layout and sitemap when the model changes.
 */
trait FlushesFrontCache
{
    public static function bootFlushesFrontCache(): void
    {
        static::saved(fn () => FrontCache::flush());
        static::deleted(fn () => FrontCache::flush());
    }
}
