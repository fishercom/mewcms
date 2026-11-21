<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CmsPostType;
use App\Models\CmsSchema;
use App\Support\ListingPages;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PostTypeController extends Controller
{
    public function index(Request $request): Response
    {
        $s = $request->get('s');

        $items = CmsPostType::with('default_schema')
            ->where(function ($query) use ($s): void {
                if (! empty($s)) {
                    $query->where('name', 'LIKE', '%'.str_replace(' ', '%', $s).'%')
                        ->orWhere('slug', 'LIKE', '%'.str_replace(' ', '%', $s).'%');
                }
            })
            ->paginate(15);

        return Inertia::render('admin/post-types/index', [
            'items' => $items,
            // The page that lists each type, found from the pages' content (and the blog's)
            'listings' => ListingPages::summary(['post', ...$items->getCollection()->pluck('slug')->all()]),
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
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'singular_name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:cms_post_types,slug',
            'icon' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'default_schema_id' => 'nullable|integer|exists:cms_schemas,id',
            'per_page' => 'nullable|integer|min:0|max:'.CmsPostType::MAX_PER_PAGE,
            'order' => ['nullable', Rule::in(CmsPostType::ORDERS)],
            'active' => 'boolean',
        ]);

        $cpt = new CmsPostType($this->withDefaults($data));
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

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'singular_name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:cms_post_types,slug,'.$id,
            'icon' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'default_schema_id' => 'nullable|integer|exists:cms_schemas,id',
            'per_page' => 'nullable|integer|min:0|max:'.CmsPostType::MAX_PER_PAGE,
            'order' => ['nullable', Rule::in(CmsPostType::ORDERS)],
            'active' => 'boolean',
        ]);

        $slug = $item->slug;
        $item->update($this->withDefaults($data));
        ListingPages::rename($slug, $item->slug);

        return redirect()->route('post-types.index');
    }

    public function destroy($id): RedirectResponse
    {
        $item = CmsPostType::findOrFail($id);
        $item->delete();
        ListingPages::forget($item->slug);

        return redirect()->route('post-types.index');
    }

    /**
     * The blog and the active post types, for the "Lista de posts" field of the editor.
     */
    public function apiList(): JsonResponse
    {
        $types = CmsPostType::where('active', true)->orderBy('name')->get(['slug', 'name'])
            ->map(fn (CmsPostType $type): array => ['slug' => $type->slug, 'name' => $type->name]);

        return response()->json([['slug' => 'post', 'name' => __('Entradas del blog')], ...$types]);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function withDefaults(array $data): array
    {
        return ['per_page' => $data['per_page'] ?? 6, 'order' => $data['order'] ?? 'newest'] + $data;
    }
}
