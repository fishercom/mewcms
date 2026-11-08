<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CmsArticle;
use App\Models\CmsMenu;
use App\Models\CmsMenuItem;
use App\Rules\SafeUrl;
use App\Support\FrontCache;
use App\Support\Locales;
use App\Support\MenuCopier;
use App\Support\Sites;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Inertia\Inertia;
use Inertia\Response;

class MenuController extends Controller
{
    public function index(Request $request): Response
    {
        $s = $request->get('s');

        $items = Locales::scope(CmsMenu::query())
            ->where(function ($query) use ($s): void {
                if (! empty($s)) {
                    $query->where('name', 'LIKE', '%'.str_replace(' ', '%', $s).'%');
                }
            })
            ->paginate(15);

        // The menus a language lacks: the main language's ones it can copy (see translate)
        $missing = Locales::isExtra()
            ? Locales::scope(CmsMenu::query(), Locales::main()?->id)->whereNotIn('slug', Locales::scope(CmsMenu::query())->pluck('slug'))->get(['id', 'name', 'slug'])
            : collect();

        return Inertia::render('admin/menus/index', [
            'items' => $items,
            'missing' => $missing,
            'language' => Locales::current()?->only(['id', 'name', 'iso']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/menus/create');
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => ['nullable', 'string', 'max:255', Sites::unique('cms_menus', 'slug')->where('lang_id', Locales::currentId())],
            'description' => 'nullable|string',
            'auto_add_pages' => 'boolean',
            'auto_add_subpages' => 'boolean',
            'active' => 'boolean',
        ]);

        $menu = new CmsMenu($data);
        $menu->lang_id = Locales::currentId();
        $menu->save();

        return redirect('admin/menus');
    }

    public function edit($id): Response
    {
        $item = CmsMenu::with(['items' => function ($q): void {
            $q->orderBy('position');
        }])->findOrFail($id);

        // Its links go to pages of its own language
        $articles = Locales::scope(CmsArticle::query(), Locales::forContent($item->lang_id)?->id)->where('active', true)
            ->orderBy('title')
            ->get(['id', 'title', 'slug']);

        return Inertia::render('admin/menus/edit', [
            'item' => $item,
            'articles' => $articles,
        ]);
    }

    public function update($id, Request $request): RedirectResponse
    {
        $item = CmsMenu::findOrFail($id);

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => ['nullable', 'string', 'max:255', Sites::unique('cms_menus', 'slug', $id)->where('lang_id', $item->lang_id)],
            'description' => 'nullable|string',
            'auto_add_pages' => 'boolean',
            'auto_add_subpages' => 'boolean',
            'active' => 'boolean',
        ]);

        if (empty($request->slug)) {
            $item->slug = null;
        }

        $item->fill(Arr::except($data, 'slug'));
        if (! empty($request->slug)) {
            $item->slug = $request->slug;
        }
        $item->save();

        return redirect('admin/menus');
    }

    /**
     * Copy a menu of the main language into the language being edited: same slug and tree,
     * page links pointing at each page's version in that language.
     */
    public function translate($id): RedirectResponse
    {
        $menu = CmsMenu::findOrFail($id);
        $lang = Locales::current();
        abort_unless($lang && Locales::isExtra($lang->id), 404);

        $copy = MenuCopier::copy($menu, $lang);
        FrontCache::flush();

        return redirect()->route('menus.edit', $copy->id)->with('success', __('Menú copiado a :lang.', ['lang' => $lang->name]));
    }

    public function destroy($id): RedirectResponse
    {
        $item = CmsMenu::findOrFail($id);
        $item->delete();

        return redirect('admin/menus');
    }

    /**
     * Store or update a menu item in the builder.
     */
    public function storeItems(Request $request, $menuId): RedirectResponse
    {
        $menu = CmsMenu::findOrFail($menuId);

        $data = $request->validate([
            'id' => 'nullable|integer',
            'parent_id' => 'nullable|integer|exists:cms_menu_items,id',
            'title' => 'required|string|max:255',
            'url' => ['nullable', 'string', 'max:255', new SafeUrl],
            'article_id' => 'nullable|integer|exists:cms_articles,id',
            'target' => 'string|in:_self,_blank',
            'active' => 'boolean',
        ]);

        if (! empty($data['id'])) {
            $menuItem = CmsMenuItem::where('menu_id', $menu->id)->findOrFail($data['id']);
            $menuItem->update($data);
        } else {
            $lastPos = CmsMenuItem::where('menu_id', $menu->id)->max('position') ?? 0;
            $data['menu_id'] = $menu->id;
            $data['position'] = $lastPos + 1;
            CmsMenuItem::create($data);
        }

        return redirect()->back();
    }

    /**
     * Sort the menu items list.
     */
    public function sortItems(Request $request, $menuId): JsonResponse
    {
        $menu = CmsMenu::findOrFail($menuId);
        $items = $request->input('items', []);

        foreach ($items as $index => $itemData) {
            CmsMenuItem::where('menu_id', $menu->id)
                ->where('id', $itemData['id'])
                ->update([
                    'position' => $index,
                    'parent_id' => $itemData['parent_id'] ?? null,
                ]);
        }
        FrontCache::flush();

        return response()->json(['message' => 'Items sorted successfully.']);
    }

    /**
     * Delete a single menu item in the builder.
     */
    public function destroyItem($itemId): RedirectResponse
    {
        $item = CmsMenuItem::findOrFail($itemId);
        $item->delete();

        return redirect()->back();
    }
}
