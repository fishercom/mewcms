<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Redirector;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * Show the user's User settings page.
     */
    public function index(Request $request): Response
    {
        $s = $request->get('s');

        $profiles = Profile::all();

        $items = User::select()
            ->where(function ($query) use ($s): void {
                if (! empty($s)) {
                    $query->where('name', 'LIKE', '%'.str_replace(' ', '%', $s).'%');
                }
            })
            ->paginate(15);

        return Inertia::render('admin/users/index', [
            'items' => $items,
            'profiles' => $profiles,
        ]);
    }

    public function create()
    {
        $profiles = Profile::all();

        return Inertia::render('admin/users/create', [
            'profiles' => $profiles,
        ]);
    }

    public function store(Request $request): Redirector|RedirectResponse
    {
        $User = new User($this->validatedData($request));
        $User->save();

        return redirect('admin/users');
    }

    /**
     * Show the user's User settings page.
     */
    public function edit($id, Request $request): Response
    {
        $item = User::find($id);
        $profiles = Profile::all();

        return Inertia::render('admin/users/edit', [
            'item' => $item,
            'profiles' => $profiles,
        ]);
    }

    /**
     * Update the user's User settings.
     */
    public function update($id, Request $request): RedirectResponse
    {
        $item = User::findOrFail($id);
        $item->fill($this->validatedData($request, $item));
        $item->save();

        return redirect('admin/users');
    }

    /**
     * Delete the user's account.
     */
    public function destroy($id, Request $request): RedirectResponse
    {
        $item = User::findOrFail($id);
        $this->authorizeSuperAdminChange($request, $item);
        abort_if($item->is($request->user()), 422, 'No puede eliminar su propia cuenta.');
        $item->delete();

        return redirect('admin/users');
    }

    /**
     * @return array<string, mixed>
     */
    protected function validatedData(Request $request, ?User $user = null): array
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'lastname' => 'nullable|string|max:255',
            'username' => 'nullable|string|max:255',
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user?->id)],
            'password' => [$user ? 'nullable' : 'required', 'string', Password::defaults()],
            'profile_id' => 'nullable|integer|exists:profiles,id',
            'metadata' => 'nullable|array',
            'active' => 'nullable|boolean',
        ]);

        $this->authorizeSuperAdminChange($request, $user, $data['profile_id'] ?? null);

        if (empty($data['password'])) {
            unset($data['password']);
        }

        return $data;
    }

    /**
     * Only super administrators may create, edit or remove super administrators.
     */
    protected function authorizeSuperAdminChange(Request $request, ?User $target, ?int $profileId = null): void
    {
        if ($request->user()->isSuperAdmin()) {
            return;
        }

        $grantsSuperAdmin = $profileId !== null && (bool) Profile::find($profileId)?->sa;
        $touchesSuperAdmin = (bool) $target?->profile?->sa;

        abort_if($grantsSuperAdmin || $touchesSuperAdmin, 403);
    }
}
