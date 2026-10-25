<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CmsLang;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Redirector;
use Inertia\Inertia;
use Inertia\Response;

class LangController extends Controller
{
    /**
     * Show the user's lang settings page.
     */
    public function index(Request $request): Response
    {
        $s = $request->get('s');

        $items = CmsLang::select()
            ->where(function ($query) use ($s): void {
                if (! empty($s)) {
                    $query->where('name', 'LIKE', '%'.str_replace(' ', '%', $s).'%');
                }
            })
            ->paginate(15);

        return Inertia::render('admin/langs/index', [
            'items' => $items,
        ]);
    }

    public function create()
    {
        return Inertia::render('admin/langs/create');
    }

    public function store(Request $request): Redirector|RedirectResponse
    {
        $lang = new CmsLang($this->validatedData($request));
        $lang->save();

        return redirect('admin/langs');
    }

    /**
     * Show the user's lang settings page.
     */
    public function edit($id, Request $request): Response
    {
        $item = CmsLang::findOrFail($id);

        return Inertia::render('admin/langs/edit', [
            'item' => $item,
        ]);
    }

    /**
     * Update the user's lang settings.
     */
    public function update($id, Request $request): RedirectResponse
    {
        $item = CmsLang::findOrFail($id);
        $item->fill($this->validatedData($request));
        $item->save();

        return redirect('admin/langs');
    }

    /**
     * Delete the user's account.
     */
    public function destroy($id, Request $request): RedirectResponse
    {
        $item = CmsLang::findOrFail($id);
        $item->delete();

        return redirect('admin/langs');
    }

    /**
     * @return array<string, mixed>
     */
    protected function validatedData(Request $request): array
    {
        return $request->validate([
            'name' => 'required|string|max:255',
            'iso' => 'required|string|max:5',
            'active' => 'nullable|boolean',
        ]);
    }
}
