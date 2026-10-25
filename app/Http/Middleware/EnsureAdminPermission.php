<?php

namespace App\Http\Middleware;

use App\Models\AdmAction;
use App\Models\AdmModule;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Enforce profile permissions on admin routes.
 *
 * The module is derived from the route name ("articles.edit" => "articles") unless
 * passed explicitly ("admin.permission:media"). Safe requests need the list action;
 * forms and writes need the manage action.
 */
class EnsureAdminPermission
{
    /**
     * Route name suffixes that open a form or change data, even over GET.
     */
    protected const MANAGE_ROUTES = [
        'create',
        'edit',
        // Laravel File Manager uses GET for several write operations
        'upload',
        'getAddfolder',
        'getDelete',
        'getRename',
        'move',
        'doMove',
        'getResize',
        'performResize',
        'performResizeNew',
        'getCrop',
        'getCropImage',
        'getNewCropImage',
    ];

    public function handle(Request $request, Closure $next, ?string $module = null): Response
    {
        $user = $request->user();
        abort_unless($user?->canAccessAdmin(), 403);

        $routeName = (string) $request->route()?->getName();
        $module ??= AdmModule::keyFromRouteName($routeName);

        abort_if($module === null || ! $user->hasAdminPermission($module, $this->requiredAction($request, $routeName)), 403);

        return $next($request);
    }

    protected function requiredAction(Request $request, string $routeName): string
    {
        if (! $request->isMethodSafe()) {
            return AdmAction::MANAGE;
        }

        return in_array(Str::afterLast($routeName, '.'), self::MANAGE_ROUTES, true) ? AdmAction::MANAGE : AdmAction::LIST;
    }
}
