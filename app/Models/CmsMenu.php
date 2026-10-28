<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSite;
use App\Models\Concerns\FlushesFrontCache;
use App\Models\Concerns\LogsAdminActivity;
use Cviebrock\EloquentSluggable\Sluggable;
use Illuminate\Database\Eloquent\Model;

class CmsMenu extends Model
{
    use BelongsToSite;
    use FlushesFrontCache;
    use LogsAdminActivity;
    use Sluggable;

    protected $table = 'cms_menus';

    protected $fillable = ['name', 'slug', 'description', 'auto_add_pages', 'auto_add_subpages', 'active'];

    protected $casts = [
        'auto_add_pages' => 'boolean',
        'auto_add_subpages' => 'boolean',
        'active' => 'boolean',
    ];

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
