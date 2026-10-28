<?php

namespace App\Http\Controllers\Admin;

use App\Blocks\BlockRegistry;
use App\Http\Controllers\Admin\Concerns\BulkContentActions;
use App\Http\Controllers\Controller;
use App\Models\CmsBlockPattern;
use App\Models\CmsLang;
use App\Models\CmsPost;
use App\Models\CmsPostType;
use App\Models\CmsSchema;
use App\Models\CmsTag;
use App\Models\User;
use App\Support\FrontCache;
use App\Support\Sites;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class PostController extends Controller
{
    use BulkContentActions;

    protected $lang_id;

    protected $post_type;

    public function __construct(Request $request)
    {
        $this->lang_id = $request->get('lang_id');
        if (! $this->lang_id) {
            $lang = CmsLang::where('active', true)
                ->orderBy('name', 'desc')
                ->first();
            if ($lang) {
                $this->lang_id = $lang->id;
            }
        }

        $this->post_type = $request->get('post_type', 'post');

        Inertia::share('lang_id', $this->lang_id);
        Inertia::share('post_type', $this->post_type);
    }

    public function index(Request $request): Response
    {
        $s = $request->get('s');
        $status = $request->get('status');
        $trash = $request->boolean('trash');

        $query = ($trash ? CmsPost::onlyTrashed() : CmsPost::query())
            ->with(['user', 'tags', 'schema'])
            ->where('lang_id', $this->lang_id)
            ->where('post_type', $this->post_type);

        if (! empty($s)) {
            $query->where('title', 'LIKE', '%'.str_replace(' ', '%', $s).'%');
        }

        if (! empty($status)) {
            $query->where('status', $status);
        }

        $items = $query->latest('published_at')
            ->latest('created_at')
            ->paginate(15)
            ->withQueryString();

        // Resolve CPT metadata if this is a custom post type
        $cpt = null;
        if ($this->post_type !== 'post') {
            $cpt = CmsPostType::where('slug', $this->post_type)->first();
        }

        return Inertia::render('admin/posts/index', [
            'items' => $items,
            'cpt' => $cpt,
            'trash' => $trash,
            'trashCount' => CmsPost::onlyTrashed()
                ->where('lang_id', $this->lang_id)
                ->where('post_type', $this->post_type)
                ->count(),
        ]);
    }

    public function create(Request $request): Response
    {
        $schemas = CmsSchema::where('active', 1)->get(['id', 'name']);
        $authors = User::where('active', 1)->get(['id', 'name', 'username']);

        $cpt = null;
        $defaultSchemaId = null;
        if ($this->post_type !== 'post') {
            $cpt = CmsPostType::where('slug', $this->post_type)->first();
            if ($cpt) {
                $defaultSchemaId = $cpt->default_schema_id;
            }
        }

        $schemaId = $request->get('schema_id', $defaultSchemaId);
        $schema = $schemaId ? CmsSchema::find($schemaId) : null;

        $args = [
            'id' => null,
            'lang_id' => $this->lang_id,
            'user_id' => Auth::id(),
            'schema_id' => $schemaId,
            'post_type' => $this->post_type,
            'title' => '',
            'slug' => '',
            'content' => '',
            'blocks' => [],
            'excerpt' => '',
            'featured_image' => '',
            'metadata' => new \stdClass,
            'status' => 'draft',
            'published_at' => now()->format('Y-m-d\TH:i'),
            'active' => true,
            'tag_ids' => [],
        ];

        return Inertia::render('admin/posts/create', [
            'blockTypes' => BlockRegistry::definitions(),
            'blockPatterns' => CmsBlockPattern::forEditor(),
            'item' => $args,
            'schema' => $schema,
            'schemas' => $schemas,
            'authors' => $authors,
            'tags' => CmsTag::options(),
            'cpt' => $cpt,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'slug' => ['nullable', 'string', 'max:255', Sites::unique('cms_posts', 'slug')],
            'status' => 'required|string|in:draft,published',
            'published_at' => 'nullable|date',
            'schema_id' => 'nullable|integer|exists:cms_schemas,id',
            'user_id' => 'required|integer|exists:users,id',
            'excerpt' => 'nullable|string',
            'content' => 'nullable|string',
            'blocks' => 'nullable|array|max:'.BlockRegistry::MAX_BLOCKS,
            'blocks.*' => 'array',
            'featured_image' => 'nullable|string|max:500',
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => ['integer', CmsTag::existsRule()],
        ]);

        $post = new CmsPost($request->except('tag_ids'));
        $post->post_type = $this->post_type;
        $post->lang_id = $this->lang_id;

        if (empty($post->published_at)) {
            $post->published_at = now();
        }

        $post->save();

        $post->tags()->sync($request->input('tag_ids', []));

        // Tag counts change with the pivot sync, which fires no model events
        FrontCache::flush();

        $post->recordSave($request->user()?->id);

        return redirect()->route('posts.index', [
            'lang_id' => $this->lang_id,
            'post_type' => $this->post_type,
        ]);
    }

    public function edit($id, Request $request): Response
    {
        $item = CmsPost::with(['tags'])->findOrFail($id);

        $schemas = CmsSchema::where('active', 1)->get(['id', 'name']);
        $authors = User::where('active', 1)->get(['id', 'name', 'username']);

        $schemaId = $request->get('schema_id', $item->schema_id);
        $schema = $schemaId ? CmsSchema::find($schemaId) : null;

        $cpt = null;
        if ($this->post_type !== 'post') {
            $cpt = CmsPostType::where('slug', $this->post_type)->first();
        }

        $item->tag_ids = $item->tags->pluck('id')->all();

        return Inertia::render('admin/posts/edit', [
            'blockTypes' => BlockRegistry::definitions(),
            'blockPatterns' => CmsBlockPattern::forEditor(),
            'item' => $item,
            'schema' => $schema,
            'schemas' => $schemas,
            'authors' => $authors,
            'tags' => CmsTag::options(),
            'cpt' => $cpt,
            'autosave' => $item->pendingAutosave($request->user()->id),
        ]);
    }

    public function update($id, Request $request): RedirectResponse
    {
        $post = CmsPost::findOrFail($id);

        $request->validate([
            'title' => 'required|string|max:255',
            'slug' => ['required', 'string', 'max:255', Sites::unique('cms_posts', 'slug', $id)],
            'status' => 'required|string|in:draft,published',
            'published_at' => 'nullable|date',
            'schema_id' => 'nullable|integer|exists:cms_schemas,id',
            'user_id' => 'required|integer|exists:users,id',
            'excerpt' => 'nullable|string',
            'content' => 'nullable|string',
            'blocks' => 'nullable|array|max:'.BlockRegistry::MAX_BLOCKS,
            'blocks.*' => 'array',
            'featured_image' => 'nullable|string|max:500',
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => ['integer', CmsTag::existsRule()],
        ]);

        if (empty($request->slug)) {
            $post->slug = null;
        }

        $post->update($request->except('tag_ids', 'slug'));

        if (! empty($request->slug)) {
            $post->slug = $request->slug;
        }

        if (empty($post->published_at)) {
            $post->published_at = now();
        }

        $post->save();

        $post->tags()->sync($request->input('tag_ids', []));

        // Tag counts change with the pivot sync, which fires no model events
        FrontCache::flush();

        $post->recordSave($request->user()?->id);

        return redirect()->route('posts.index', [
            'lang_id' => $this->lang_id,
            'post_type' => $this->post_type,
        ]);
    }

    /**
     * Apply a bulk action (publish, draft, trash, restore, force_delete) to the selected posts.
     */
    public function bulk(Request $request): RedirectResponse
    {
        $this->applyBulkAction($request, CmsPost::class, 'posts');

        return back();
    }

    /**
     * Move the post to the trash.
     */
    public function destroy($id): RedirectResponse
    {
        $post = CmsPost::findOrFail($id);
        $post->delete();

        return redirect()->route('posts.index', [
            'lang_id' => $this->lang_id,
            'post_type' => $this->post_type,
        ]);
    }
}
