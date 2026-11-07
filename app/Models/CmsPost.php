<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSite;
use App\Models\Concerns\FlushesFrontCache;
use App\Models\Concerns\HasBlocks;
use App\Models\Concerns\HasPublishing;
use App\Models\Concerns\HasRevisions;
use App\Models\Concerns\HasTranslations;
use App\Models\Concerns\LogsAdminActivity;
use App\Support\ContentSanitizer;
use App\Support\Locales;
use Cviebrock\EloquentSluggable\Sluggable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CmsPost extends Model
{
    use BelongsToSite;
    use FlushesFrontCache;
    use HasBlocks;
    use HasPublishing;
    use HasRevisions;
    use HasTranslations;
    use LogsAdminActivity;
    use Sluggable;
    use SoftDeletes;

    protected $table = 'cms_posts';

    protected $fillable = [
        'user_id',
        'lang_id',
        'schema_id',
        'post_type',
        'title',
        'slug',
        'content',
        'excerpt',
        'featured_image',
        'metadata',
        'status',
        'published_at',
        'active',
    ];

    protected $casts = [
        'metadata' => 'array',
        'published_at' => 'datetime',
        'active' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::saving(function (self $model): void {
            if ($model->isDirty('content')) {
                $model->content = ContentSanitizer::html($model->content);
            }
            if ($model->isDirty('metadata')) {
                $model->metadata = ContentSanitizer::metadata($model->metadata);
            }
        });
    }

    public function sluggable(): array
    {
        return [
            'slug' => [
                'source' => 'title',
                // Slugs are unique across trashed posts too (see the unique index)
                'includeTrashed' => true,
            ],
        ];
    }

    /**
     * Slugs are unique per language: a post and its translation may share one.
     */
    public function scopeWithUniqueSlugConstraints(Builder $query, Model $model, string $attribute, array $config, string $slug): Builder
    {
        return $query->where('lang_id', $model->lang_id);
    }

    /**
     * Public address of the post, with its language prefix ("/en/blog/hello").
     */
    public function getUrlAttribute(): string
    {
        return Locales::url($this->path(), $this->lang_id);
    }

    /**
     * Address of the post without its language prefix: "/blog/hello", or "/recipes/hello"
     * for a custom post type.
     */
    public function path(): string
    {
        return ($this->post_type && $this->post_type !== 'post' ? '/'.$this->post_type : '/blog').'/'.$this->slug;
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function lang()
    {
        return $this->belongsTo(CmsLang::class, 'lang_id');
    }

    public function schema()
    {
        return $this->belongsTo(CmsSchema::class, 'schema_id');
    }

    public function tags()
    {
        return $this->belongsToMany(CmsTag::class, 'cms_post_term', 'post_id', 'term_id')->orderBy('name');
    }

    public function adminActivityModule(): string
    {
        return 'posts';
    }
}
