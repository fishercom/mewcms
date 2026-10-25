<?php

namespace App\Support;

use Inertia\Ssr\HttpGateway;
use Inertia\Ssr\Response;

/**
 * Server-renders only public pages; the admin panel and account settings stay client-side.
 */
class PublicSsrGateway extends HttpGateway
{
    /**
     * @param  array<string, mixed>  $page
     */
    public function dispatch(array $page): ?Response
    {
        $component = (string) ($page['component'] ?? '');

        if (str_starts_with($component, 'admin') || str_starts_with($component, 'settings/') || str_starts_with($component, 'dashboard')) {
            return null;
        }

        return parent::dispatch($page);
    }
}
