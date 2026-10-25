<?php

namespace App\Models;

use App\Models\Concerns\FlushesFrontCache;
use App\Models\Concerns\LogsAdminActivity;
use Illuminate\Database\Eloquent\Model;

class CmsMenuItem extends Model
{
    use FlushesFrontCache;
    use LogsAdminActivity;

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
        return $this->belongsTo(CmsMenu::class, 'menu_id');
    }

    public function parent()
    {
        return $this->belongsTo(CmsMenuItem::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(CmsMenuItem::class, 'parent_id')->orderBy('position');
    }

    public function article()
    {
        return $this->belongsTo(CmsArticle::class, 'article_id');
    }

    /**
     * Resolve the dynamic URL, checking if it points to a CMS article.
     */
    public function getResolvedUrlAttribute()
    {
        if ($this->article_id && $this->article) {
            return $this->article->url;
        }

        return $this->url;
    }

    public function adminActivityModule(): string
    {
        return 'menus';
    }
}
