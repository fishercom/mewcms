<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

use App\Models\CmsSite;
use App\Models\CmsSchemaGroup;

class SiteController extends Controller
{
    /**
     * Show the user's log settings page.
     */
    public function index(Request $request): Response
    {
        $s = $request->get('s');

        $items = CmsSite::select()
        ->where(function($query) use($s){
            if(!empty($s)){
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

    public function store(Request $request)
    {
        $site = new CmsSite($request->all());
        $site->save();
        return redirect('admin/sites');
    }

    /**
     * Show the user's log settings page.
     */
    public function edit($id, Request $request): Response
    {
        $item = CmsSite::find($id);
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
        $item = CmsSite::find($id);
		$item->fill($request->all());
		$item->save();

        return redirect('admin/sites');
    }

    /**
     * Delete the user's account.
     */
    public function destroy($id, Request $request): RedirectResponse
    {
        $item = CmsSite::find($id);
		$item->delete();

        return redirect('admin/sites');
    }
}
