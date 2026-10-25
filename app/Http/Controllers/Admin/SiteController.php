<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CmsSchemaGroup;
use App\Models\CmsSite;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Redirector;
use Inertia\Inertia;
use Inertia\Response;

class SiteController extends Controller
{
    /**
     * Show the user's log settings page.
     */
    public function index(Request $request): Response
    {
        $s = $request->get('s');

        $items = CmsSite::select()
            ->where(function ($query) use ($s): void {
                if (! empty($s)) {
                    $query->where('name', 'LIKE', '%'.str_replace(' ', '%', $s).'%');
                }
            })
            ->paginate(15);

        return Inertia::render('admin/sites/index', [
            'items' => $items,
        ]);
    }

    public function create()
    {
        $schemaGroups = CmsSchemaGroup::all();

        return Inertia::render('admin/sites/create', [
            'schemaGroups' => $schemaGroups,
        ]);
    }

    public function store(Request $request): Redirector|RedirectResponse
    {
        $site = new CmsSite($this->validatedData($request));
        $site->save();

        return redirect('admin/sites');
    }

    /**
     * Show the user's log settings page.
     */
    public function edit($id, Request $request): Response
    {
        $item = CmsSite::findOrFail($id);
        $schemaGroups = CmsSchemaGroup::all();

        return Inertia::render('admin/sites/edit', [
            'item' => $item,
            'schemaGroups' => $schemaGroups,
        ]);
    }

    /**
     * Update the user's log settings.
     */
    public function update($id, Request $request): RedirectResponse
    {
        $item = CmsSite::findOrFail($id);
        $item->fill($this->validatedData($request));
        $item->save();

        return redirect('admin/sites');
    }

    /**
     * Delete the user's account.
     */
    public function destroy($id, Request $request): RedirectResponse
    {
        $item = CmsSite::findOrFail($id);
        $item->delete();

        return redirect('admin/sites');
    }

    /**
     * @return array<string, mixed>
     */
    protected function validatedData(Request $request): array
    {
        return $request->validate([
            'name' => 'required|string|max:255',
            'segment' => 'nullable|string|max:255',
            'site_url' => 'nullable|string|max:255',
            'schema_group_id' => 'nullable|integer|exists:cms_schema_groups,id',
            'metadata' => 'nullable|array',
            'default' => 'nullable|boolean',
            'active' => 'nullable|boolean',
        ]);
    }
}
