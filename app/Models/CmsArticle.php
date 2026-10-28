<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSite;
use App\Models\Concerns\FlushesFrontCache;
use App\Models\Concerns\HasBlocks;
use App\Models\Concerns\HasPublishing;
use App\Models\Concerns\HasRevisions;
use App\Models\Concerns\LogsAdminActivity;
use App\Support\ContentSanitizer;
use App\Support\PageMenus;
use Cviebrock\EloquentSluggable\Sluggable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Rutorika\Sortable\SortableTrait;

class CmsArticle extends Model
{
    use BelongsToSite;
    use FlushesFrontCache;
    use HasBlocks;
    use HasPublishing;
    use HasRevisions;
    use LogsAdminActivity;

    /**
     * The database table used by the model.
     *
     * @var string
     */
    use Sluggable;

    use SoftDeletes;
    use SortableTrait;

    protected $table = 'cms_articles';

    protected $appends = ['url'];

    protected $fillable = ['schema_id', 'parent_id', 'lang_id', 'title', 'content', 'excerpt', 'featured_image', 'status', 'published_at', 'metadata', 'slug', 'active'];

    protected static $sortableField = 'position';

    protected static $sortableGroupField = 'parent_id';

    protected $casts = [
        'metadata' => 'array',
    ];

    public $front_view;

    public $route_view;

    protected static function booted(): void
    {
        static::saving(function (self $model): void {
            // Pages have always treated an empty status as published
            if (blank($model->status)) {
                $model->status = self::STATUS_PUBLISHED;
            }
            if ($model->isDirty('content')) {
                $model->content = ContentSanitizer::html($model->content);
            }
            if ($model->isDirty('metadata')) {
                $model->metadata = ContentSanitizer::metadata($model->metadata);
            }

            // The slug is one path segment, unique among its siblings; the uri is the full path
            if ($model->isDirty(['slug', 'parent_id', 'lang_id']) || blank($model->uri)) {
                $model->inOwnSite(function () use ($model): void {
                    $model->slug = $model->uniqueSiblingSlug(Str::slug(Str::afterLast((string) $model->slug, '/')) ?: Str::slug((string) $model->title) ?: 'pagina');
                    $parentUri = $model->parent_id ? self::withTrashed()->whereKey($model->parent_id)->value('uri') : null;
                    $model->uri = ltrim($parentUri.'/'.$model->slug, '/');
                });
            }
        });

        // Before the row goes: the menu item foreign key would only blank its link
        static::forceDeleting(fn (self $model) => PageMenus::removeItems(CmsMenuItem::where('article_id', $model->id)->get()));

        static::saved(fn (self $model) => $model->inOwnSite(function () use ($model): void {
            $old = $model->getOriginal('uri');
            if ($model->wasChanged('uri') && filled($old)) {
                $model->moveDescendants($old, $model->uri);
            }

            // A live page wins over any redirect from its address
            CmsRedirect::where('from_path', '/'.$model->uri)->delete();
        }));
    }

    /**
     * Rewrite the uri of every page below $old to sit below $new, in one query, and
     * redirect each old address to its new one.
     */
    protected function moveDescendants(string $old, string $new): void
    {
        $below = self::withTrashed()
            ->where('lang_id', $this->lang_id)
            ->where('uri', 'like', $old.'/%')
            ->pluck('uri');

        if ($below->isNotEmpty()) {
            $connection = DB::connection($this->getConnectionName());
            $prefix = $connection->getPdo()->quote($new);
            // Keep everything after the old prefix: "/child/..." (substr is 1-based)
            $offset = strlen($old) + 1;
            $expression = $connection->getDriverName() === 'sqlite'
                ? "{$prefix} || substr(uri, {$offset})"
                : "CONCAT({$prefix}, SUBSTRING(uri, {$offset}))";

            self::withTrashed()
                ->where('lang_id', $this->lang_id)
                ->where('uri', 'like', $old.'/%')
                ->update(['uri' => DB::raw($expression)]);
        }

        CmsRedirect::record('/'.$old, '/'.$new);
        foreach ($below as $uri) {
            CmsRedirect::record('/'.$uri, '/'.$new.substr($uri, strlen($old)));
        }
    }

    /**
     * $slug, or $slug-2, -3... when a sibling (trashed ones included) already uses it.
     */
    protected function uniqueSiblingSlug(string $slug): string
    {
        $taken = self::withTrashed()
            ->where('lang_id', $this->lang_id)
            ->where(fn ($query) => $this->parent_id ? $query->where('parent_id', $this->parent_id) : $query->whereNull('parent_id'))
            ->when($this->exists, fn ($query) => $query->whereKeyNot($this->getKey()))
            ->where(fn ($query) => $query->where('slug', $slug)->orWhere('slug', 'like', $slug.'-%'))
            ->pluck('slug')
            ->all();

        $candidate = $slug;
        $n = 2;
        while (in_array($candidate, $taken, true)) {
            $candidate = $slug.'-'.$n++;
        }

        return $candidate;
    }

    /**
     * Slugs only need to be unique among siblings (the uri adds the parent path).
     */
    public function scopeWithUniqueSlugConstraints(Builder $query, Model $model, string $attribute, array $config, string $slug): Builder
    {
        return $query->where('lang_id', $model->lang_id)
            ->where(fn (Builder $query) => $model->parent_id ? $query->where('parent_id', $model->parent_id) : $query->whereNull('parent_id'));
    }

    /**
     * Public URL of the page.
     */
    public function getUrlAttribute(): string
    {
        return in_array($this->uri, [null, 'home', 'home-page'], true) ? '/' : '/'.$this->uri;
    }

    public function sluggable(): array
    {
        return [
            'slug' => [
                'source' => 'title',
                // Trashed pages keep their slug so they can be restored without clashes
                'includeTrashed' => true,
            ],
        ];
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

    public function tags()
    {
        return $this->belongsToMany(CmsTag::class, 'cms_article_term', 'article_id', 'term_id')->orderBy('name');
    }

    /**
     * Ids of every page below this one, found by uri prefix in a single query.
     */
    public function getAllDescendantIds(): array
    {
        if (blank($this->uri)) {
            return [];
        }

        return self::where('lang_id', $this->lang_id)
            ->where('uri', 'like', $this->uri.'/%')
            ->pluck('id')
            ->all();
    }

    /**
     * Scope a query to apply search and status filters.
     */
    public function scopeFilter($query, array $filters): void
    {
        $query->when($filters['search'] ?? null, function ($query, $search): void {
            $query->where(function ($q) use ($search): void {
                $q->where('title', 'like', '%'.$search.'%')
                    ->orWhere('slug', 'like', '%'.$search.'%');
            });
        });

        $query->when($filters['status'] ?? null, function ($query, $status): void {
            if ($status === 'published') {
                $query->where('active', '1');
            } elseif ($status === 'draft') {
                $query->where('active', '0');
            }
        });

        $query->when($filters['schema_id'] ?? null, function ($query, $schemaId): void {
            $query->where('schema_id', $schemaId);
        });
    }

    public function adminActivityModule(): string
    {
        return 'articles';
    }
}
