<?php

namespace App\Http\Middleware;

use App\Models\AdmMenu;
use App\Support\FrontCache;
use App\Support\SocialLinks;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user(),
                'permissions' => fn (): ?array => $request->user()?->canAccessAdmin() ? [
                    'super_admin' => $request->user()->isSuperAdmin(),
                    'modules' => $request->user()->adminPermissions(),
                ] : null,
            ],
            'ziggy' => fn (): array => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'adm_menu' => fn (): array => $this->adminMenu($request),
            'menus' => fn (): array => FrontCache::menus(),
            'layout_settings' => fn (): array => FrontCache::layoutSettings(),
            'social_links' => fn (): array => SocialLinks::decode(FrontCache::layoutSettings()[SocialLinks::ALIAS] ?? null),
        ];
    }

    /**
     * Build the admin sidebar, limited to the modules the user may list.
     *
     * @return list<array<string, mixed>>
     */
    protected function adminMenu(Request $request): array
    {
        $user = $request->user();
        if (! $user?->canAccessAdmin()) {
            return [];
        }

        $groups = AdmMenu::with('modules')
            ->where('visible', true)
            ->orderBy('position', 'asc')
            ->get();

        $adm_menu = [];
        foreach ($groups as $group) {
            $items = [];
            foreach ($group->modules as $module) {
                $key = $module->key();
                if ($key !== 'admin' && ($key === null || ! $user->hasAdminPermission($key))) {
                    continue;
                }
                $items[] = ['id' => $module->id, 'title' => $module->name, 'description' => $module->description, 'url' => $module->url, 'icon' => $module->icon];
            }

            if ($items !== []) {
                $adm_menu[] = ['id' => $group->id, 'title' => $group->name, 'items' => $items];
            }
        }

        return $adm_menu;
    }
}
