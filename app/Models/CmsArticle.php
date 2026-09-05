<?php

namespace App\Models;

use Cviebrock\EloquentSluggable\Sluggable;
use Illuminate\Database\Eloquent\Model;
use Rutorika\Sortable\SortableTrait;

class CmsArticle extends Model
{
    /**
     * The database table used by the model.
     *
     * @var string
     */
    use Sluggable;

    use SortableTrait;

    protected $table = 'cms_articles';

    protected $fillable = ['schema_id', 'parent_id', 'lang_id', 'title', 'content', 'excerpt', 'featured_image', 'status', 'metadata', 'slug', 'active'];

    protected static $sortableField = 'position';

    protected static $sortableGroupField = 'parent_id';

    protected $casts = [
        'metadata' => 'array',
    ];

    public $front_view;

    public $route_view;

    public function sluggable(): array
    {
        return [
            'slug' => [
                'source' => 'ParentSlug',
            ],
        ];
    }

    public function getParentSlugAttribute(): string
    {
        $pslug = $this->parent != null ? $this->parent->slug.'_' : '';

        return $pslug.$this->title;
    }

    public function parent()
    {
        return $this->belongsTo(CmsArticle::class, 'parent_id');
    }

    public function lang()
    {
        return $this->belongsTo(CmsLang::class, 'lang_id');
    }

    public function schema()
    {
        return $this->belongsTo(CmsSchema::class, 'schema_id');
    }

    public function schemas()
    {
        return $this->hasMany(CmsSchema::class, 'id', 'schema_id');
    }

    public function page_schemas()
    {
        return $this->hasMany(CmsSchema::class, 'id', 'schema_id')
            ->where('type', 'PAGE')
            ->where('active', '1')
            ->orderBy('position');
    }

    public function children()
    {
        return $this->hasMany(CmsArticle::class, 'parent_id', 'id')
            ->where('active', '1')
            ->orderBy('position');
    }

    public function submenu()
    {
        return $this->hasMany(CmsArticle::class, 'parent_id', 'id')
            ->where(function ($query): void {
                $query->whereIn('schema_id', CmsSchema::select('id')->where('type', 'PAGE')->get()->toArray())
                    ->orWhereNull('schema_id');
            })
            ->where('active', '1')
            ->orderBy('position');
    }

    public function find_template($front_view)
    {
        return $this->hasOne(CmsArticle::class, 'parent_id', 'id')
            ->whereHas('schemas', function ($query) use ($front_view): void {
                $query->where('front_view', $front_view);
            });
    }

    public function child_template($front_view)
    {
        return $this->hasMany(CmsArticle::class, 'parent_id', 'id')
            ->whereHas('schemas', function ($query) use ($front_view): void {
                $query->where('front_view', $front_view);
            })
            ->where('active', '1')
            ->orderBy('position');
    }

    public function terms()
    {
        return $this->belongsToMany(CmsTaxonomyTerm::class, 'cms_article_term', 'article_id', 'term_id');
    }

    public function getAllDescendantIds(): array
    {
        $ids = [];
        $children = self::where('parent_id', $this->id)->get();
        foreach ($children as $child) {
            $ids[] = $child->id;
            $ids = array_merge($ids, $child->getAllDescendantIds());
        }

        return $ids;
    }
}
