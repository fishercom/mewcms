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
