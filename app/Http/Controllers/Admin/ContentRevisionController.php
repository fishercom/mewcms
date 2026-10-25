<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdmAction;
use App\Models\CmsArticle;
use App\Models\CmsPost;
use App\Models\CmsRevision;
use App\Support\AdminActivity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

/**
 * Revisions, autosave and preview for pages ("articles") and posts. The routes pass the
 * module as the "module" default, so permissions follow the articles/posts modules.
 * Route defaults come after the URL parameters, so $module is the last argument.
 */
class ContentRevisionController extends Controller
{
    /** Minutes a preview link stays valid. */
    public const PREVIEW_MINUTES = 30;

    public function index($id, string $module): JsonResponse
    {
        $item = $this->find($module, $id);

        $revisions = $item->revisions()->with('user:id,name')->get()
            ->map(fn (CmsRevision $revision): array => [
                'id' => $revision->id,
                'title' => $revision->title,
                'status' => $revision->status,
                'is_autosave' => $revision->is_autosave,
                'author' => $revision->user?->name,
                'created_at' => $revision->updated_at->toAtomString(),
            ]);

        return response()->json(['revisions' => $revisions]);
    }

    public function show($id, $revisionId, string $module): JsonResponse
    {
        $revision = $this->find($module, $id)->revisions()->findOrFail($revisionId);

        return response()->json($revision->only(['id', 'title', 'content', 'excerpt', 'metadata', 'status', 'published_at', 'tag_ids', 'is_autosave']));
    }

    public function restore(Request $request, $id, $revisionId, string $module): RedirectResponse
    {
        $item = $this->find($module, $id);
        $revision = $item->revisions()->findOrFail($revisionId);

        $item->restoreRevision($revision, $request->user()->id);

        AdminActivity::record($module, AdmAction::MANAGE, 'Revisión restaurada', '#'.$item->id.' '.Str::limit((string) $item->title, 120));

        return back();
    }

    /**
     * Keep the editor's unsaved changes for this user without touching the live record.
     */
    public function autosave(Request $request, $id, string $module): JsonResponse
    {
        $item = $this->find($module, $id);
        $data = $request->validate($this->rules());

        $revision = $item->autosave($request->user()->id, $data);

        return response()->json(['saved_at' => $revision->updated_at->toAtomString()]);
    }

    public function discardAutosave(Request $request, $id, string $module): JsonResponse
    {
        $this->find($module, $id)->revisions()
            ->where('is_autosave', true)
            ->where('user_id', $request->user()->id)
            ->delete();

        return response()->json(['discarded' => true]);
    }

    /**
     * Store the editor's current (unsaved) data and return a temporary signed link that
     * renders it with the public template.
     */
    public function preview(Request $request, string $module): JsonResponse
    {
        $data = $request->validate([
            ...$this->rules(),
            'id' => 'nullable|integer',
            'schema_id' => 'nullable|integer',
            'parent_id' => 'nullable|integer',
            'featured_image' => 'nullable|string|max:2048',
            'post_type' => 'nullable|string|max:100',
            'user_id' => 'nullable|integer',
        ]);

        if (! empty($data['id'])) {
            $this->find($module, $data['id']);
        }

        $token = (string) Str::uuid();
        Cache::put('preview.'.$token, ['module' => $module, 'data' => $data], now()->addMinutes(self::PREVIEW_MINUTES));

        return response()->json([
            'url' => URL::temporarySignedRoute('front.preview', now()->addMinutes(self::PREVIEW_MINUTES), ['token' => $token]),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    protected function rules(): array
    {
        return [
            'title' => 'nullable|string|max:255',
            'content' => 'nullable|string',
            'excerpt' => 'nullable|string',
            'metadata' => 'nullable|array',
            'status' => 'nullable|string|in:draft,published',
            'published_at' => 'nullable|date',
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => 'integer',
        ];
    }

    /**
     * @return CmsArticle|CmsPost
     */
    protected function find(string $module, $id): Model
    {
        return match ($module) {
            'articles' => CmsArticle::withTrashed()->findOrFail($id),
            'posts' => CmsPost::withTrashed()->findOrFail($id),
            default => abort(404),
        };
    }
}
