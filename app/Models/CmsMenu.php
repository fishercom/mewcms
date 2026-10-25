<?php

namespace App\Models;

use App\Models\Concerns\LogsAdminActivity;
use Cviebrock\EloquentSluggable\Sluggable;
use Illuminate\Database\Eloquent\Model;

class CmsMenu extends Model
{
    use LogsAdminActivity;
    use Sluggable;

    protected $table = 'cms_menus';

    protected $fillable = ['name', 'slug', 'description', 'active'];

    protected $casts = [
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
