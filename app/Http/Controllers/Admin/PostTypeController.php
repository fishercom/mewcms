<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CmsPostType;
use App\Models\CmsSchema;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PostTypeController extends Controller
{
    public function index(Request $request): Response
    {
        $s = $request->get('s');

        $items = CmsPostType::with('default_schema')
            ->where(function ($query) use ($s) {
                if (! empty($s)) {
                    $query->where('name', 'LIKE', '%'.str_replace(' ', '%', $s).'%')
                        ->orWhere('slug', 'LIKE', '%'.str_replace(' ', '%', $s).'%');
                }
            })
            ->paginate(15);

        return Inertia::render('admin/post-types/index', [
            'items' => $items,
        ]);
    }

    public function create(): Response
    {
        $schemas = CmsSchema::where('active', 1)->get(['id', 'name']);

        return Inertia::render('admin/post-types/create', [
            'schemas' => $schemas,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'singular_name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:cms_post_types,slug',
            'icon' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'default_schema_id' => 'nullable|integer|exists:cms_schemas,id',
            'active' => 'boolean',
        ]);

        $cpt = new CmsPostType($request->all());
        $cpt->save();

        return redirect()->route('post-types.index');
    }

    public function edit($id): Response
    {
        $item = CmsPostType::findOrFail($id);
        $schemas = CmsSchema::where('active', 1)->get(['id', 'name']);

        return Inertia::render('admin/post-types/edit', [
            'item' => $item,
            'schemas' => $schemas,
        ]);
    }

    public function update($id, Request $request): RedirectResponse
    {
        $item = CmsPostType::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'singular_name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:cms_post_types,slug,'.$id,
            'icon' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'default_schema_id' => 'nullable|integer|exists:cms_schemas,id',
            'active' => 'boolean',
        ]);

        $item->update($request->all());

        return redirect()->route('post-types.index');
    }

    public function destroy($id): RedirectResponse
    {
        $item = CmsPostType::findOrFail($id);
        $item->delete();

        return redirect()->route('post-types.index');
    }
}
