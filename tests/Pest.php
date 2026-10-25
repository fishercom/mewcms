<?php

use App\Models\AdmAction;
use App\Models\AdmEvent;
use App\Models\AdmMenu;
use App\Models\AdmModule;
use App\Models\AdmPermission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test functions is always bound to a specific PHPUnit test
| case class. By default, that class is "PHPUnit\Framework\TestCase". Of course, you may
| need to change it using the "pest()" function to bind a different classes or traits.
|
*/

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
|
| When you're writing tests, you often need to check that values meet certain conditions. The
| "expect()" function gives you access to a set of "expectations" methods that you can use
| to assert different things. Of course, you may extend the Expectation API at any time.
|
*/

expect()->extend('toBeOne', fn () => $this->toBe(1));

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
|
| While Pest is very powerful out-of-the-box, you may have some testing code specific to your
| project that you don't want to repeat in every file. Here you can also expose helpers as
| global functions to help you to reduce the number of lines of code in your test files.
|
*/

/**
 * Grant admin module permissions to a user's profile, e.g. ['articles' => 'administrar'].
 *
 * @param  array<string, string>  $permissions
 */
function grantPermissions(User $user, array $permissions): void
{
    $menu = AdmMenu::where('name', 'Test')->first()
        ?? AdmMenu::forceCreate(['name' => 'Test', 'position' => 0, 'visible' => true]);

    foreach ($permissions as $moduleKey => $actionAlias) {
        $module = AdmModule::where('route', $moduleKey.'.index')->first()
            ?? AdmModule::forceCreate([
                'menu_id' => $menu->id,
                'name' => ucfirst($moduleKey),
                'url' => '/admin/'.$moduleKey,
                'route' => $moduleKey.'.index',
                'position' => 0,
                'visible' => true,
            ]);

        $action = AdmAction::where('alias', $actionAlias)->first()
            ?? AdmAction::forceCreate(['name' => $actionAlias, 'alias' => $actionAlias, 'write_log' => true]);

        $event = AdmEvent::firstOrCreate(['module_id' => $module->id, 'action_id' => $action->id]);

        AdmPermission::firstOrCreate(['profile_id' => $user->profile_id, 'event_id' => $event->id]);
    }
}
