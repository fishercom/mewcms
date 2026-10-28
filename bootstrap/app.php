<?php

use App\Http\Middleware\EnsureAdminAccess;
use App\Http\Middleware\EnsureAdminPermission;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\HandleLocale;
use App\Http\Middleware\ResolveSite;
use App\Models\CmsRedirect;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->trustProxies(at: '*');

        $middleware->encryptCookies(except: ['appearance', 'locale']);

        // The site is known before route model binding, so bound models are scoped to it
        $middleware->prependToPriorityList(SubstituteBindings::class, ResolveSite::class);

        $middleware->alias([
            'admin.access' => EnsureAdminAccess::class,
            'admin.permission' => EnsureAdminPermission::class,
        ]);

        $middleware->web(append: [
            ResolveSite::class,
            HandleAppearance::class,
            HandleLocale::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Before a public 404, look for a redirect (moved pages, manual redirects)
        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if (! $request->isMethod('GET') || $request->is('admin', 'admin/*', 'api/*')) {
                return null;
            }

            $redirect = rescue(fn () => CmsRedirect::match('/'.$request->path()), null, false);

            return $redirect ? redirect($redirect->to_path, $redirect->status_code) : null;
        });
    })->create();
