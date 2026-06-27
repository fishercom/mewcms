<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CmsTaxonomy;
use App\Models\CmsTaxonomyTerm;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TaxonomyTermController extends Controller
{
    public function index($taxonomyId, Request $request): Response
    {
        $taxonomy = CmsTaxonomy::findOrFail($taxonomyId);
        $s = $request->get('s');

        $items = CmsTaxonomyTerm::with('parent')
            ->where('taxonomy_id', $taxonomyId)
            ->where(function ($query) use ($s) {
                if (! empty($s)) {
                    $query->where('name', 'LIKE', '%'.str_replace(' ', '%', $s).'%');
                }
            })
            ->orderBy('position')
            ->paginate(15);

        return Inertia::render('admin/taxonomies/terms/index', [
            'taxonomy' => $taxonomy,
            'items' => $items,
        ]);
    }

    public function create($taxonomyId): Response
    {
        $taxonomy = CmsTaxonomy::findOrFail($taxonomyId);
        $parents = CmsTaxonomyTerm::where('taxonomy_id', $taxonomyId)
            ->where('active', true)
            ->orderBy('name')
            ->get();

        return Inertia::render('admin/taxonomies/terms/create', [
            'taxonomy' => $taxonomy,
            'parents' => $parents,
        ]);
    }

    public function store($taxonomyId, Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:cms_taxonomy_terms,slug,NULL,id,taxonomy_id,'.$taxonomyId,
            'description' => 'nullable|string',
            'parent_id' => 'nullable|exists:cms_taxonomy_terms,id',
            'active' => 'boolean',
        ]);

        $term = new CmsTaxonomyTerm($request->all());
        $term->taxonomy_id = $taxonomyId;
        $term->save();

        return redirect('admin/taxonomies/'.$taxonomyId.'/terms');
    }

    public function edit($id): Response
    {
        $item = CmsTaxonomyTerm::findOrFail($id);
        $taxonomy = CmsTaxonomy::findOrFail($item->taxonomy_id);
        $parents = CmsTaxonomyTerm::where('taxonomy_id', $item->taxonomy_id)
            ->where('id', '!=', $item->id)
            ->where('active', true)
            ->orderBy('name')
            ->get();

        return Inertia::render('admin/taxonomies/terms/edit', [
            'item' => $item,
            'taxonomy' => $taxonomy,
            'parents' => $parents,
        ]);
    }

    public function update($id, Request $request): RedirectResponse
    {
        $item = CmsTaxonomyTerm::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:cms_taxonomy_terms,slug,'.$id.',id,taxonomy_id,'.$item->taxonomy_id,
            'description' => 'nullable|string',
            'parent_id' => 'nullable|exists:cms_taxonomy_terms,id|different:id',
            'active' => 'boolean',
        ]);

        if (empty($request->slug)) {
            $item->slug = null;
        }

        $item->fill($request->except('slug'));
        if (! empty($request->slug)) {
            $item->slug = $request->slug;
        }
        $item->save();

        return redirect('admin/taxonomies/'.$item->taxonomy_id.'/terms');
    }

    public function destroy($id): RedirectResponse
    {
        $item = CmsTaxonomyTerm::findOrFail($id);
        $taxonomyId = $item->taxonomy_id;
        $item->delete();

        return redirect('admin/taxonomies/'.$taxonomyId.'/terms');
    }

    public function sort(Request $request)
    {
        $terms = $request->get('terms');
        foreach ($terms as $index => $term) {
            CmsTaxonomyTerm::where('id', $term['id'])->update(['position' => $index]);
        }

        return response()->json(['status' => 'success']);
    }
}
