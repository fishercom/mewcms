<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CmsMenuItem extends Model
{
    protected $table = 'cms_menu_items';

    protected $fillable = ['menu_id', 'parent_id', 'title', 'url', 'article_id', 'target', 'position', 'active'];

    protected $casts = [
        'active' => 'boolean',
        'position' => 'integer',
        'menu_id' => 'integer',
        'parent_id' => 'integer',
        'article_id' => 'integer',
    ];

    protected $appends = ['resolved_url'];

    public function menu()
    {
        return $this->belongsTo('App\Models\CmsMenu', 'menu_id');
    }

    public function parent()
    {
        return $this->belongsTo('App\Models\CmsMenuItem', 'parent_id');
    }

    public function children()
    {
        return $this->hasMany('App\Models\CmsMenuItem', 'parent_id')->orderBy('position');
    }

    public function article()
    {
        return $this->belongsTo('App\Models\CmsArticle', 'article_id');
    }

    /**
     * Resolve the dynamic URL, checking if it points to a CMS article.
     */
    public function getResolvedUrlAttribute()
    {
        if ($this->article_id && $this->article) {
            $slug = $this->article->slug;
            if (! $slug || $slug === 'home' || $slug === 'home-page') {
                return '/';
            }

            return '/'.str_replace('_', '/', $slug);
        }

        return $this->url;
    }
}
