<?php

namespace App\Http\Middleware;

use App\Support\Locales;
use App\Support\Sites;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Public addresses of a site's extra languages start with the language code
 * ("/en/about"). Before routing, the code is taken off the address, so the same routes
 * serve every language, and kept on the request for Locales. The main language has no
 * prefix: "/es/nosotros" on a Spanish site redirects to "/nosotros".
 */
class ResolveLocale
{
    /**
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (Sites::isAdminRequest($request) || $request->is('api/*', 'build/*', 'storage/*', 'preview/*', 'up')) {
            return $next($request);
        }

        $site = Sites::forHost($request->getHost()) ?? Sites::default();
        if (! $site || ! Locales::multiple($site)) {
            return $next($request);
        }

        $path = $request->getPathInfo();
        [$first, $rest] = array_pad(explode('/', ltrim($path, '/'), 2), 2, '');

        // The main language has no prefix
        $main = Locales::main($site);
        if ($main && strtolower($first) === Locales::segment($main) && $request->isMethod('GET')) {
            $query = $request->getQueryString();

            return redirect('/'.$rest.($query ? '?'.$query : ''), 301);
        }

        $lang = Locales::fromPath($site, $path);
        if ($lang) {
            $this->stripPrefix($request, '/'.$rest);
            $request->attributes->set(Locales::ATTRIBUTE, $lang->id);
        }

        return $next($request);
    }

    /**
     * Serve the request as if it had been made to $path (the query string is kept).
     */
    protected function stripPrefix(Request $request, string $path): void
    {
        $original = $request->getRequestUri();
        $query = $request->getQueryString();

        $server = $request->server->all();
        $server['REQUEST_URI'] = $request->getBaseUrl().$path.($query !== null ? '?'.$query : '');

        $request->initialize(
            $request->query->all(),
            $request->request->all(),
            $request->attributes->all(),
            $request->cookies->all(),
            $request->files->all(),
            $server,
            $request->getContent(),
        );

        $request->attributes->set(Locales::ORIGINAL_URI, $original);
    }
}
