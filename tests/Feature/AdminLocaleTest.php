<?php

use App\Blocks\BlockRegistry;
use App\Models\AdmMenu;
use App\Models\AdmModule;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

/**
 * @return array<string, string>
 */
function dictionary(string $locale): array
{
    return json_decode(file_get_contents(lang_path($locale.'.json')), true, flags: JSON_THROW_ON_ERROR);
}

test('both dictionaries have the same texts', function (): void {
    expect(array_keys(dictionary('en')))->toEqualCanonicalizing(array_keys(dictionary('es')));
});

test('translations keep every placeholder of their text', function (string $locale): void {
    foreach (dictionary($locale) as $text => $translation) {
        preg_match_all('/:[a-z_]+/', $text, $placeholders);
        foreach ($placeholders[0] as $placeholder) {
            expect(str_contains($translation, $placeholder))->toBeTrue("\"{$translation}\" lost {$placeholder}");
        }
    }
})->with(['en', 'es']);

test('the admin is in Spanish by default', function (): void {
    $this->actingAs(User::factory()->superAdmin()->create());

    $this->get('/admin')
        ->assertOk()
        ->assertSee('<html lang="es"', false)
        ->assertInertia(fn (Assert $page): Assert => $page->where('locale', 'es'));
});

test('the language chosen in Apariencia switches the admin to English', function (): void {
    $this->actingAs(User::factory()->superAdmin()->create());
    $menu = AdmMenu::forceCreate(['name' => 'Contenido', 'position' => 0, 'visible' => true]);
    AdmModule::forceCreate(['menu_id' => $menu->id, 'name' => 'Páginas', 'url' => '/admin/articles', 'route' => 'articles.index', 'position' => 0, 'visible' => true]);

    $this->withUnencryptedCookie('locale', 'en')
        ->get('/admin')
        ->assertOk()
        ->assertSee('<html lang="en"', false)
        ->assertInertia(fn (Assert $page): Assert => $page
            ->where('locale', 'en')
            ->where('adm_menu.0.title', 'Content')
            ->where('adm_menu.0.items.0.title', 'Pages'));
});

test('an unknown language is ignored', function (): void {
    $this->actingAs(User::factory()->superAdmin()->create());

    $this->withUnencryptedCookie('locale', 'fr')
        ->get('/admin')
        ->assertInertia(fn (Assert $page): Assert => $page->where('locale', 'es'));
});

test('block names and field labels follow the admin language', function (): void {
    app()->setLocale('en');

    $hero = collect(BlockRegistry::definitions())->firstWhere('key', 'hero');

    expect($hero['name'])->toBe('Hero')
        ->and(collect($hero['fields'])->firstWhere('key', 'image')['label'])->toBe('Background image')
        ->and(collect($hero['fields'])->firstWhere('key', 'align')['options'][0]['label'])->toBe('Left');
});
