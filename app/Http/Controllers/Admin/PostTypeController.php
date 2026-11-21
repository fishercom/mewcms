<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CmsArticle;
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
            // The blog has no post type of its own: its listing page is chosen here
            'pages' => ListingPages::options(),
            'blogListingPageId' => ListingPages::id('post'),
        ]);
    }

    public function create(): Response
    {
        $schemas = CmsSchema::where('active', 1)->get(['id', 'name']);

        return Inertia::render('admin/post-types/create', [
            'schemas' => $schemas,
            'pages' => ListingPages::options(),
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
            'listing_page_id' => $this->listingPageRule(),
        ]);

        $listingPageId = $data['listing_page_id'] ?? null;
        unset($data['listing_page_id']);
        $cpt = new CmsPostType($this->withDefaults($data));
        $cpt->save();
        ListingPages::set($cpt->slug, $listingPageId);

        return redirect()->route('post-types.index');
    }

    public function edit($id): Response
    {
        $item = CmsPostType::findOrFail($id);
        $schemas = CmsSchema::where('active', 1)->get(['id', 'name']);

        return Inertia::render('admin/post-types/edit', [
            'item' => $item,
            'schemas' => $schemas,
            'pages' => ListingPages::options(),
            'listingPageId' => ListingPages::id($item->slug),
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
            'listing_page_id' => $this->listingPageRule(),
        ]);

        $listingPageId = $data['listing_page_id'] ?? null;
        unset($data['listing_page_id']);
        $slug = $item->slug;
        $item->update($this->withDefaults($data));
        ListingPages::rename($slug, $item->slug);
        ListingPages::set($item->slug, $listingPageId);

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
     * Save the page that lists the blog's entries on the current site.
     */
    public function blogListing(Request $request): RedirectResponse
    {
        $data = $request->validate(['listing_page_id' => $this->listingPageRule()]);
        ListingPages::set('post', $data['listing_page_id'] ?? null);

        return redirect()->route('post-types.index')->with('success', __('Página del blog guardada.'));
    }

    /**
     * A page of the current site, or none.
     *
     * @return list<mixed>
     */
    private function listingPageRule(): array
    {
        return ['nullable', 'integer', function (string $attribute, mixed $value, \Closure $fail): void {
            if (! CmsArticle::whereKey($value)->exists()) {
                $fail(__('Elige una página de este sitio.'));
            }
        }];
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
