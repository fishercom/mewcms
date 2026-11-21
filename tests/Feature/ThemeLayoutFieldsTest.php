<?php

use App\Models\CmsConfig;
use App\Models\CmsSite;
use App\Models\Profile;
use App\Models\User;
use App\Support\Sites;
use App\Support\Themes;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $profile = Profile::create(['name' => 'Super Admin', 'sa' => 1, 'active' => 1]);
    $this->user = User::create([
        'username' => 'testadmin',
        'name' => 'Test Admin',
        'email' => 'admin@test.com',
        'password' => bcrypt('password'),
        'profile_id' => $profile->id,
        'active' => 1,
    ]);

    // An uploaded theme that declares its own layout settings
    Themes::$uploadRoot = sys_get_temp_dir().'/mewcms-themes-'.uniqid();
    File::ensureDirectoryExists(Themes::uploadPath('aurora'));
    File::put(Themes::uploadPath('aurora', 'theme.json'), json_encode([
        'name' => 'Aurora',
        'layout_fields' => [
            ['alias' => 'whatsapp', 'name' => 'WhatsApp', 'type' => 'text', 'help' => 'El número o el enlace wa.me', 'group' => 'Contacto'],
            ['alias' => 'layout_address', 'name' => 'Dirección', 'type' => 'textarea', 'group' => 'Contacto'],
            ['alias' => 'layout_banner', 'name' => 'Banner', 'type' => 'image'],
            ['alias' => 'layout_shop_url', 'name' => 'Tienda', 'type' => 'url'],
            // Left out: a setting the screen already edits, a repeated alias, a bad alias, no alias
            ['alias' => 'layout_copyright', 'name' => 'Copyright'],
            ['alias' => 'whatsapp', 'name' => 'Otra vez'],
            ['alias' => 'Mal alias!', 'name' => 'Malo'],
            ['name' => 'Sin alias'],
        ],
    ]));
    Themes::flush();
});

afterEach(function (): void {
    File::deleteDirectory(Themes::uploadPath());
    Themes::$uploadRoot = null;
    Themes::flush();
});

it('reads the layout fields a theme declares, with only valid ones', function (): void {
    $fields = Themes::all()['aurora']['layout_fields'];

    expect(array_column($fields, 'alias'))->toBe(['layout_whatsapp', 'layout_address', 'layout_banner', 'layout_shop_url'])
        ->and($fields[0])->toMatchArray(['name' => 'WhatsApp', 'type' => 'text', 'help' => 'El número o el enlace wa.me', 'group' => 'Contacto'])
        ->and($fields[1]['type'])->toBe('textarea')
        ->and(Themes::all()['default']['layout_fields'])->toBe([]);
});

it('shows the theme fields and the site\'s other layout settings in the customizer', function (): void {
    $site = CmsSite::create(['name' => 'Aurora', 'domains' => ['aurora.test'], 'theme' => 'aurora', 'active' => true]);
    CmsConfig::create(['site_id' => $site->id, 'type' => 'string', 'name' => 'WhatsApp', 'alias' => 'layout_whatsapp', 'value' => '51999999999']);
    // A parameter added for this site only, not declared by the theme
    CmsConfig::create(['site_id' => $site->id, 'type' => 'string', 'name' => 'Horario', 'alias' => 'layout_hours', 'value' => 'L-V 9 a 6']);
    // Edited elsewhere on the screen, or another site's: never listed
    CmsConfig::create(['site_id' => $site->id, 'type' => 'json', 'name' => 'Redes sociales', 'alias' => 'layout_social_links', 'value' => '[]']);
    $other = CmsSite::create(['name' => 'Otro', 'domains' => ['otro.test'], 'theme' => 'default', 'active' => true]);
    CmsConfig::create(['site_id' => $other->id, 'type' => 'string', 'name' => 'Ajeno', 'alias' => 'layout_other', 'value' => 'x']);

    $this->actingAs($this->user)->get('http://aurora.test/admin/layout')
        ->assertOk()
        ->assertInertia(fn (Assert $page): Assert => $page
            ->where('themeName', 'Aurora')
            ->where('themeFields', fn ($fields): bool => collect($fields)->pluck('alias')->all() === ['layout_whatsapp', 'layout_address', 'layout_banner', 'layout_shop_url', 'layout_hours'])
            ->where('themeFields.4.group', 'Otros parámetros')
            ->where('settings.layout_whatsapp', '51999999999'));
});

it('saves the theme fields for the current site only, as plain text or safe addresses', function (): void {
    $site = CmsSite::create(['name' => 'Aurora', 'domains' => ['aurora.test'], 'theme' => 'aurora', 'active' => true]);

    $this->actingAs($this->user)->post('http://aurora.test/admin/layout', [
        'layout_whatsapp' => '<b>51 962 769 835</b>',
        'layout_address' => "Av. Néstor Gambeta 8585\nCallao",
        'layout_banner' => '/storage/media/banner.jpg',
        'layout_shop_url' => 'https://tienda.test',
    ])->assertRedirect();

    expect(Sites::as($site, fn () => CmsConfig::forSite('layout_%')))->toMatchArray([
        'layout_whatsapp' => '51 962 769 835',
        'layout_address' => "Av. Néstor Gambeta 8585\nCallao",
        'layout_banner' => '/storage/media/banner.jpg',
        'layout_shop_url' => 'https://tienda.test',
    ])
        ->and(CmsConfig::where('alias', 'layout_whatsapp')->first())->site_id->toBe($site->id)->name->toBe('WhatsApp')
        ->and(CmsConfig::where('alias', 'layout_address')->value('type'))->toBe('text');

    $this->actingAs($this->user)->post('http://aurora.test/admin/layout', ['layout_shop_url' => 'javascript:alert(1)'])
        ->assertSessionHasErrors('layout_shop_url');
});

it('saves a site\'s own extra setting and ignores fields nobody declared', function (): void {
    $site = CmsSite::create(['name' => 'Aurora', 'domains' => ['aurora.test'], 'theme' => 'aurora', 'active' => true]);
    CmsConfig::create(['site_id' => $site->id, 'type' => 'string', 'name' => 'Horario', 'alias' => 'layout_hours', 'value' => '']);

    $this->actingAs($this->user)->post('http://aurora.test/admin/layout', [
        'layout_hours' => 'L-V 9 a 6',
        'layout_invented' => 'nope',
    ])->assertRedirect();

    expect(CmsConfig::where('alias', 'layout_hours')->value('value'))->toBe('L-V 9 a 6')
        ->and(CmsConfig::where('alias', 'layout_invented')->exists())->toBeFalse();
});
