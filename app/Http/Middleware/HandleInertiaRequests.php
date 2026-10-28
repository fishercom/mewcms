<?php

namespace App\Http\Middleware;

use App\Ai\AiManager;
use App\Http\Controllers\FrontController;
use App\Models\AdmAction;
use App\Models\AdmMenu;
use App\Support\FrontCache;
use App\Support\Sites;
use App\Support\SocialLinks;
use App\Support\Themes;
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
        // Public pages and the admin load different stylesheets (each theme has its own),
        // so moving between them, or to another theme, reloads the whole page
        $isPublic = $request->route()?->getControllerClass() === FrontController::class;

        return parent::version($request).'|'.($isPublic ? 'theme:'.Themes::current() : 'admin');
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
            'locale' => app()->getLocale(),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user(),
                'permissions' => fn (): ?array => $request->user()?->canAccessAdmin() ? [
                    'super_admin' => $request->user()->isSuperAdmin(),
                    'modules' => $request->user()->adminPermissions(),
                ] : null,
            ],
            // The sparkle icon shows only to users with the assistant and a provider with a key
            'ai_assistant' => fn (): bool => (bool) $request->user()?->hasAdminPermission('ai', AdmAction::MANAGE)
                && app(AiManager::class)->enabled(),
            'ziggy' => fn (): array => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'adm_menu' => fn (): array => $this->adminMenu($request),
            'theme' => fn (): string => Themes::current(),
            'site' => fn (): ?array => Sites::current()?->summary(),
            // Sites the admin can switch between (see the site switcher)
            'sites' => fn (): array => $request->user()?->canAccessAdmin()
                ? Sites::all()->map(fn ($site): array => $site->only(['id', 'name', 'active']))->values()->all()
                : [],
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
                $items[] = ['id' => $module->id, 'title' => __($module->name), 'description' => $module->description ? __($module->description) : $module->description, 'url' => $module->url, 'icon' => $module->icon];
            }

            if ($items !== []) {
                $adm_menu[] = ['id' => $group->id, 'title' => __($group->name), 'items' => $items];
            }
        }

        return $adm_menu;
    }
}
