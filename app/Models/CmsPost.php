<?php

namespace App\Models;

use App\Models\Concerns\FlushesFrontCache;
use App\Models\Concerns\HasPublishing;
use App\Models\Concerns\LogsAdminActivity;
use App\Support\ContentSanitizer;
use Cviebrock\EloquentSluggable\Sluggable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CmsPost extends Model
{
    use FlushesFrontCache;
    use HasPublishing;
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
