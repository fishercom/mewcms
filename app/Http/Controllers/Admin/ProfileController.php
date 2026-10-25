<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdmModule;
use App\Models\AdmPermission;
use App\Models\Profile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Redirector;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function index(Request $request): Response
    {
        $s = $request->get('s');

        $items = Profile::select()
            ->where(function ($query) use ($s): void {
                if (! empty($s)) {
                    $query->where('name', 'LIKE', '%'.str_replace(' ', '%', $s).'%');
                }
            })
            ->paginate(15);

        return Inertia::render('admin/profiles/index', [
            'items' => $items,
        ]);
    }

    public function create()
    {
        $modules = AdmModule::with('events.action')->where('visible', true)->orderBy('name')->get();

        return Inertia::render('admin/profiles/create', [
            'modules' => $modules,
        ]);
    }

    public function store(Request $request): Redirector|RedirectResponse
    {
        $data = $this->validatedData($request);
        $profile = new Profile($data);
        $profile->save();

        if (! empty($data['permissions'])) {
            foreach ($data['permissions'] as $event_id) {
                AdmPermission::create([
                    'profile_id' => $profile->id,
                    'event_id' => $event_id,
                ]);
            }
        }

        return redirect('admin/profiles');
    }

    /**
     * Show the user's profile settings page.
     */
    public function edit($id, Request $request): Response
    {
        $item = Profile::find($id);
        $modules = AdmModule::with('events.action')->where('visible', true)->orderBy('name')->get();
        $item->permissions = AdmPermission::where('profile_id', $id)->pluck('event_id')->toArray();

        return Inertia::render('admin/profiles/edit', [
            'item' => $item,
            'modules' => $modules,
        ]);
    }

    /**
     * Update the user's profile settings.
     */
    public function update($id, Request $request): RedirectResponse
    {
        $item = Profile::findOrFail($id);
        $this->authorizeProfileChange($request, $item);
        $data = $this->validatedData($request);
        $item->fill($data);
        $item->save();

        AdmPermission::where('profile_id', $id)->delete();

        if (! empty($data['permissions'])) {
            foreach ($data['permissions'] as $event_id) {
                AdmPermission::create([
                    'profile_id' => $id,
                    'event_id' => $event_id,
                ]);
            }
        }

        return redirect('admin/profiles');
    }

    /**
     * Delete the user's account.
     */
    public function destroy($id, Request $request): RedirectResponse
    {
        $item = Profile::findOrFail($id);
        $this->authorizeProfileChange($request, $item);
        $item->delete();

        return redirect('admin/profiles');
    }

    /**
     * @return array<string, mixed>
     */
    protected function validatedData(Request $request): array
    {
        return $request->validate([
            'name' => 'required|string|max:255',
            'active' => 'nullable|boolean',
            'permissions' => 'nullable|array',
            'permissions.*' => 'integer|exists:adm_events,id',
        ]);
    }

    /**
     * Only super administrators may change a super administrator profile.
     */
    protected function authorizeProfileChange(Request $request, Profile $profile): void
    {
        abort_if($profile->sa && ! $request->user()->isSuperAdmin(), 403);
    }
}
