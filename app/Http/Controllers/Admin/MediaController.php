<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CmsMedia;
use App\Support\MediaLibrary;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class MediaController extends Controller
{
    public const TYPES = ['image', 'document', 'video', 'audio'];

    public function index(Request $request): Response
    {
        $trash = $request->boolean('trash');

        return Inertia::render('admin/media/index', [
            'items' => $this->query($request, $trash)->paginate(40)->withQueryString(),
            'filters' => $request->only(['s', 'type', 'trash', 'view']),
            'trashCount' => CmsMedia::onlyTrashed()->count(),
            'maxUploadKb' => MediaLibrary::MAX_UPLOAD_KB,
            'accept' => MediaLibrary::UPLOAD_MIMES,
        ]);
    }

    /** JSON list for the media picker used by the editors */
    public function picker(Request $request): JsonResponse
    {
        return response()->json($this->query($request, false)->paginate(36)->withQueryString());
    }

    public function store(Request $request): JsonResponse|RedirectResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'max:'.MediaLibrary::MAX_UPLOAD_KB, 'mimetypes:'.implode(',', MediaLibrary::UPLOAD_MIMES)],
        ], [
            'file.mimetypes' => __('Este tipo de archivo no está permitido.'),
            'file.max' => __('El archivo supera el tamaño máximo de :size MB.', ['size' => MediaLibrary::MAX_UPLOAD_KB / 1024]),
        ]);

        $media = MediaLibrary::store($request->file('file'), $request->user()?->id);

        return $request->wantsJson() ? response()->json($media->fresh(), 201) : back();
    }

    public function update(CmsMedia $medium, Request $request): JsonResponse|RedirectResponse
    {
        $data = $request->validate([
            'alt' => 'nullable|string|max:512',
            'caption' => 'nullable|string|max:2000',
            'title' => 'nullable|string|max:255',
        ]);

        $medium->update(array_map(fn ($value) => is_string($value) ? trim($value) : $value, $data));

        return $request->wantsJson() ? response()->json($medium) : back();
    }

    /** Move to the trash */
    public function destroy(CmsMedia $medium): RedirectResponse
    {
        $medium->delete();

        return back();
    }

    public function bulk(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'action' => ['required', Rule::in(['trash', 'restore', 'force_delete'])],
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer',
        ]);

        $items = CmsMedia::withTrashed()->whereKey($data['ids'])->get();

        foreach ($items as $item) {
            match ($data['action']) {
                'trash' => $item->trashed() || $item->delete(),
                'restore' => $item->trashed() && $item->restore(),
                'force_delete' => $item->trashed() && $this->forceDelete($item),
            };
        }

        return back();
    }

    protected function forceDelete(CmsMedia $item): bool
    {
        MediaLibrary::deleteFiles($item);

        return (bool) $item->forceDelete();
    }

    /**
     * @return Builder<CmsMedia>
     */
    protected function query(Request $request, bool $trash): Builder
    {
        $s = trim((string) $request->get('s'));
        $type = $request->get('type');

        return ($trash ? CmsMedia::onlyTrashed() : CmsMedia::query())
            ->with('uploader:id,name')
            ->when($s !== '', fn (Builder $query) => $query->where(function (Builder $query) use ($s): void {
                $like = '%'.str_replace(' ', '%', $s).'%';
                $query->where('filename', 'LIKE', $like)->orWhere('title', 'LIKE', $like)->orWhere('alt', 'LIKE', $like);
            }))
            ->when(in_array($type, self::TYPES, true), fn (Builder $query) => $query->ofType($type))
            ->latest($trash ? 'deleted_at' : 'created_at')
            ->latest('id');
    }
}
