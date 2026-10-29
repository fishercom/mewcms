<?php

use App\Models\CmsSchema;
use App\Models\CmsSite;
use App\Support\Sites;
use App\Support\Themes;
use Illuminate\Support\Facades\File;

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

it('reads the screenshot of each theme', function (): void {
    expect(Themes::all()['default']['screenshot'])->toBeTrue()
        ->and(Themes::all()['default']['uploaded'])->toBeFalse()
        ->and(Themes::layout('editorial'))->toBe('editorial');
});

describe('uploaded themes', function (): void {
    beforeEach(function (): void {
        $this->themeDir = Themes::uploadPath('aurora');
        File::ensureDirectoryExists($this->themeDir.'/css');
        File::ensureDirectoryExists($this->themeDir.'/js');
        File::put($this->themeDir.'/css/main.css', 'body { color: red }');
        File::put($this->themeDir.'/js/menu.js', 'console.log(1)');
        File::put($this->themeDir.'/theme.json', json_encode([
            'name' => 'Aurora',
            'version' => '1.0.0',
            'layout' => 'editorial',
            'styles' => [
                'css/main.css',
                ['href' => 'https://fonts.bunny.net/css?family=lora:400', 'media' => 'screen'],
                'css/missing.css',
                '../../../../.env',
                'js/menu.js',
                'http://insecure.test/a.css',
            ],
            'scripts' => [
                ['src' => 'js/menu.js', 'position' => 'head', 'defer' => true],
                'javascript:alert(1)',
            ],
        ]));
        Themes::flush();
    });

    afterEach(function (): void {
        File::deleteDirectory(Themes::uploadPath());
        Themes::flush();
    });

    it('lists them after the built themes, with only safe files', function (): void {
        $theme = Themes::all()['aurora'];

        expect(array_key_last(Themes::all()))->toBe('aurora')
            ->and($theme['uploaded'])->toBeTrue()
            ->and($theme['layout'])->toBe('editorial')
            ->and($theme['styles'])->toHaveCount(2)
            ->and($theme['styles'][0]['href'])->toStartWith('/storage/themes/aurora/css/main.css?v=')
            ->and($theme['styles'][1])->toBe(['href' => 'https://fonts.bunny.net/css?family=lora:400', 'media' => 'screen'])
            ->and($theme['scripts'])->toHaveCount(1)
            ->and($theme['scripts'][0])->toMatchArray(['position' => 'head', 'defer' => true, 'async' => false]);
    });

    it('uses the pages and stylesheet of its layout', function (): void {
        expect(Themes::pageFile('front/templates/page', 'aurora'))->toBe('resources/themes/default/front/templates/page.tsx')
            ->and(Themes::styleFile('aurora'))->toBe('resources/themes/editorial/css/theme.css');
    });

    it('falls back to the default layout when it names an unknown one', function (): void {
        File::put($this->themeDir.'/theme.json', json_encode(['name' => 'Aurora', 'layout' => 'aurora']));
        Themes::flush();

        expect(Themes::layout('aurora'))->toBe('default');
    });
});
