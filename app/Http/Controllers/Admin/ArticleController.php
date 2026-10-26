<?php

namespace App\Http\Controllers\Admin;

use App\Blocks\BlockRegistry;
use App\Http\Controllers\Admin\Concerns\BulkContentActions;
use App\Http\Controllers\Controller;
use App\Models\CmsBlockPattern;
use App\Models\AdmAction;
use App\Models\CmsArticle;
use App\Models\CmsLang;
use App\Models\CmsSchema;
use App\Models\CmsTag;
use App\Support\FrontCache;
use App\Support\PageMenus;
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

    /** Form fields saved through relations, not as page columns. */
    protected const RELATION_FIELDS = ['tag_ids', 'menu_ids', 'menus_managed'];

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
        $options = $this->templateOptions();

        // New pages start with the standard page template
        $schemaId = $request->get('schema_id') ?? $options['templates']->firstWhere('value', 'front/templates/page')['schema_ids'][0] ?? null;
        $schema = $schemaId ? CmsSchema::find($schemaId) : null;

        $args = [
            'id' => null,
            'lang_id' => $this->lang_id,
            'parent_id' => null,
            'schema_id' => $schemaId,
            'title' => '',
            'content' => '',
            'blocks' => [],
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
            'blockTypes' => BlockRegistry::definitions(),
            'blockPatterns' => CmsBlockPattern::forEditor(),
            'item' => $args,
            'schema' => $schema,
            ...$options,
            'parents' => $parents,
            'tags' => CmsTag::options(),
            'menus' => PageMenus::options(),
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
                return back()->withErrors(['schema_id' => __('Esta plantilla es única y ya está asignada a otra página.')]);
            }
            if ($parentId !== null) {
                return back()->withErrors(['parent_id' => __('Una plantilla única no puede tener una página superior.')]);
            }
        }

        if ($parentId !== null) {
            $parent = CmsArticle::find($parentId);
            if ($parent && $parent->schema && $parent->schema->isUnique()) {
                return back()->withErrors(['parent_id' => __('No se pueden crear subpáginas bajo una plantilla única.')]);
            }
        }

        $profile = new CmsArticle(Arr::except($data, self::RELATION_FIELDS));
        $profile->save();

        $profile->tags()->sync($data['tag_ids'] ?? []);
        $this->syncMenus($request, $profile, $data);

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
            'blockTypes' => BlockRegistry::definitions(),
            'blockPatterns' => CmsBlockPattern::forEditor(),
            'item' => $item,
            'schema' => $item?->schema,
            ...$this->templateOptions($item),
            'parents' => $parents,
            'tags' => CmsTag::options(),
            'menus' => PageMenus::options(),
            'menuIds' => PageMenus::membership($item),
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
                return back()->withErrors(['schema_id' => __('Esta plantilla es única y ya está asignada a otra página.')]);
            }
            if ($parentId !== null) {
                return back()->withErrors(['parent_id' => __('Una plantilla única no puede tener una página superior.')]);
            }
        }

        if ($parentId !== null) {
            $parent = CmsArticle::find($parentId);
            if ($parent && $parent->schema && $parent->schema->isUnique()) {
                return back()->withErrors(['parent_id' => __('No se pueden crear subpáginas bajo una plantilla única.')]);
            }
            if ($parentId == $id) {
                return back()->withErrors(['parent_id' => __('Una página no puede ser su propio padre.')]);
            }
            $descendantIds = $item->getAllDescendantIds();
            if (in_array($parentId, $descendantIds)) {
                return back()->withErrors(['parent_id' => __('No se puede seleccionar una subpágina como página superior.')]);
            }
        }

        $oldTitle = $item->title;
        $item->fill(Arr::except($data, self::RELATION_FIELDS));
        $item->save();

        $item->tags()->sync($data['tag_ids'] ?? []);
        $this->syncMenus($request, $item, $data);
        if ($oldTitle !== $item->title) {
            PageMenus::followTitle($item, $oldTitle);
        }

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
                    'ids' => __('No se puede mover a la papelera una página con subpáginas: :titles. Mueve o elimina primero sus subpáginas, o selecciónalas también.', ['titles' => $blocked->pluck('title')->implode(', ')]),
                ]);
            }
        }

        if ($action === 'restore') {
            $blocked = $items->filter(fn (CmsArticle $item): bool => $item->parent_id
                && ! in_array($item->parent_id, $ids)
                && CmsArticle::onlyTrashed()->whereKey($item->parent_id)->exists());
            if ($blocked->isNotEmpty()) {
                throw ValidationException::withMessages([
                    'ids' => __('Restaura primero la página superior de: :titles.', ['titles' => $blocked->pluck('title')->implode(', ')]),
                ]);
            }

            $taken = $items->filter(fn (CmsArticle $item): bool => $item->schema?->isUnique()
                && CmsArticle::where('schema_id', $item->schema_id)->exists());
            if ($taken->isNotEmpty()) {
                throw ValidationException::withMessages([
                    'ids' => __('La plantilla única ya está asignada a otra página: :titles.', ['titles' => $taken->pluck('title')->implode(', ')]),
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
     * The page templates for the editor, each with the field groups (schemas) behind it,
     * plus the flat list of those field groups. A single-use template already taken by
     * another page carries that page in "used_by".
     *
     * @return array{templates: Collection<int, array<string, mixed>>, schemas: Collection<int, CmsSchema>}
     */
    protected function templateOptions(?CmsArticle $item = null): array
    {
        CmsSchema::ensureTemplateDefaults();

        $schemas = CmsSchema::where('active', true)
            // Keep the page's own field group listed even if it was deactivated
            ->when($item?->schema_id, fn ($query) => $query->orWhere('id', $item->schema_id))
            ->orderBy('position')
            ->get()
            ->each(fn (CmsSchema $schema) => $schema->unique = $schema->isUnique());

        $templates = collect(CmsSchema::pageTemplates());
        $current = $item?->schema;
        if ($current && ! $templates->contains('value', (string) $current->front_view)) {
            $templates->push(['name' => $current->name, 'value' => (string) $current->front_view, 'file' => basename((string) $current->front_view).'.tsx', 'unique' => false]);
        }

        $templates = $templates->map(function (array $template) use ($schemas, $item): array {
            $usedBy = $template['unique']
                ? CmsArticle::whereHas('schema', fn ($query) => $query->where('front_view', $template['value']))
                    ->when($item, fn ($query) => $query->whereKeyNot($item->id))
                    ->first(['id', 'title'])
                : null;

            return [
                ...$template,
                'used_by' => $usedBy?->only(['id', 'title']),
                'schema_ids' => $schemas->filter(fn (CmsSchema $schema): bool => (string) $schema->front_view === $template['value'])->pluck('id')->values()->all(),
            ];
        })->values();

        return ['templates' => $templates, 'schemas' => $schemas];
    }

    /**
     * Apply the editor's "Menús" choices. Only users who can manage menus change them;
     * for anyone else the page keeps its current menu items.
     *
     * @param  array<string, mixed>  $data
     */
    protected function syncMenus(Request $request, CmsArticle $page, array $data): void
    {
        if (empty($data['menus_managed']) || ! $request->user()?->hasAdminPermission('menus', AdmAction::MANAGE)) {
            return;
        }

        PageMenus::sync($page, $data['menu_ids'] ?? []);
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
            'blocks' => 'nullable|array|max:'.BlockRegistry::MAX_BLOCKS,
            'blocks.*' => 'array',
            'excerpt' => 'nullable|string',
            'featured_image' => 'nullable|string|max:2048',
            'status' => 'nullable|string|in:draft,published',
            'published_at' => 'nullable|date',
            'metadata' => 'nullable|array',
            'slug' => 'nullable|string|max:500',
            'active' => 'nullable|boolean',
            'menu_ids' => 'nullable|array',
            'menu_ids.*' => 'integer|exists:cms_menus,id',
            // Sent by the editor so an empty selection (not sent as a field) still means "no menus"
            'menus_managed' => 'nullable|boolean',
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => ['integer', CmsTag::existsRule()],
        ]);
    }

    /**
     * Flatten pages parent-first with their depth. Children are grouped once, so this is
     * linear in the number of pages instead of scanning the list for every node.
     */
    protected function buildTree($elements, $parentId, &$sorted, $depth = 0, $byParent = null)
    {
        $byParent ??= $elements->groupBy(fn ($page) => (string) $page->parent_id);

        foreach (($byParent->get((string) $parentId) ?? collect())->sortBy('position') as $child) {
            $child->depth = $depth;
            $sorted[] = $child;
            $this->buildTree($elements, $child->id, $sorted, $depth + 1, $byParent);
        }
    }
}
