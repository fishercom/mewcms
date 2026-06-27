<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CmsTranslate;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TranslateController extends Controller
{
    /**
     * Show the user's Translate settings page.
     */
    public function index(Request $request): Response
    {
        $s = $request->get('s');

        $items = CmsTranslate::select()
            ->where(function ($query) use ($s) {
                if (! empty($s)) {
                    $query->where('name', 'LIKE', '%'.str_replace(' ', '%', $s).'%');
                }
            })
            ->paginate(15);

        return Inertia::render('admin/translates/index', [
            'items' => $items,
        ]);
    }

    public function create()
    {
        return Inertia::render('admin/translates/create');
    }

    public function store(Request $request)
    {
        $Translate = new CmsTranslate($request->all());
        $Translate->save();

        return redirect('admin/translates');
    }

    /**
     * Show the user's Translate settings page.
     */
    public function edit($id, Request $request): Response
    {
        $item = CmsTranslate::find($id);

        return Inertia::render('admin/translates/edit', [
            'item' => $item,
        ]);
    }

    /**
     * Update the user's Translate settings.
     */
    public function update($id, Request $request): RedirectResponse
    {
        $item = CmsTranslate::find($id);
        $item->fill($request->all());
        $item->save();

        return redirect('admin/translates');
    }

    /**
     * Delete the user's account.
     */
    public function destroy($id, Request $request): RedirectResponse
    {
        $item = CmsTranslate::find($id);
        $item->delete();

        return redirect('admin/translates');
    }
}
