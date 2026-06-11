<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

use App\Models\CmsSchema;
use App\Models\CmsSchemaGroup;

class SchemaController extends Controller
{
    protected $group_id;

    public function __construct(Request $request)
    {
        $this->group_id = $request->get('group_id');
        if(!$this->group_id){
            $group = CmsSchemaGroup::select()
            ->where('active', true)
            ->orderBy('name', 'desc')
            ->first();
            if($group) $this->group_id = $group->id;
        }

        Inertia::share('group_id', $this->group_id);
    }

    /**
     * Show the user's profile settings page.
     */
    public function index(Request $request): Response
    {
        $s = $request->get('s');
        $group_id = $this->group_id;

        $groups = CmsSchemaGroup::select()
        ->where('active', true)
        ->orderBy('name', 'desc')
        ->get();

        $items = CmsSchema::withCount('articles')
        ->where(function($query) use($s){
            if(!empty($s)){
                $query->where('name', 'LIKE', '%'.str_replace(' ', '%', $s).'%');
            }
        })
        ->where('group_id', $group_id)
        ->paginate(15);

        return Inertia::render('admin/schemas/index', [
            'items' => $items,
            'groups' => $groups,
        ]);
    }

    /**
     * Show the user's profile settings page.
     */
    public function show($id, Request $request): Response
    {
        $item = CmsSchema::find($id);
        return Inertia::render('admin/schemas/view', [
            'item' => $item,
        ]);
    }

    public function create()
    {
        $groups = CmsSchemaGroup::all();
        $args = [
            'group_id' => $this->group_id,
        ];
        return Inertia::render('admin/schemas/create', [
            'item' => $args,
            'groups' => $groups,
            'templates' => CmsSchema::getAvailableTemplates(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'group_id' => 'required|integer|exists:cms_schema_groups,id',
            'iterations' => 'nullable|integer|min:1',
            'front_view' => 'nullable|string',
            'fields' => 'nullable|array',
            'active' => 'boolean',
        ]);

        $profile = new CmsSchema($validated);
        $profile->save();
        $args = [
            'group_id' => $this->group_id,
        ];
        return redirect()->route('schemas.index', $args);
    }

    /**
     * Show the user's profile settings page.
     */
    public function edit($id, Request $request): Response
    {
        $item = CmsSchema::find($id);
        $groups = CmsSchemaGroup::all();
        return Inertia::render('admin/schemas/edit', [
            'item' => $item,
            'groups' => $groups,
            'templates' => CmsSchema::getAvailableTemplates(),
        ]);
    }

    /**
     * Update the user's profile settings.
     */
    public function update($id, Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'group_id' => 'required|integer|exists:cms_schema_groups,id',
            'iterations' => 'nullable|integer|min:1',
            'front_view' => 'nullable|string',
            'fields' => 'nullable|array',
            'active' => 'boolean',
        ]);

        $item = CmsSchema::findOrFail($id);
        $item->fill($validated);
        $item->save();

        $args = [
            'group_id' => $this->group_id,
        ];
        return redirect()->route('schemas.index', $args);
    }

    /**
     * Delete the user's account.
     */
    public function destroy($id, Request $request): RedirectResponse
    {
        $item = CmsSchema::findOrFail($id);

        if ($item->articles()->exists()) {
            return back()->withErrors(['error' => 'No se puede eliminar el esquema porque está asignado a uno o más artículos.']);
        }

        $item->delete();

        return back();
    }

    public function root()
    {
        $list = CmsSchema::whereNull('parent_id')->get();
        return response()->json($list);
    }

    public function children(CmsSchema $schema)
    {
        return response()->json($schema->children);
    }
}
