<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Cviebrock\EloquentSluggable\Sluggable;
use Rutorika\Sortable\SortableTrait;

class CmsTaxonomyTerm extends Model {

    use Sluggable;
    use SortableTrait;

    protected $table = 'cms_taxonomy_terms';
    protected $fillable = ['taxonomy_id', 'parent_id', 'name', 'slug', 'description', 'active', 'position'];

    protected static $sortableField = 'position';
    protected static $sortableGroupField = ['taxonomy_id', 'parent_id'];

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

    public function taxonomy()
    {
        return $this->belongsTo('App\Models\CmsTaxonomy', 'taxonomy_id');
    }

    public function parent()
    {
        return $this->belongsTo('App\Models\CmsTaxonomyTerm', 'parent_id');
    }

    public function children()
    {
        return $this->hasMany('App\Models\CmsTaxonomyTerm', 'parent_id')->orderBy('position');
    }

    public function articles()
    {
        return $this->belongsToMany('App\Models\CmsArticle', 'cms_article_term', 'term_id', 'article_id');
    }
}
