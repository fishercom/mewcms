<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CmsRedirect;
use App\Support\Sites;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RedirectController extends Controller
{
    public function index(Request $request): Response
    {
        $s = $request->get('s');

        $items = CmsRedirect::query()
            ->when($s, fn ($query) => $query->where(fn ($query) => $query
                ->where('from_path', 'like', '%'.$s.'%')
                ->orWhere('to_path', 'like', '%'.$s.'%')))
            ->latest('updated_at')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/redirects/index', [
            'items' => $items,
            'filters' => $request->only('s'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        CmsRedirect::create($this->validated($request));

        return back();
    }

    public function update($id, Request $request): RedirectResponse
    {
        $redirect = CmsRedirect::findOrFail($id);
        $redirect->update($this->validated($request, $redirect));

        return back();
    }

    public function destroy($id): RedirectResponse
    {
        CmsRedirect::findOrFail($id)->delete();

        return back();
    }

    /**
     * @return array{from_path: string, to_path: string, status_code: int}
     */
    protected function validated(Request $request, ?CmsRedirect $redirect = null): array
    {
        $request->merge([
            'from_path' => CmsRedirect::normalizePath((string) $request->input('from_path')),
            'to_path' => CmsRedirect::normalizePath((string) $request->input('to_path')),
        ]);

        $data = $request->validate([
            'from_path' => ['required', 'string', 'max:500', 'regex:#^/#', Sites::unique('cms_redirects', 'from_path', $redirect?->id)],
            'to_path' => ['required', 'string', 'max:1000', 'regex:#^(/|https?://)#i'],
            'status_code' => ['nullable', 'integer', Rule::in([301, 302])],
        ], [
            'from_path.unique' => __('Ya existe una redirección desde esa dirección.'),
        ]);

        if ($data['from_path'] === '/' || $data['from_path'] === $data['to_path']) {
            throw ValidationException::withMessages(['from_path' => __('La dirección de origen no puede ser la portada ni igual al destino.')]);
        }

        return [...$data, 'status_code' => $data['status_code'] ?? 301];
    }
}
