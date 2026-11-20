<?php

use App\Models\AdmAction;
use App\Models\AdmEvent;
use App\Models\AdmLog;
use App\Models\AdmModule;
use App\Models\AdmPermission;
use App\Models\CmsConfig;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('no longer has the generic Configuración page', function (): void {
    $this->actingAs(User::factory()->superAdmin()->create())->get('/admin/configs')->assertNotFound();
});

it('removes the module and its permissions, moving its log history to Personalizar Layout', function (): void {
    $user = User::factory()->create();
    grantPermissions($user, ['configs' => 'administrar', 'layout' => 'administrar']);

    $configs = AdmModule::where('route', 'configs.index')->firstOrFail();
    $configsEvent = AdmEvent::where('module_id', $configs->id)->firstOrFail();
    $log = AdmLog::create(['event_id' => $configsEvent->id, 'user_id' => $user->id, 'comment' => 'Actualizado en Configuración: #1']);
    CmsConfig::create(['alias' => 'layout_copyright', 'name' => 'Copyright', 'type' => 'string', 'value' => '© EMSAL']);

    (require database_path('migrations/2026_11_20_300000_remove_configs_module.php'))->up();

    $layoutEvent = AdmEvent::where('module_id', AdmModule::where('route', 'layout.index')->value('id'))
        ->where('action_id', AdmAction::where('alias', 'administrar')->value('id'))
        ->value('id');

    expect(AdmModule::where('route', 'configs.index')->exists())->toBeFalse()
        ->and(AdmEvent::where('module_id', $configs->id)->exists())->toBeFalse()
        ->and(AdmPermission::where('event_id', $configsEvent->id)->exists())->toBeFalse()
        ->and($log->fresh()->event_id)->toBe($layoutEvent)
        // The settings themselves stay
        ->and(CmsConfig::where('alias', 'layout_copyright')->value('value'))->toBe('© EMSAL');
});
