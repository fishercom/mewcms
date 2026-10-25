<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\BulkContentActions;
use App\Http\Controllers\Controller;
use App\Models\CmsArticle;
use App\Models\CmsLang;
use App\Models\CmsSchema;
use App\Models\CmsTag;
use App\Support\FrontCache;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ArticleController extends Controller
{
    use BulkContentActions;

    protected $lang_id;

    protected $parent_id;

    public function __construct(Request $request)
    {
        $this->lang_id = $request->get('lang_id');
        $this->parent_id = $request->get('parent_id');
        if (! $this->lang_id) {
            $lang = CmsLang::select()
                ->where('active', true)
                ->orderBy('name', 'desc')
                ->first();
            if ($lang) {
                $this->lang_id = $lang->id;
            }
        }

        Inertia::share('lang_id', $this->lang_id);
        Inertia::share('parent_id', $this->parent_id);
    }

    /**
     * Show the user's profile settings page.
     */
    public function index(Request $request): Response
    {
        $lang_id = $this->lang_id;
        $s = $request->get('s');
        $trash = $request->boolean('trash');

        $query = ($trash ? CmsArticle::onlyTrashed() : CmsArticle::query())
            ->with(['schema', 'parent' => fn ($query) => $query->withTrashed()])
            ->where('lang_id', $lang_id);

        if (! empty($s)) {
            $query->where('title', 'LIKE', '%'.str_replace(' ', '%', $s).'%');
        }

        $allArticles = $trash ? $query->latest('deleted_at')->get() : $query->orderBy('position')->get();

        // The trash is a flat list: parents may not be in it
        if (empty($s) && ! $trash) {
            $sortedArticles = [];
            $this->buildTree($allArticles, null, $sortedArticles);
            $items = collect($sortedArticles);
        } else {
            $items = $allArticles;
        }

        $currentPage = LengthAwarePaginator::resolveCurrentPage();
        $perPage = 15;
        $currentItems = $items->slice(($currentPage - 1) * $perPage, $perPage)->values();
        $paginated = new LengthAwarePaginator(
            $currentItems,
            $items->count(),
            $perPage,
            $currentPage,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        return Inertia::render('admin/articles/index', [
            'items' => $items->values(),
            'paging' => $paginated,
            'filters' => $request->only(['s', 'status', 'schema_id', 'trash']),
            'trashCount' => CmsArticle::onlyTrashed()->where('lang_id', $lang_id)->count(),
        ]);
    }

    public function create(Request $request)
    {
        $schemas = CmsSchema::where('active', 1)->get()->map(function ($s) {
            $s->unique = $s->isUnique();

            return $s;
        })->filter(function ($schema): bool {
            if ($schema->unique) {
                return ! CmsArticle::where('schema_id', $schema->id)->exists();
            }

            return true;
        })->values();

        $schemaId = $request->get('schema_id');
        $schema = $schemaId ? CmsSchema::find($schemaId) : null;

        $args = [
            'id' => null,
            'lang_id' => $this->lang_id,
            'parent_id' => null,
            'schema_id' => $schemaId,
            'title' => '',
            'content' => '',
            'excerpt' => '',
            'featured_image' => '',
            'status' => 'published',
            'published_at' => null,
            'metadata' => new \stdClass,
            'slug' => '',
            'active' => true,
        ];

        $parents = CmsArticle::where('lang_id', $this->lang_id)
            ->where('active', 1)
            ->get()
            ->filter(fn ($article): bool => ! $article->schema?->isUnique())
            ->values();

        return Inertia::render('admin/articles/create', [
            'item' => $args,
            'schema' => $schema,
            'schemas' => $schemas,
            'parents' => $parents,
            'tags' => CmsTag::options(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validatedData($request);

        $schemaId = $request->input('schema_id');
        $schema = $schemaId ? CmsSchema::find($schemaId) : null;
        $parentId = $request->input('parent_id');

        if ($schema && $schema->isUnique()) {
            if (CmsArticle::where('schema_id', $schema->id)->exists()) {
                return back()->withErrors(['schema_id' => 'Esta plantilla es única y ya está asignada a otra página.']);
            }
            if ($parentId !== null) {
                return back()->withErrors(['parent_id' => 'Una plantilla única no puede tener una página superior.']);
            }
        }

        if ($parentId !== null) {
            $parent = CmsArticle::find($parentId);
            if ($parent && $parent->schema && $parent->schema->isUnique()) {
                return back()->withErrors(['parent_id' => 'No se pueden crear subpáginas bajo una plantilla única.']);
            }
        }

        $profile = new CmsArticle(Arr::except($data, 'tag_ids'));
        $profile->save();

        $profile->tags()->sync($data['tag_ids'] ?? []);

        // Tag counts change with the pivot sync, which fires no model events
        FrontCache::flush();

        $profile->recordSave($request->user()?->id);

        $args = [
            'lang_id' => $this->lang_id,
            'parent_id' => null,
        ];

        return redirect()->route('articles.index', $args);
    }

    /**
     * Show the user's profile settings page.
     */
    public function edit($id, Request $request): Response
    {
        $item = CmsArticle::with(['schema', 'tags'])->findOrFail($id);
        $descendantIds = $item->getAllDescendantIds();

        $schemas = CmsSchema::where('active', 1)->get()->map(function ($s) {
            $s->unique = $s->isUnique();

            return $s;
        })->filter(function ($schema) use ($id): bool {
            if ($schema->unique) {
                return ! CmsArticle::where('schema_id', $schema->id)
                    ->where('id', '!=', $id)
                    ->exists();
            }

            return true;
        })->values();

        $parents = CmsArticle::where('lang_id', $this->lang_id)
            ->where('id', '!=', $id)
            ->where('active', 1)
            ->get()
            ->filter(function ($article) use ($descendantIds): bool {
                if (in_array($article->id, $descendantIds)) {
                    return false;
                }

                return ! $article->schema?->isUnique();
            })
            ->values();

        return Inertia::render('admin/articles/edit', [
            'item' => $item,
            'schema' => $item?->schema,
            'schemas' => $schemas,
            'parents' => $parents,
            'tags' => CmsTag::options(),
            'autosave' => $item->pendingAutosave($request->user()->id),
        ]);
    }

    /**
     * Update the user's profile settings.
     */
    public function update($id, Request $request): RedirectResponse
    {
        $data = $this->validatedData($request);

        $schemaId = $request->input('schema_id');
        $schema = $schemaId ? CmsSchema::find($schemaId) : null;
        $parentId = $request->input('parent_id');
        $item = CmsArticle::findOrFail($id);

        if ($schema && $schema->isUnique()) {
            if (CmsArticle::where('schema_id', $schema->id)->where('id', '!=', $id)->exists()) {
                return back()->withErrors(['schema_id' => 'Esta plantilla es única y ya está asignada a otra página.']);
            }
            if ($parentId !== null) {
                return back()->withErrors(['parent_id' => 'Una plantilla única no puede tener una página superior.']);
            }
        }

        if ($parentId !== null) {
            $parent = CmsArticle::find($parentId);
            if ($parent && $parent->schema && $parent->schema->isUnique()) {
                return back()->withErrors(['parent_id' => 'No se pueden crear subpáginas bajo una plantilla única.']);
            }
            if ($parentId == $id) {
                return back()->withErrors(['parent_id' => 'Una página no puede ser su propio padre.']);
            }
            $descendantIds = $item->getAllDescendantIds();
            if (in_array($parentId, $descendantIds)) {
                return back()->withErrors(['parent_id' => 'No se puede seleccionar una subpágina como página superior.']);
            }
        }

        $item->fill(Arr::except($data, 'tag_ids'));
        $item->save();

        $item->tags()->sync($data['tag_ids'] ?? []);

        // Tag counts change with the pivot sync, which fires no model events
        FrontCache::flush();

        $item->recordSave($request->user()?->id);

        $args = [
            'lang_id' => $this->lang_id,
            'parent_id' => null,
        ];

        return redirect()->route('articles.index', $args);
    }

    /**
     * Move the page to the trash.
     */
    public function destroy($id, Request $request): RedirectResponse
    {
        $item = CmsArticle::findOrFail($id);
        $this->guardBulkAction('trash', $item->newCollection([$item]));
        $item->delete();

        return redirect('admin/articles');
    }

    /**
     * Apply a bulk action (publish, draft, trash, restore, force_delete) to the selected pages.
     */
    public function bulk(Request $request): RedirectResponse
    {
        $this->applyBulkAction($request, CmsArticle::class, 'articles');

        return back();
    }

    /**
     * Keep the page tree consistent: a page goes to the trash only with its subpages,
     * and comes back only after its parent.
     *
     * @param  Collection<int, CmsArticle>  $items
     */
    protected function guardBulkAction(string $action, Collection $items): void
    {
        $ids = $items->modelKeys();

        if ($action === 'trash') {
            $blocked = $items->filter(fn (CmsArticle $item): bool => CmsArticle::where('parent_id', $item->id)->whereKeyNot($ids)->exists());
            if ($blocked->isNotEmpty()) {
                throw ValidationException::withMessages([
                    'ids' => 'No se puede mover a la papelera una página con subpáginas: '.$blocked->pluck('title')->implode(', ').'. Mueve o elimina primero sus subpáginas, o selecciónalas también.',
                ]);
            }
        }

        if ($action === 'restore') {
            $blocked = $items->filter(fn (CmsArticle $item): bool => $item->parent_id
                && ! in_array($item->parent_id, $ids)
                && CmsArticle::onlyTrashed()->whereKey($item->parent_id)->exists());
            if ($blocked->isNotEmpty()) {
                throw ValidationException::withMessages([
                    'ids' => 'Restaura primero la página superior de: '.$blocked->pluck('title')->implode(', ').'.',
                ]);
            }

            $taken = $items->filter(fn (CmsArticle $item): bool => $item->schema?->isUnique()
                && CmsArticle::where('schema_id', $item->schema_id)->exists());
            if ($taken->isNotEmpty()) {
                throw ValidationException::withMessages([
                    'ids' => 'La plantilla única ya está asignada a otra página: '.$taken->pluck('title')->implode(', ').'.',
                ]);
            }
        }
    }

    public function sort(Request $request)
    {
        $articles = $request->get('articles');
        foreach ($articles as $index => $article) {
            CmsArticle::where('id', $article['id'])->update(['position' => $index]);
        }
        FrontCache::flush();

        return response()->json(['status' => 'success']);
    }

    /**
     * @return array<string, mixed>
     */
    protected function validatedData(Request $request): array
    {
        return $request->validate([
            'title' => 'required|string|max:255',
            'schema_id' => 'nullable|integer|exists:cms_schemas,id',
            'parent_id' => 'nullable|integer|exists:cms_articles,id',
            'lang_id' => 'nullable|integer|exists:cms_langs,id',
            'content' => 'nullable|string',
            'excerpt' => 'nullable|string',
            'featured_image' => 'nullable|string|max:2048',
            'status' => 'nullable|string|in:draft,published',
            'published_at' => 'nullable|date',
            'metadata' => 'nullable|array',
            'slug' => 'nullable|string|max:500',
            'active' => 'nullable|boolean',
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => ['integer', CmsTag::existsRule()],
        ]);
    }

    protected function buildTree($elements, $parentId, &$sorted, $depth = 0)
    {
        $children = $elements->where('parent_id', $parentId)->sortBy('position');
        foreach ($children as $child) {
            $child->depth = $depth;
            $sorted[] = $child;
            $this->buildTree($elements, $child->id, $sorted, $depth + 1);
        }
    }
}
