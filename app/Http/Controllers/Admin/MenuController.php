<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\CmsMenu;
use App\Models\CmsMenuItem;

class MenuController extends Controller
{
    public function index(Request $request): Response
    {
        $s = $request->get('s');

        $items = CmsMenu::select()
            ->where(function($query) use($s){
                if(!empty($s)){
                    $query->where('name', 'LIKE', '%'.str_replace(' ', '%', $s).'%');
                }
            })
            ->paginate(15);

        return Inertia::render('admin/menus/index', [
            'items' => $items,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/menus/create');
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:cms_menus,slug',
            'description' => 'nullable|string',
            'active' => 'boolean',
        ]);

        $menu = new CmsMenu($request->all());
        $menu->save();

        return redirect('admin/menus');
    }

    public function edit($id): Response
    {
        $item = CmsMenu::with(['items' => function($q) {
            $q->orderBy('position');
        }])->findOrFail($id);

        $articles = \App\Models\CmsArticle::where('active', true)
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

        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:cms_menus,slug,' . $id,
            'description' => 'nullable|string',
            'active' => 'boolean',
        ]);

        if (empty($request->slug)) {
            $item->slug = null;
        }

        $item->fill($request->except('slug'));
        if (!empty($request->slug)) {
            $item->slug = $request->slug;
        }
        $item->save();

        return redirect('admin/menus');
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
            'url' => 'nullable|string|max:255',
            'article_id' => 'nullable|integer|exists:cms_articles,id',
            'target' => 'string|in:_self,_blank',
            'active' => 'boolean',
        ]);

        if (!empty($data['id'])) {
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
                    'parent_id' => $itemData['parent_id'] ?? null
                ]);
        }

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
