<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Allow only users with an active admin profile into the admin panel.
 */
class EnsureAdminAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless($request->user()?->canAccessAdmin(), 403);

        return $next($request);
    }
}
