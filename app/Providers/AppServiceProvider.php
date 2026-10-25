<?php

namespace App\Providers;

use App\Models\AdmAction;
use App\Support\AdminActivity;
use App\Support\PublicSsrGateway;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Inertia\Ssr\Gateway;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Only public pages are server-rendered
        $this->app->singleton(Gateway::class, PublicSsrGateway::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Event::listen(function (Login $event): void {
            AdminActivity::record('login', AdmAction::LOGIN, 'Inicio de sesión', userId: $event->user->getAuthIdentifier());
        });
        Event::listen(function (Logout $event): void {
            if ($event->user) {
                AdminActivity::record('login', AdmAction::LOGOUT, 'Cierre de sesión', userId: $event->user->getAuthIdentifier());
            }
        });

        // Public contact forms: limit spam bursts per visitor
        RateLimiter::for('form-submissions', fn (Request $request): array => [
            Limit::perMinute(5)->by($request->ip()),
            Limit::perDay(50)->by($request->ip()),
        ]);

        if (
            app()->environment('production') ||
            str_starts_with((string) config('app.url'), 'https://') ||
            (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https')
        ) {
            URL::forceScheme('https');
        }
    }
}
