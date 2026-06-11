<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

use App\Models\CmsArticle;
use App\Models\CmsLang;
use App\Models\CmsSchema;

class ArticleController extends Controller
{
    protected $lang_id, $parent_id;

    public function __construct(Request $request)
    {
        $this->lang_id = $request->get('lang_id');
        $this->parent_id = $request->get('parent_id');
        if(!$this->lang_id){
            $lang = CmsLang::select()
            ->where('active', true)
            ->orderBy('name', 'desc')
            ->first();
            if($lang) $this->lang_id = $lang->id;
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

        $query = CmsArticle::with(['schema', 'parent'])
            ->where('lang_id', $lang_id);

        if (!empty($s)) {
            $query->where('title', 'LIKE', '%'.str_replace(' ', '%', $s).'%');
        }

        $allArticles = $query->orderBy('position')->get();

        if (empty($s)) {
            $sortedArticles = [];
            $this->buildTree($allArticles, null, $sortedArticles);
            $items = collect($sortedArticles);
        } else {
            $items = $allArticles;
        }

        $currentPage = \Illuminate\Pagination\LengthAwarePaginator::resolveCurrentPage();
        $perPage = 15;
        $currentItems = $items->slice(($currentPage - 1) * $perPage, $perPage)->values();
        $paginated = new \Illuminate\Pagination\LengthAwarePaginator(
            $currentItems,
            $items->count(),
            $perPage,
            $currentPage,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        return Inertia::render('admin/articles/index', [
            'items' => $items->values(),
            'paging' => $paginated,
        ]);
    }

    public function create(Request $request)
    {
      $schemas = CmsSchema::where('active', 1)->get()->map(function ($s) {
          $s->unique = $s->isUnique();
          return $s;
      })->filter(function ($schema) {
          if ($schema->unique) {
              return !CmsArticle::where('schema_id', $schema->id)->exists();
          }
          return true;
      })->values();
      
      $schemaId = $request->get('schema_id');
      if (!$schemaId && $schemas->isNotEmpty()) {
          $schemaId = $schemas->first()->id;
      }
      $schema = $schemaId ? CmsSchema::find($schemaId) : null;

      $args = [
        'id' => null,
        'lang_id' => $this->lang_id,
        'parent_id' => null,
        'schema_id' => $schemaId,
        'title' => '',
        'metadata' => new \stdClass(),
        'slug' => '',
        'active' => true,
      ];

      $parents = CmsArticle::where('lang_id', $this->lang_id)
          ->where('active', 1)
          ->get()
          ->filter(function ($article) {
              return !$article->schema?->isUnique();
          })
          ->values();

      $taxonomies = \App\Models\CmsTaxonomy::with(['terms' => function ($query) {
          $query->where('active', true)->orderBy('position');
      }])->where('active', true)->get();

      return Inertia::render('admin/articles/create', [
        'item' => $args,
        'schema' => $schema,
        'schemas' => $schemas,
        'parents' => $parents,
        'taxonomies' => $taxonomies,
      ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'schema_id' => 'required|integer|exists:cms_schemas,id',
            'parent_id' => 'nullable|integer|exists:cms_articles,id',
        ]);

        $schemaId = $request->input('schema_id');
        $schema = CmsSchema::find($schemaId);
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

        $profile = new CmsArticle($request->all());
        $profile->save();

        if ($request->has('term_ids')) {
            $termIds = collect($request->input('term_ids'))->filter()->all();
            $profile->terms()->sync($termIds);
        }

        $args = [
            'lang_id' => $this->lang_id,
            'parent_id' => null
        ];

        return redirect()->route('articles.index', $args);
    }

    /**
     * Show the user's profile settings page.
     */
    public function edit($id, Request $request): Response
    {
        $item = CmsArticle::with(['schema', 'terms'])->findOrFail($id);
        $descendantIds = $item->getAllDescendantIds();

        $schemas = CmsSchema::where('active', 1)->get()->map(function ($s) {
            $s->unique = $s->isUnique();
            return $s;
        })->filter(function ($schema) use ($id) {
            if ($schema->unique) {
                return !CmsArticle::where('schema_id', $schema->id)
                    ->where('id', '!=', $id)
                    ->exists();
            }
            return true;
        })->values();

        $parents = CmsArticle::where('lang_id', $this->lang_id)
            ->where('id', '!=', $id)
            ->where('active', 1)
            ->get()
            ->filter(function ($article) use ($descendantIds) {
                if (in_array($article->id, $descendantIds)) {
                    return false;
                }
                return !$article->schema?->isUnique();
            })
            ->values();

        $taxonomies = \App\Models\CmsTaxonomy::with(['terms' => function ($query) {
            $query->where('active', true)->orderBy('position');
        }])->where('active', true)->get();

        return Inertia::render('admin/articles/edit', [
            'item' => $item,
            'schema' => $item?->schema,
            'schemas' => $schemas,
            'parents' => $parents,
            'taxonomies' => $taxonomies,
        ]);
    }

    /**
     * Update the user's profile settings.
     */
    public function update($id, Request $request): RedirectResponse
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'schema_id' => 'required|integer|exists:cms_schemas,id',
            'parent_id' => 'nullable|integer|exists:cms_articles,id',
        ]);

        $schemaId = $request->input('schema_id');
        $schema = CmsSchema::find($schemaId);
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

        $item->fill($request->all());
		$item->save();

        if ($request->has('term_ids')) {
            $termIds = collect($request->input('term_ids'))->filter()->all();
            $item->terms()->sync($termIds);
        } else {
            $item->terms()->sync([]);
        }

        $args = [
            'lang_id' => $this->lang_id,
            'parent_id' => null
        ];

        return redirect()->route('articles.index', $args);
    }

    /**
     * Delete the user's account.
     */
    public function destroy($id, Request $request): RedirectResponse
    {
        $item = CmsArticle::find($id);
		$item->delete();

        return redirect('admin/articles');
    }

    public function sort(Request $request)
    {
        $articles = $request->get('articles');
        foreach ($articles as $index => $article) {
            CmsArticle::where('id', $article['id'])->update(['position' => $index]);
        }

        return response()->json(['status' => 'success']);
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
