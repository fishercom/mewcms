<?php

namespace App\Support;

use App\Models\CmsArticle;
use App\Models\CmsMenu;
use App\Models\CmsMenuItem;
use Illuminate\Support\Collection;

/**
 * Which menus link to a page, and keeping those menu items in step with the page.
 */
class PageMenus
{
    /**
     * Active menus for the page editor, each with the pages it links to.
     *
     * @return Collection<int, array<string, mixed>>
     */
    public static function options(): Collection
    {
        return CmsMenu::where('active', true)->orderBy('id')->get()->map(fn (CmsMenu $menu): array => [
            'id' => $menu->id,
            'name' => $menu->name,
            'auto_add_pages' => (bool) $menu->auto_add_pages,
            'auto_add_subpages' => (bool) $menu->auto_add_subpages,
            'article_ids' => $menu->items()->whereNotNull('article_id')->pluck('article_id')->unique()->values()->all(),
        ]);
    }

    /**
     * Menus a new page joins by default: those that add new top-level pages, or, for a
     * subpage, those that add subpages and already contain its parent.
     *
     * @return list<int>
     */
    public static function defaultsFor(?int $parentId): array
    {
        return self::options()
            ->filter(fn (array $menu): bool => $parentId
                ? $menu['auto_add_subpages'] && in_array($parentId, $menu['article_ids'])
                : $menu['auto_add_pages'])
            ->pluck('id')
            ->values()
            ->all();
    }

    /**
     * @return list<int>
     */
    public static function membership(CmsArticle $page): array
    {
        return CmsMenuItem::where('article_id', $page->id)->distinct()->pluck('menu_id')->all();
    }

    /**
     * Make the page appear in exactly these menus: add an item where it is missing (at
     * the end, under the parent's item when the parent is in that menu) and remove it
     * from the others.
     *
     * @param  array<int, int|string>  $menuIds
     */
    public static function sync(CmsArticle $page, array $menuIds): void
    {
        $menuIds = array_map('intval', $menuIds);
        $current = self::membership($page);

        foreach (array_diff($menuIds, $current) as $menuId) {
            $parentItemId = $page->parent_id
                ? CmsMenuItem::where('menu_id', $menuId)->where('article_id', $page->parent_id)->value('id')
                : null;

            CmsMenuItem::create([
                'menu_id' => $menuId,
                'parent_id' => $parentItemId,
                'title' => $page->title,
                'article_id' => $page->id,
                'target' => '_self',
                'position' => (int) CmsMenuItem::where('menu_id', $menuId)->where('parent_id', $parentItemId)->max('position') + 1,
                'active' => true,
            ]);
        }

        foreach (array_diff($current, $menuIds) as $menuId) {
            self::removeItems(CmsMenuItem::where('menu_id', $menuId)->where('article_id', $page->id)->get());
        }
    }

    /**
     * Rename the page's menu items that still carry its old title (custom labels stay).
     */
    public static function followTitle(CmsArticle $page, string $oldTitle): void
    {
        CmsMenuItem::where('article_id', $page->id)->where('title', $oldTitle)->get()
            ->each(fn (CmsMenuItem $item) => $item->update(['title' => $page->title]));
    }

    /**
     * Remove items, moving their sub-items up a level instead of orphaning them.
     *
     * @param  iterable<CmsMenuItem>  $items
     */
    public static function removeItems(iterable $items): void
    {
        foreach ($items as $item) {
            CmsMenuItem::where('parent_id', $item->id)->update(['parent_id' => $item->parent_id]);
            $item->delete();
        }
    }
}
