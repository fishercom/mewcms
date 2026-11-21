<?php

namespace App\Support;

use App\Blocks\BlockRegistry;
use App\Models\CmsArticle;
use App\Models\CmsConfig;
use App\Models\CmsPostType;
use Illuminate\Support\Facades\Cache;

/**
 * The page that lists each kind of entry ("post" for the blog, or a post type's slug): an
 * entry's page takes its banner, title and "back" link from it.
 *
 * Nothing to set up: a published page lists a kind of entry when one of its blocks, or a
 * field of its template, is a "Lista de posts" of that kind. When several pages list the
 * same kind (a catalogue and a home with four featured products), the one the editor marked
 * as main wins (saved per site as "listing_page_<type>"), else the one showing the most.
 */
class ListingPages
{
    public const PREFIX = 'listing_page_';

    public static function alias(string $type): string
    {
        return self::PREFIX.$type;
    }

    /** The page the editor marked as the main listing of $type on the current site */
    public static function chosen(string $type): ?int
    {
        $id = (int) CmsConfig::valueForSite(self::alias($type));

        return $id > 0 ? $id : null;
    }

    public static function choose(string $type, ?int $pageId): void
    {
        CmsConfig::saveForSite(self::alias($type), $pageId ? (string) $pageId : '', [
            'type' => 'string',
            'name' => 'Página del listado ('.$type.')',
        ]);
        FrontCache::flush();
    }

    /** A post type changed its slug: the choice follows it on every site */
    public static function rename(string $from, string $to): void
    {
        if ($from !== $to) {
            CmsConfig::where('alias', self::alias($from))->update(['alias' => self::alias($to)]);
            FrontCache::flush();
        }
    }

    public static function forget(string $type): void
    {
        CmsConfig::where('alias', self::alias($type))->delete();
    }

    /**
     * Every published page of the current site that lists entries, by kind of entry.
     *
     * @return array<string, list<array{id: int, lang_id: int|null, limit: int}>>
     */
    public static function map(): array
    {
        return Cache::remember(FrontCache::key('listings'), FrontCache::ttl(), function (): array {
            $map = [];
            $pages = CmsArticle::with('schema')->published()->orderBy('position')->orderBy('id')
                ->get(['id', 'lang_id', 'schema_id', 'blocks', 'metadata', 'position']);
            foreach ($pages as $page) {
                foreach (self::listedBy($page) as $type => $limit) {
                    $map[$type][] = ['id' => $page->id, 'lang_id' => $page->lang_id, 'limit' => $limit];
                }
            }

            return $map;
        });
    }

    /**
     * The kinds of entry a page lists, with how many it shows (the most of its lists).
     *
     * @return array<string, int>
     */
    public static function listedBy(CmsArticle $page): array
    {
        $found = [];
        $add = function (mixed $value, array $field) use (&$found): void {
            $value = is_array($value) ? $value : [];
            $type = (string) ($value['post_type'] ?? $field['post_type'] ?? 'post') ?: 'post';
            $limit = (int) ($value['limit'] ?? $field['limit'] ?? PostLists::DEFAULT_LIMIT);
            $found[$type] = max($found[$type] ?? 0, $limit);
        };

        // Fields of the page's template
        $metadata = is_array($page->metadata) ? $page->metadata : [];
        foreach ((array) ($page->schema?->fields ?? []) as $field) {
            if (is_array($field) && ($field['type'] ?? null) === PostLists::TYPE && ! empty($field['key'])) {
                $add($metadata[$field['key']] ?? null, $field);
            }
        }

        // Blocks, and the blocks inside columns
        $walk = function (mixed $blocks) use (&$walk, $add): void {
            foreach (is_array($blocks) ? $blocks : [] as $block) {
                if (! is_array($block) || ! is_string($block['type'] ?? null)) {
                    continue;
                }
                $data = is_array($block['data'] ?? null) ? $block['data'] : [];
                foreach (BlockRegistry::get($block['type'])?->fields() ?? [] as $field) {
                    if (($field['type'] ?? null) === PostLists::TYPE && ! empty($field['key'])) {
                        $add($data[$field['key']] ?? null, $field);
                    }
                }
                foreach ((array) ($data['columns'] ?? []) as $column) {
                    $walk(is_array($column) ? ($column['blocks'] ?? []) : []);
                }
            }
        };
        $walk($page->getAttribute('blocks'));

        return $found;
    }

    /**
     * The pages that list $type, in the language $langId when some are in it.
     *
     * @return list<array{id: int, lang_id: int|null, limit: int}>
     */
    public static function candidates(string $type, ?int $langId = null): array
    {
        $all = self::map()[$type] ?? [];
        $inLang = array_values(array_filter($all, fn (array $page): bool => $langId === null || $page['lang_id'] === $langId));

        return $inLang !== [] ? $inLang : $all;
    }

    /** The id of the listing page of $type: the one marked as main, else the one showing the most */
    public static function id(string $type, ?int $langId = null): ?int
    {
        $candidates = self::candidates($type, $langId);
        $chosen = self::chosen($type);

        if ($chosen && in_array($chosen, array_column($candidates, 'id'), true)) {
            return $chosen;
        }
        if ($candidates !== []) {
            // The most posts first; on a tie, the first page (pages come in their order)
            usort($candidates, fn (array $a, array $b): int => $b['limit'] <=> $a['limit']);

            return $candidates[0]['id'];
        }

        return null;
    }

    /**
     * The listing page of $type as the public pages use it, in the language $langId when
     * it has a published translation in it; null when no page lists that kind of entry.
     *
     * @return array{id: int, title: string, url: string, excerpt: string|null, featured_image: string|null}|null
     */
    public static function for(string $type, ?int $langId = null): ?array
    {
        $id = self::id($type, $langId);
        $page = $id ? CmsArticle::published()->find($id) : null;
        if (! $page) {
            return null;
        }

        if ($langId && $page->lang_id !== $langId && filled($page->translation_group)) {
            $page = CmsArticle::published()
                ->where('translation_group', $page->translation_group)
                ->where('lang_id', $langId)
                ->first() ?? $page;
        }

        return [
            'id' => $page->id,
            'title' => (string) $page->title,
            'url' => $page->url,
            'excerpt' => $page->excerpt,
            'featured_image' => $page->featured_image,
        ];
    }

    /** Name of a kind of entry for the admin */
    public static function name(string $type): string
    {
        return $type === 'post' ? __('Blog (Posts)') : (string) (CmsPostType::where('slug', $type)->value('name') ?? $type);
    }

    /**
     * For the page editor: the kinds of entry this page lists that other pages list too,
     * so the editor picks which one is the main listing. Empty for most pages.
     *
     * @return list<array{type: string, name: string, main: bool}>
     */
    public static function choicesFor(CmsArticle $page): array
    {
        if (! $page->exists || ! $page->isLive()) {
            return [];
        }

        $choices = [];
        foreach (array_keys(self::listedBy($page)) as $type) {
            if (count(self::candidates($type, $page->lang_id)) > 1) {
                $choices[] = ['type' => $type, 'name' => self::name($type), 'main' => self::id($type, $page->lang_id) === $page->id];
            }
        }

        return $choices;
    }

    /**
     * For Admin → Tipos de contenido: the page that lists each kind of entry.
     *
     * @param  list<string>  $types
     * @return array<string, array{id: int, title: string}|null>
     */
    public static function summary(array $types): array
    {
        $summary = [];
        foreach ($types as $type) {
            $id = self::id($type);
            $page = $id ? CmsArticle::find($id, ['id', 'title']) : null;
            $summary[$type] = $page ? ['id' => $page->id, 'title' => (string) $page->title] : null;
        }

        return $summary;
    }
}
