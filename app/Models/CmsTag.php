<?php

namespace App\Models;

use App\Models\Concerns\FlushesFrontCache;
use App\Models\Concerns\LogsAdminActivity;
use Cviebrock\EloquentSluggable\Sluggable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;

/**
 * A flat tag ("Etiqueta") for pages and posts. Tags are stored as the terms of the
 * "etiquetas" taxonomy, which is the only taxonomy left.
 */
class CmsTag extends Model
{
    use FlushesFrontCache;
    use LogsAdminActivity;
    use Sluggable;

    public const TAXONOMY_SLUG = 'etiquetas';

    protected $table = 'cms_taxonomy_terms';

    protected $fillable = ['name', 'slug', 'active'];

    protected $hidden = ['taxonomy_id', 'parent_id', 'position', 'pivot'];

    protected $casts = [
        'active' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::addGlobalScope('tags', fn (Builder $query) => $query->where(
            'cms_taxonomy_terms.taxonomy_id',
            fn ($sub) => $sub->select('id')->from('cms_taxonomies')->where('slug', self::TAXONOMY_SLUG)->limit(1),
        ));

        static::creating(function (self $tag): void {
            $tag->taxonomy_id = self::taxonomyId();
        });
    }

    /**
     * Id of the "etiquetas" taxonomy, created on first use.
     */
    public static function taxonomyId(): int
    {
        return DB::table('cms_taxonomies')->where('slug', self::TAXONOMY_SLUG)->value('id')
            ?? DB::table('cms_taxonomies')->insertGetId([
                'name' => 'Etiquetas',
                'slug' => self::TAXONOMY_SLUG,
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
    }

    /**
     * Active tags for the editors' tag picker.
     *
     * @return Collection<int, self>
     */
    public static function options(): Collection
    {
        return self::where('active', true)->orderBy('name')->get(['id', 'name', 'slug']);
    }

    /**
     * Validation rule for an id that must be a tag.
     */
    public static function existsRule(): Exists
    {
        return Rule::exists('cms_taxonomy_terms', 'id')->where('taxonomy_id', self::taxonomyId());
    }

    public function sluggable(): array
    {
        return [
            'slug' => [
                'source' => 'name',
            ],
        ];
    }

    public function articles()
    {
        return $this->belongsToMany(CmsArticle::class, 'cms_article_term', 'term_id', 'article_id');
    }

    public function posts()
    {
        return $this->belongsToMany(CmsPost::class, 'cms_post_term', 'term_id', 'post_id');
    }

    /**
     * Add articles_count and posts_count of published content, plus their total as usage.
     */
    public function scopeWithPublishedCounts(Builder $query): Builder
    {
        return $query->withCount([
            'articles' => fn ($query) => $query->published(),
            'posts' => fn ($query) => $query->published(),
        ]);
    }

    /**
     * Find a tag by name, ignoring case and surrounding spaces.
     */
    public static function findByName(string $name): ?self
    {
        return self::whereRaw('LOWER(name) = ?', [mb_strtolower(trim($name))])->first();
    }

    public function getUrlAttribute(): string
    {
        return '/tag/'.$this->slug;
    }

    public function adminActivityModule(): string
    {
        return 'tags';
    }
}
