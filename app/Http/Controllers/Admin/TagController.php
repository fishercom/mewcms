<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CmsTag;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TagController extends Controller
{
    public function index(Request $request): Response
    {
        $s = $request->get('s');

        $items = CmsTag::query()
            ->withCount(['articles', 'posts'])
            ->when($s, fn ($query) => $query->where('name', 'LIKE', '%'.str_replace(' ', '%', $s).'%'))
            ->orderBy('name')
            ->paginate(30)
            ->withQueryString();

        return Inertia::render('admin/tags/index', [
            'items' => $items,
            'filters' => $request->only('s'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate(['name' => 'required|string|max:255']);

        if (! CmsTag::findByName($data['name'])) {
            CmsTag::create(['name' => trim($data['name']), 'active' => true]);
        }

        return back();
    }

    public function update($id, Request $request): RedirectResponse
    {
        $tag = CmsTag::findOrFail($id);

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => ['nullable', 'string', 'max:255', 'alpha_dash', Rule::unique('cms_taxonomy_terms', 'slug')->where('taxonomy_id', $tag->taxonomy_id)->ignore($tag->id)],
            'active' => 'boolean',
        ]);

        $tag->fill([
            'name' => trim($data['name']),
            'active' => $data['active'] ?? $tag->active,
        ]);
        if (! empty($data['slug'])) {
            $tag->slug = $data['slug'];
        }
        $tag->save();

        return back();
    }

    public function destroy($id): RedirectResponse
    {
        CmsTag::findOrFail($id)->delete();

        return back();
    }

    /**
     * Create a tag from a page or post editor without leaving it. An existing tag with
     * the same name is returned (and reactivated) instead of duplicated.
     */
    public function quickStore(Request $request): JsonResponse
    {
        $data = $request->validate(['name' => 'required|string|max:255']);

        $tag = CmsTag::findByName($data['name']);
        $existing = $tag !== null;

        if ($tag && ! $tag->active) {
            $tag->update(['active' => true]);
        }
        $tag ??= CmsTag::create(['name' => trim($data['name']), 'active' => true]);

        return response()->json($tag->only(['id', 'name', 'slug']) + ['existing' => $existing], $existing ? 200 : 201);
    }
}
