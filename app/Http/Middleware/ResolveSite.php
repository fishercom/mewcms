<?php

namespace App\Http\Middleware;

use App\Support\Sites;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveSite
{
    /**
     * Set the site this request works on: by domain on the public site, by the site
     * switcher in the admin (see Sites::resolve).
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        Sites::set(Sites::resolve($request));

        return $next($request);
    }
}
