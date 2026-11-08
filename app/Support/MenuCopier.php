<?php

namespace App\Support;

use App\Models\CmsArticle;
use App\Models\CmsLang;
use App\Models\CmsMenu;
use App\Models\CmsMenuItem;
use Closure;

/**
 * Copies a menu into another language of its site: same slug and tree, and each link to a
 * page points at that page's version in the new language (with its title) when there is
 * one. Custom labels can be rewritten on the way ($label, e.g. translated by the AI).
 */
class MenuCopier
{
    /**
     * The menu's copy in $lang: made now, or the one there is already.
     *
     * @param  (Closure(list<string>): array<string, string>)|null  $translate  custom labels => translated labels
     */
    public static function copy(CmsMenu $menu, CmsLang $lang, ?Closure $translate = null): CmsMenu
    {
        $existing = CmsMenu::where('lang_id', $lang->id)->where('slug', $menu->slug)->first();
        if ($existing) {
            return $existing;
        }

        $items = $menu->items()->orderBy('parent_id')->orderBy('position')->with('article')->get();

        // Labels that are not a page title are the editor's own words: those get translated
        $custom = $items->filter(fn (CmsMenuItem $item): bool => ! $item->article || $item->title !== $item->article->title)
            ->pluck('title')->unique()->values()->all();
        $labels = $translate && $custom !== [] ? $translate($custom) : [];

        $copy = $menu->replicate();
        $copy->lang_id = $lang->id;
        $copy->slug = $menu->slug;
        $copy->save();

        $ids = [];
        foreach (self::parentsFirst($items) as $item) {
            $version = $item->article ? self::versionIn($item->article, $lang) : null;
            $usesPageTitle = $item->article && $item->title === $item->article->title;

            $new = $item->replicate(['menu_id', 'parent_id', 'article_id']);
            $new->forceFill([
                'menu_id' => $copy->id,
                'parent_id' => $item->parent_id ? ($ids[$item->parent_id] ?? null) : null,
                'article_id' => $version?->id ?? $item->article_id,
                'title' => $usesPageTitle && $version ? $version->title : ($labels[$item->title] ?? $item->title),
            ])->save();
            $ids[$item->id] = $new->id;
        }

        return $copy;
    }

    /**
     * The version of $page in $lang, if it has one.
     */
    public static function versionIn(CmsArticle $page, CmsLang $lang): ?CmsArticle
    {
        return Locales::forContent($page->lang_id)?->id === $lang->id ? $page : $page->translationIn($lang->id);
    }

    /**
     * @param  iterable<CmsMenuItem>  $items
     * @return list<CmsMenuItem>
     */
    protected static function parentsFirst(iterable $items): array
    {
        $byParent = collect($items)->groupBy(fn (CmsMenuItem $item): string => (string) $item->parent_id);
        $out = [];
        $walk = function (string $parent) use (&$walk, &$out, $byParent): void {
            foreach ($byParent->get($parent, collect()) as $item) {
                $out[] = $item;
                $walk((string) $item->id);
            }
        };
        $walk('');

        return $out;
    }
}
