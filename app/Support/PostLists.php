<?php

namespace App\Support;

use App\Models\CmsPost;
use App\Models\CmsPostType;

/**
 * "Lista de posts" fields: a page template asks for the newest posts of a post type
 * (optionally with one tag) and the page gets them, ready to show, in its postLists prop.
 * The editor saves only what to list ({ post_type, tag, limit }); the posts are read when
 * the page is shown, so the list follows new and unpublished posts on its own.
 */
class PostLists
{
    public const TYPE = 'posts';

    /** Most posts a list shows */
    public const MAX = 50;

    /** Posts a list shows when the editor sets no number */
    public const DEFAULT_LIMIT = 6;

    /**
     * The posts of every "posts" field among the top-level fields of a field group.
     *
     * @param  list<array<string, mixed>>|null  $fields  field definitions of the schema
     * @param  array<string, mixed>|null  $values  the page's metadata
     * @return array<string, list<array<string, mixed>>> field key => posts
     */
    public static function resolve(?array $fields, ?array $values): array
    {
        $lists = [];
        foreach ($fields ?? [] as $field) {
            if (($field['type'] ?? null) !== self::TYPE || empty($field['key'])) {
                continue;
            }
            $lists[$field['key']] = self::posts((array) ($values[$field['key']] ?? []), $field);
        }

        return $lists;
    }

    /**
     * @param  array<string, mixed>  $value  { post_type, tag, limit } saved by the editor
     * @param  array<string, mixed>  $field  the field's definition, whose post_type is the default
     * @return list<array<string, mixed>>
     */
    public static function posts(array $value, array $field = []): array
    {
        $type = (string) ($value['post_type'] ?? $field['post_type'] ?? 'post') ?: 'post';
        $limit = (int) ($value['limit'] ?? $field['limit'] ?? self::DEFAULT_LIMIT);
        $limit = max(1, min(self::MAX, $limit ?: self::DEFAULT_LIMIT));
        $tag = trim((string) ($value['tag'] ?? ''));

        $query = CmsPost::with('tags')
            ->where('post_type', $type)
            ->published()
            ->tap(fn ($query) => Locales::scope($query));
        if ($tag !== '') {
            $query->whereHas('tags', fn ($q) => $q->where('slug', $tag));
        }

        $postType = $type === 'post' ? null : CmsPostType::where('slug', $type)->first();
        $postType ? $postType->sort($query) : $query->latest('published_at')->orderByDesc('id');

        return $query->limit($limit)->get()->map(fn (CmsPost $post): array => [
            'id' => $post->id,
            'title' => $post->title,
            'slug' => $post->slug,
            'url' => $post->url,
            'excerpt' => $post->excerpt,
            'featured_image' => $post->featured_image,
            'published_at' => $post->published_at?->toAtomString(),
            'metadata' => $post->metadata ?? [],
            'tags' => $post->tags->map(fn ($tag): array => ['name' => $tag->name, 'slug' => $tag->slug])->values()->all(),
        ])->all();
    }

    /**
     * Featured images of the listed posts, for the page's media lookup (srcsets).
     *
     * @param  array<string, list<array<string, mixed>>>  $lists
     * @return list<string>
     */
    public static function images(array $lists): array
    {
        return collect($lists)->flatten(1)->pluck('featured_image')->filter()->unique()->values()->all();
    }
}
