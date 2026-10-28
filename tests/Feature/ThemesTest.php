<?php

use App\Models\CmsSchema;
use App\Models\CmsSite;
use App\Support\Sites;
use App\Support\Themes;

it('lists the installed themes, default first', function (): void {
    $themes = Themes::all();

    expect(array_key_first($themes))->toBe('default')
        ->and($themes)->toHaveKey('editorial')
        ->and($themes['editorial']['name'])->toBe('Editorial');
});

it('takes a page from the theme, or from the default theme when it has none', function (): void {
    expect(Themes::pageFile('front/templates/page', 'default'))->toBe('resources/themes/default/front/templates/page.tsx')
        ->and(Themes::pageFile('front/templates/page', 'editorial'))->toBe('resources/themes/default/front/templates/page.tsx')
        ->and(Themes::pageFile('admin/sites/index', 'editorial'))->toBe('resources/js/pages/admin/sites/index.tsx');

    foreach (['default', 'editorial'] as $theme) {
        expect(base_path(Themes::pageFile('front/layout', $theme)))->toBeFile();
    }
});

it('gives each theme its own stylesheet', function (): void {
    expect(Themes::styleFile('default'))->toBe('resources/themes/default/css/theme.css')
        ->and(Themes::styleFile('editorial'))->toBe('resources/themes/editorial/css/theme.css')
        ->and(Themes::styleFile('missing'))->toBe('resources/themes/default/css/theme.css');
});

it('uses the current site\'s theme, and the default theme without a site', function (): void {
    expect(Themes::current())->toBe('default');

    $site = CmsSite::create(['name' => 'B', 'domains' => ['b.test'], 'theme' => 'editorial', 'active' => true]);
    expect(Sites::as($site, fn () => Themes::current()))->toBe('editorial');
});

it('falls back to the default theme when a site names a missing one', function (): void {
    $site = CmsSite::create(['name' => 'B', 'domains' => ['b.test'], 'theme' => 'missing', 'active' => true]);

    expect($site->theme)->toBe('default');
});

it('offers the page templates of the default theme', function (): void {
    $values = array_column(CmsSchema::getAvailableTemplates(), 'value');

    expect($values)->toContain('front/templates/page', 'front/templates/home');
});

it('reads the settings and screenshot of each theme', function (): void {
    $default = Themes::all()['default'];

    expect($default['screenshot'])->toBeTrue()
        ->and(array_column($default['settings'], 'key'))->toBe(['accent', 'accent_dark', 'font'])
        ->and($default['settings'][0])->toMatchArray(['type' => 'color', 'css' => '--site-accent', 'default' => '#f53003']);
});

it('keeps only valid theme settings', function (): void {
    expect(Themes::cleanSettings('default', [
        'accent' => '#00AA00',
        'accent_dark' => 'red; } body { display: none',
        'font' => 'serif',
        'unknown' => '#ffffff',
    ]))->toBe(['accent' => '#00aa00', 'font' => 'serif'])
        ->and(Themes::cleanSettings('default', ['font' => 'comic-sans']))->toBe([]);
});

it('turns a site\'s settings into CSS variables, with the theme defaults for the rest', function (): void {
    $css = Themes::cssVariables('default', ['accent' => '#00aa00', 'font' => 'mono']);

    expect($css)->toContain('--site-accent: #00aa00;')
        ->and($css)->toContain('--site-accent-dark: #ff4433;')
        ->and($css)->toContain('--site-font: ui-monospace')
        ->and($css)->not->toContain('<');
});

it('cleans the settings when a site is saved', function (): void {
    $site = CmsSite::create(['name' => 'B', 'domains' => ['b.test'], 'theme' => 'editorial', 'theme_settings' => ['accent' => '#123456', 'font' => 'nope'], 'active' => true]);

    expect($site->fresh()->theme_settings)->toBe(['accent' => '#123456']);
});
