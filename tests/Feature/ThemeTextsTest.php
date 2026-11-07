<?php

use App\Models\AdmModule;
use App\Models\CmsLang;
use App\Models\CmsSite;
use App\Models\CmsTranslation;
use App\Models\User;
use App\Support\Sites;
use App\Support\Themes;
use App\Support\ThemeTexts;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function (): void {
    $this->es = CmsLang::create(['name' => 'Español', 'iso' => 'es', 'active' => 1]);
    $this->en = CmsLang::create(['name' => 'English', 'iso' => 'en', 'active' => 1]);
    $this->shop = CmsSite::create(['name' => 'Shop', 'domains' => ['shop.test'], 'theme' => 'velvet', 'lang_id' => $this->es->id, 'default' => true, 'active' => true]);
    $this->admin = User::factory()->superAdmin()->create();
});

it('looks a text up in the site language, then its base language, then English', function (): void {
    expect(ThemeTexts::localeChain('es-pe'))->toBe(['en', 'es', 'es-PE'])
        ->and(ThemeTexts::localeChain('en'))->toBe(['en'])
        ->and(ThemeTexts::normalizeLocale('pt_br'))->toBe('pt-BR')
        ->and(ThemeTexts::normalizeLocale('zh-hant-tw'))->toBe('zh-Hant-TW')
        ->and(ThemeTexts::normalizeLocale('<script>'))->toBe('en');

    // es-PE has no catalog: the Spanish texts are used
    expect(ThemeTexts::defaults('velvet', 'es-PE')['shop.from_price'])->toBe('desde :price');
});

it('lets a theme replace the shared texts of the default theme, language by language', function (): void {
    $es = ThemeTexts::defaults('velvet', 'es');
    $en = ThemeTexts::defaults('velvet', 'en');

    // Velvet's own wording wins over the default theme's
    expect($en['footer.contact'])->toBe('Visit the boutique')
        ->and($es['footer.contact'])->toBe('Visita la boutique')
        // Keys Velvet does not change come from the default theme
        ->and($es['gallery.close'])->toBe('Cerrar')
        ->and($en['gallery.close'])->toBe('Close');
});

it('shares the theme texts in the site language on public pages', function (): void {
    Sites::as($this->shop, fn () => CmsTranslation::create(['locale' => 'es', 'key' => 'footer.explore', 'value' => 'Descubre']));
    // A change in another language does not show on a Spanish site
    Sites::as($this->shop, fn () => CmsTranslation::create(['locale' => 'en', 'key' => 'footer.contact', 'value' => 'Come by']));

    $this->get('http://shop.test/search')->assertOk()->assertInertia(function (Assert $page): Assert {
        $texts = $page->toArray()['props']['texts'];

        expect($texts['footer.explore'])->toBe('Descubre')
            ->and($texts['footer.contact'])->toBe('Visita la boutique')
            ->and($texts['shop.from_price'])->toBe('desde :price');

        return $page->where('site.currency', 'USD');
    });
});

it('does not send the theme texts to admin pages', function (): void {
    $this->actingAs($this->admin)->get('/admin/sites')->assertOk()
        ->assertInertia(fn (Assert $page): Assert => $page->where('texts', []));
});

it('lists every text of the site theme with the theme text and the site change', function (): void {
    Sites::as($this->shop, fn () => CmsTranslation::create(['locale' => 'es', 'key' => 'footer.explore', 'value' => 'Descubre']));
    Sites::as($this->shop, fn () => CmsTranslation::create(['locale' => 'es', 'key' => 'old.alias', 'value' => 'Viejo']));

    $this->actingAs($this->admin)->get('/admin/translations')->assertOk()->assertInertia(function (Assert $page): Assert {
        $items = collect($page->toArray()['props']['items'])->keyBy('key');

        expect($items['footer.explore'])->toMatchArray(['default' => 'Explorar', 'value' => 'Descubre', 'missing' => false, 'unused' => false, 'group' => 'footer'])
            ->and($items['shop.from_price'])->toMatchArray(['default' => 'desde :price', 'value' => null])
            // Shared parts (forms, galleries) are listed too
            ->and($items->has('gallery.close'))->toBeTrue()
            ->and($items['old.alias'])->toMatchArray(['value' => 'Viejo', 'unused' => true]);

        return $page->component('admin/translations/index')->where('locale', 'es')->where('theme', 'Velvet Paw Boutique');
    });
});

it('saves the texts that differ from the theme and forgets the ones put back', function (): void {
    Sites::as($this->shop, fn () => CmsTranslation::create(['locale' => 'es', 'key' => 'footer.contact', 'value' => 'Ven a vernos']));

    $this->actingAs($this->admin)->put('/admin/translations', ['texts' => [
        ['key' => 'footer.explore', 'value' => 'Descubre'],
        // Same as the theme: nothing to keep
        ['key' => 'shop.from_price', 'value' => 'desde :price'],
        // Emptied: back to the theme's text
        ['key' => 'footer.contact', 'value' => ''],
    ]])->assertRedirect()->assertSessionHas('success');

    $rows = CmsTranslation::withoutGlobalScopes()->get(['site_id', 'locale', 'key', 'value'])->toArray();
    expect($rows)->toBe([['site_id' => $this->shop->id, 'locale' => 'es', 'key' => 'footer.explore', 'value' => 'Descubre']]);
});

it('only accepts keys made of dotted words', function (): void {
    $this->actingAs($this->admin)->put('/admin/translations', ['texts' => [['key' => 'Not a key', 'value' => 'x']]])
        ->assertSessionHasErrors('texts.0.key');
});

it('keeps each site texts apart', function (): void {
    $blog = CmsSite::create(['name' => 'Blog', 'domains' => ['blog.test'], 'theme' => 'journal', 'lang_id' => $this->es->id, 'active' => true]);
    $other = Sites::as($blog, fn () => CmsTranslation::create(['locale' => 'es', 'key' => 'footer.explore', 'value' => 'Del blog']));

    // The admin works on the shop (the default site): the blog's row is not reachable
    $this->actingAs($this->admin)->delete('/admin/translations/'.$other->id)->assertNotFound();
    expect(CmsTranslation::withoutGlobalScopes()->count())->toBe(1);
});

it('needs the translations permission', function (): void {
    $user = User::factory()->create();
    grantPermissions($user, ['translations' => 'listar']);

    $this->actingAs($user)->get('/admin/translations')->assertOk();
    $this->actingAs($user)->put('/admin/translations', ['texts' => [['key' => 'footer.explore', 'value' => 'x']]])->assertForbidden();
});

it('finds the keys used in theme pages', function (): void {
    expect(ThemeTexts::used('velvet'))->toContain('shop.from_price', 'form.submit', 'nav.open_menu')
        ->and(ThemeTexts::used('default'))->toContain('gallery.close', 'form.sending');
});

it('ships every built theme with a text for each key it uses', function (): void {
    expect(Artisan::call('cms:theme-texts'))->toBe(0);

    foreach (array_keys(array_filter(Themes::all(), fn (array $theme): bool => ! $theme['uploaded'])) as $theme) {
        foreach (glob(Themes::path($theme, 'lang/*.json')) as $file) {
            $locale = basename($file, '.json');
            $missing = array_diff(ThemeTexts::used($theme), array_keys(ThemeTexts::defaults($theme, $locale, false)));
            expect($missing)->toBe([], "{$theme}/lang/{$locale}.json lacks ".implode(', ', $missing));
        }
    }
});

it('keeps every placeholder of a text in its translations', function (): void {
    foreach (array_keys(Themes::all()) as $theme) {
        $en = ThemeTexts::defaults($theme, 'en');
        foreach (ThemeTexts::defaults($theme, 'es', false) as $key => $text) {
            preg_match_all('/:[a-z_]+/', $en[$key] ?? '', $placeholders);
            foreach ($placeholders[0] as $placeholder) {
                expect(str_contains($text, $placeholder))->toBeTrue("{$theme}: \"{$text}\" ({$key}) lost {$placeholder}");
            }
        }
    }
});

it('moves the old translations to the sites, per language, and drops the old table', function (): void {
    Schema::create('cms_translates', function (Blueprint $table): void {
        $table->increments('id');
        $table->string('alias');
        $table->tinyInteger('input_type')->unsigned();
        $table->json('metadata')->nullable();
        $table->timestamps();
    });
    DB::table('cms_translates')->insert(['alias' => 'footer.explore', 'input_type' => 1, 'metadata' => json_encode([['iso' => 'es', 'value' => 'Explora'], ['iso' => 'en', 'value' => 'Discover'], ['iso' => 'fr', 'value' => '']])]);
    $menu = DB::table('adm_menus')->insertGetId(['name' => 'Admin', 'position' => 0, 'visible' => true]);
    DB::table('adm_modules')->insert(['menu_id' => $menu, 'name' => 'Traducciones', 'url' => '/admin/translates', 'route' => 'translates.index', 'position' => 0, 'visible' => true]);

    (require database_path('migrations/2026_11_08_100000_create_cms_translations_table.php'))->up();

    expect(Schema::hasTable('cms_translates'))->toBeFalse()
        ->and(CmsTranslation::withoutGlobalScopes()->orderBy('locale')->get(['site_id', 'locale', 'key', 'value'])->toArray())->toBe([
            ['site_id' => $this->shop->id, 'locale' => 'en', 'key' => 'footer.explore', 'value' => 'Discover'],
            ['site_id' => $this->shop->id, 'locale' => 'es', 'key' => 'footer.explore', 'value' => 'Explora'],
        ])
        ->and(AdmModule::where('route', 'translations.index')->value('url'))->toBe('/admin/translations');
});

it('stores a site currency in capitals', function (): void {
    $this->shop->update(['currency' => 'pen']);

    expect($this->shop->fresh()->currency)->toBe('PEN')
        ->and($this->shop->fresh()->summary()['currency'])->toBe('PEN');
});
