<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSite;
use App\Models\Concerns\FlushesFrontCache;
use App\Models\Concerns\LogsAdminActivity;
use App\Support\Locales;
use Cviebrock\EloquentSluggable\Sluggable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * A menu of one language of a site (see Locales): themes find it by slug ("main", "footer").
 */
class CmsMenu extends Model
{
    use BelongsToSite;
    use FlushesFrontCache;
    use LogsAdminActivity;
    use Sluggable;

    protected $table = 'cms_menus';

    protected $fillable = ['lang_id', 'name', 'slug', 'description', 'auto_add_pages', 'auto_add_subpages', 'active'];

    protected $casts = [
        'auto_add_pages' => 'boolean',
        'auto_add_subpages' => 'boolean',
        'active' => 'boolean',
    ];

    protected static function booted(): void
    {
        // A new menu belongs to the language being edited
        static::creating(function (self $menu): void {
            $menu->lang_id ??= Locales::currentId();
        });
    }

    /**
     * Slugs are unique per language: each language has its own "main" menu.
     */
    public function scopeWithUniqueSlugConstraints(Builder $query, Model $model, string $attribute, array $config, string $slug): Builder
    {
        return $query->where('lang_id', $model->lang_id);
    }

    public function lang()
    {
        return $this->belongsTo(CmsLang::class, 'lang_id');
    }

    public function sluggable(): array
    {
        return [
            'slug' => [
                'source' => 'name',
            ],
        ];
    }

    public function items()
    {
        return $this->hasMany(CmsMenuItem::class, 'menu_id')->orderBy('position');
    }

    public function adminActivityModule(): string
    {
        return 'menus';
    }
}
