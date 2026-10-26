<?php

namespace App\Http\Controllers\Admin;

use App\Blocks\BlockRegistry;
use App\Http\Controllers\Controller;
use App\Models\CmsBlockPattern;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Bloques reutilizables": the patterns editors insert into pages and posts.
 */
class BlockPatternController extends Controller
{
    public function index(Request $request): Response
    {
        $s = (string) $request->get('s');

        $items = CmsBlockPattern::when($s !== '', fn ($query) => $query->where(fn ($q) => $q
            ->where('name', 'LIKE', '%'.str_replace(' ', '%', $s).'%')
            ->orWhere('key', 'LIKE', '%'.str_replace(' ', '%', $s).'%')))
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/block-patterns/index', [
            'items' => $items,
            'categories' => CmsBlockPattern::CATEGORIES,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/block-patterns/create', $this->formProps());
    }

    public function store(Request $request): RedirectResponse
    {
        CmsBlockPattern::create($this->validated($request));

        return redirect()->route('block-patterns.index');
    }

    public function edit(string $id): Response
    {
        return Inertia::render('admin/block-patterns/edit', [
            'item' => CmsBlockPattern::findOrFail($id),
            ...$this->formProps(),
        ]);
    }

    public function update(string $id, Request $request): RedirectResponse
    {
        CmsBlockPattern::findOrFail($id)->update($this->validated($request, $id));

        return redirect()->route('block-patterns.index');
    }

    public function destroy(string $id): RedirectResponse
    {
        CmsBlockPattern::findOrFail($id)->delete();

        return redirect()->route('block-patterns.index');
    }

    /**
     * Save blocks the editor sends as a new pattern, without leaving the page.
     */
    public function quickStore(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'nullable|string|max:60',
            'synced' => 'boolean',
            'blocks' => 'required|array|max:'.BlockRegistry::MAX_BLOCKS,
            'blocks.*' => 'array',
        ]);

        $pattern = CmsBlockPattern::create([
            ...$data,
            'key' => $this->uniqueKey($data['name']),
            'category' => $data['category'] ?? 'general',
        ]);

        return response()->json([
            'pattern' => [
                'id' => $pattern->id,
                'name' => $pattern->name,
                'key' => $pattern->key,
                'description' => (string) $pattern->description,
                'category' => $pattern->category,
                'synced' => $pattern->synced,
                'blocks' => $pattern->blocks ?? [],
            ],
        ], 201);
    }

    /**
     * @return array<string, mixed>
     */
    protected function formProps(): array
    {
        return [
            'blockTypes' => BlockRegistry::definitions(),
            'categories' => CmsBlockPattern::CATEGORIES,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function validated(Request $request, ?string $id = null): array
    {
        return $request->validate([
            'name' => 'required|string|max:255',
            'key' => 'required|string|max:100|regex:/^[a-z0-9-]+$/|unique:cms_block_patterns,key'.($id ? ','.$id : ''),
            'description' => 'nullable|string|max:500',
            'category' => 'required|string|in:'.implode(',', array_keys(CmsBlockPattern::CATEGORIES)),
            'synced' => 'boolean',
            'active' => 'boolean',
            'blocks' => 'nullable|array|max:'.BlockRegistry::MAX_BLOCKS,
            'blocks.*' => 'array',
        ]);
    }

    protected function uniqueKey(string $name): string
    {
        $base = Str::slug(Str::limit($name, 80, '')) ?: 'bloque';
        $key = $base;
        for ($i = 2; CmsBlockPattern::where('key', $key)->exists(); $i++) {
            $key = $base.'-'.$i;
        }

        return $key;
    }
}
