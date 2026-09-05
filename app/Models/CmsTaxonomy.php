<?php

namespace App\Models;

use Cviebrock\EloquentSluggable\Sluggable;
use Illuminate\Database\Eloquent\Model;

class CmsTaxonomy extends Model
{
    use Sluggable;

    protected $table = 'cms_taxonomies';

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

    public function terms()
    {
        return $this->hasMany(CmsTaxonomyTerm::class, 'taxonomy_id')->orderBy('position');
    }
}
