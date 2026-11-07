<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSite;
use App\Models\Concerns\FlushesFrontCache;
use Illuminate\Database\Eloquent\Model;

/**
 * A theme text a site changed: the site's value for one key ("shop.from_price") in one
 * language ("es"). Keys the site leaves alone show the theme's own text (see ThemeTexts).
 */
class CmsTranslation extends Model
{
    use BelongsToSite;
    use FlushesFrontCache;

    protected $table = 'cms_translations';

    protected $fillable = ['site_id', 'locale', 'key', 'value'];

    public function scopeInLocale($query, string $locale)
    {
        return $query->where('locale', $locale);
    }
}
