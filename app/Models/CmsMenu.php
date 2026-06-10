<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Cviebrock\EloquentSluggable\Sluggable;

class CmsMenu extends Model {

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
                'source' => 'name'
            ]
        ];
    }

    public function items()
    {
        return $this->hasMany('App\Models\CmsMenuItem', 'menu_id')->orderBy('position');
    }
}
