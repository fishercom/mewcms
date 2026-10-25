<?php

namespace App\Models;

use App\Models\Concerns\LogsAdminActivity;
use App\Support\ContentSanitizer;
use Cviebrock\EloquentSluggable\Sluggable;
use Illuminate\Database\Eloquent\Model;

class CmsPost extends Model
{
    use LogsAdminActivity;
    use Sluggable;

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
            ],
        ];
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

    public function terms()
    {
        return $this->belongsToMany(CmsTaxonomyTerm::class, 'cms_post_term', 'post_id', 'term_id');
    }

    public function adminActivityModule(): string
    {
        return 'posts';
    }
}
