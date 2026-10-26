<?php

use App\Models\AdmLog;
use App\Models\CmsArticle;
use App\Models\CmsConfig;
use App\Models\CmsLang;
use App\Models\User;
use App\Support\SocialLinks;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Testing\TestResponse;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->admin = User::factory()->superAdmin()->create();
});

function saveSocialLinks(array $links): TestResponse
{
    return test()->actingAs(test()->admin)->post('/admin/layout', ['social_links' => $links, 'social_links_managed' => true]);
}

it('saves the links in order, normalising e-mail, phone and bare domains', function (): void {
    grantPermissions($this->admin, ['layout' => 'administrar']);

    saveSocialLinks([
        ['network' => 'whatsapp', 'url' => 'https://wa.me/51999888777', 'label' => ''],
        ['network' => 'email', 'url' => 'hola@mewcms.test', 'label' => 'Escríbenos'],
        ['network' => 'phone', 'url' => '+51 (1) 555-0100', 'label' => ''],
        ['network' => 'instagram', 'url' => 'instagram.com/mewcms', 'label' => ''],
    ])->assertSessionHasNoErrors()->assertRedirect('/admin/layout');

    expect(SocialLinks::all())->toBe([
        ['network' => 'whatsapp', 'url' => 'https://wa.me/51999888777', 'label' => ''],
        ['network' => 'email', 'url' => 'mailto:hola@mewcms.test', 'label' => 'Escríbenos'],
        ['network' => 'phone', 'url' => 'tel:+5115550100', 'label' => ''],
        ['network' => 'instagram', 'url' => 'https://instagram.com/mewcms', 'label' => ''],
    ])->and(AdmLog::where('comment', 'like', 'Actualizado en Layout: logos, textos y redes sociales (4 enlaces)')->exists())->toBeTrue();

    $this->actingAs($this->admin)->get('/admin/layout')->assertInertia(fn (Assert $p): Assert => $p
        ->where('socialLinks.1.url', 'mailto:hola@mewcms.test')
    );

    // Removing every link empties the list
    saveSocialLinks([])->assertSessionHasNoErrors();
    expect(SocialLinks::all())->toBe([]);
});

it('rejects script urls, unknown networks and missing addresses', function (string $network, string $url, string $field): void {
    saveSocialLinks([['network' => 'facebook', 'url' => 'https://facebook.com/ok'], ['network' => $network, 'url' => $url]])
        ->assertSessionHasErrors("social_links.1.{$field}");

    expect(SocialLinks::all())->toBe([]);
})->with([
    'javascript' => ['x', 'javascript:alert(1)', 'url'],
    'data' => ['website', 'data:text/html,hi', 'url'],
    'unknown network' => ['myspace', 'https://myspace.com', 'network'],
    'empty' => ['github', '', 'url'],
]);

it('drops unsafe links even when written to the setting directly', function (): void {
    CmsConfig::where('alias', SocialLinks::ALIAS)->update(['value' => json_encode([
        ['network' => 'x', 'url' => 'javascript:alert(1)'],
        ['network' => 'youtube', 'url' => 'https://youtube.com/@mewcms'],
    ])]);

    expect(SocialLinks::all())->toBe([['network' => 'youtube', 'url' => 'https://youtube.com/@mewcms', 'label' => '']]);
});

it('converts the old fixed settings and keeps them', function (): void {
    DB::table('cms_configs')->where('alias', SocialLinks::ALIAS)->delete();
    $legacy = ['layout_facebook' => 'https://facebook.com/a', 'layout_instagram' => '', 'layout_twitter' => 'https://twitter.com/a', 'layout_linkedin' => null, 'layout_youtube' => 'https://youtube.com/a'];
    foreach ($legacy as $alias => $value) {
        DB::table('cms_configs')->insert(['type' => 'string', 'name' => $alias, 'alias' => $alias, 'value' => $value]);
    }

    (require database_path('migrations/2026_10_29_100000_add_social_links_setting.php'))->up();

    expect(SocialLinks::all())->toBe([
        ['network' => 'facebook', 'url' => 'https://facebook.com/a', 'label' => ''],
        ['network' => 'x', 'url' => 'https://twitter.com/a', 'label' => ''],
        ['network' => 'youtube', 'url' => 'https://youtube.com/a', 'label' => ''],
    ])->and(DB::table('cms_configs')->where('alias', 'layout_facebook')->value('value'))->toBe('https://facebook.com/a');

    // Running it again leaves the list alone
    SocialLinks::save([]);
    (require database_path('migrations/2026_10_29_100000_add_social_links_setting.php'))->up();
    expect(SocialLinks::all())->toBe([]);
});

it('shares the links with the public site', function (): void {
    CmsArticle::create(['lang_id' => CmsLang::create(['name' => 'Español', 'iso' => 'es', 'active' => true])->id, 'title' => 'Inicio', 'slug' => 'home', 'active' => true]);
    SocialLinks::save([['network' => 'tiktok', 'url' => 'https://tiktok.com/@mewcms', 'label' => '']]);

    $this->get('/home')->assertInertia(fn (Assert $p): Assert => $p
        ->where('social_links', [['network' => 'tiktok', 'url' => 'https://tiktok.com/@mewcms', 'label' => '']])
    );

    // Saving flushes the cached copy
    saveSocialLinks([['network' => 'github', 'url' => 'https://github.com/mewcms']]);
    $this->get('/home')->assertInertia(fn (Assert $p): Assert => $p->where('social_links.0.network', 'github'));
});

it('requires the manage permission to change the links', function (): void {
    $reader = User::factory()->create();
    grantPermissions($reader, ['layout' => 'listar']);

    $this->actingAs($reader)->post('/admin/layout', ['social_links' => [['network' => 'x', 'url' => 'https://x.com/a']]])->assertForbidden();
    expect(SocialLinks::all())->toBe([]);
});
