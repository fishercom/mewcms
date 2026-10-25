<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CmsParameter;
use App\Models\CmsParameterGroup;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Redirector;
use Inertia\Inertia;
use Inertia\Response;

// For parents

class ParameterController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function index(Request $request): Response
    {
        $s = $request->get('s');

        $items = CmsParameter::select()
            ->where(function ($query) use ($s): void {
                if (! empty($s)) {
                    $query->where('name', 'LIKE', '%'.str_replace(' ', '%', $s).'%');
                }
            })
            ->paginate(15);

        return Inertia::render('admin/parameters/index', [
            'items' => $items,
        ]);
    }

    public function create()
    {
        $groups = CmsParameterGroup::all();
        $parents = CmsParameter::whereNull('parent_id')->get(); // Only top-level parameters can be parents

        return Inertia::render('admin/parameters/create', [
            'groups' => $groups,
            'parents' => $parents,
        ]);
    }

    public function store(Request $request): Redirector|RedirectResponse
    {
        $profile = new CmsParameter($this->validatedData($request));
        $profile->save();

        return redirect('admin/parameters');
    }

    /**
     * Show the user's profile settings page.
     */
    public function edit($id, Request $request): Response
    {
        $item = CmsParameter::findOrFail($id);
        $groups = CmsParameterGroup::all();
        $parents = CmsParameter::whereNull('parent_id')->get(); // Only top-level parameters can be parents

        return Inertia::render('admin/parameters/edit', [
            'item' => $item,
            'groups' => $groups,
            'parents' => $parents,
        ]);
    }

    /**
     * Update the user's profile settings.
     */
    public function update($id, Request $request): RedirectResponse
    {
        $item = CmsParameter::findOrFail($id);
        $item->fill($this->validatedData($request));
        $item->save();

        return redirect('admin/parameters');
    }

    /**
     * Delete the user's account.
     */
    public function destroy($id, Request $request): RedirectResponse
    {
        $item = CmsParameter::findOrFail($id);
        $item->delete();

        return redirect('admin/parameters');
    }

    /**
     * @return array<string, mixed>
     */
    protected function validatedData(Request $request): array
    {
        return $request->validate([
            'group_id' => 'required|integer|exists:cms_parameters_group,id',
            'parent_id' => 'nullable|integer|exists:cms_parameters,id',
            'name' => 'required|string|max:255',
            'value' => 'nullable|string',
            'metadata' => 'nullable|array',
            'active' => 'nullable|boolean',
        ]);
    }
}
