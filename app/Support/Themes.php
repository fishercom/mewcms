<?php

namespace App\Support;

/**
 * Public site themes. Each theme is a folder in resources/themes/<slug> with:
 *
 * - theme.json      name, description, version, author
 * - css/theme.css   its stylesheet (its own Vite entry, so themes never share CSS)
 * - front/          its pages, named like the Inertia components ("front/templates/page")
 * - assets/         images and fonts, imported from its pages or CSS so Vite bundles them
 *
 * A theme only needs the pages it changes: any other page comes from the default theme.
 */
class Themes
{
    public const DEFAULT = 'default';

    /** @var array<string, array{slug: string, name: string, description: string, version: string, author: string}>|null */
    private static ?array $themes = null;

    public static function path(string $theme = self::DEFAULT, string $file = ''): string
    {
        return resource_path('themes/'.$theme.($file !== '' ? '/'.ltrim($file, '/') : ''));
    }

    /**
     * Installed themes, keyed by folder name.
     *
     * @return array<string, array{slug: string, name: string, description: string, version: string, author: string}>
     */
    public static function all(): array
    {
        if (self::$themes !== null) {
            return self::$themes;
        }

        $themes = [];
        foreach (glob(self::path('*').'/theme.json') ?: [] as $manifest) {
            $slug = basename(dirname($manifest));
            if (! preg_match('/^[a-z0-9_-]+$/', $slug)) {
                continue;
            }

            $info = json_decode((string) file_get_contents($manifest), true);
            $info = is_array($info) ? $info : [];

            $themes[$slug] = [
                'slug' => $slug,
                'name' => (string) ($info['name'] ?? ucfirst($slug)),
                'description' => (string) ($info['description'] ?? ''),
                'version' => (string) ($info['version'] ?? ''),
                'author' => (string) ($info['author'] ?? ''),
            ];
        }
        ksort($themes);

        // The default theme first
        if (isset($themes[self::DEFAULT])) {
            $themes = [self::DEFAULT => $themes[self::DEFAULT]] + $themes;
        }

        return self::$themes = $themes;
    }

    public static function exists(?string $theme): bool
    {
        return $theme !== null && isset(self::all()[$theme]);
    }

    /**
     * The current site's theme.
     */
    public static function current(): string
    {
        $theme = Sites::current()?->theme;

        return self::exists($theme) ? $theme : self::DEFAULT;
    }

    /**
     * Whether $component is a public page, served by the theme.
     */
    public static function isThemePage(string $component): bool
    {
        return str_starts_with($component, 'front/');
    }

    /**
     * Source file of an Inertia component, relative to the project root, for @vite.
     */
    public static function pageFile(string $component, ?string $theme = null): string
    {
        if (! self::isThemePage($component)) {
            return 'resources/js/pages/'.$component.'.tsx';
        }

        $theme ??= self::current();
        $file = $component.'.tsx';

        return 'resources/themes/'.(is_file(self::path($theme, $file)) ? $theme : self::DEFAULT).'/'.$file;
    }

    /**
     * Stylesheet of a theme, relative to the project root, for @vite.
     */
    public static function styleFile(?string $theme = null): string
    {
        $theme ??= self::current();

        return 'resources/themes/'.(is_file(self::path($theme, 'css/theme.css')) ? $theme : self::DEFAULT).'/css/theme.css';
    }

    /**
     * Page template files ("front/templates/*.tsx") of the default theme and $theme,
     * keyed by file name; the theme's own copy wins.
     *
     * @return array<string, string>
     */
    public static function templateFiles(?string $theme = null): array
    {
        $theme ??= self::current();

        $files = [];
        foreach (array_unique([self::DEFAULT, $theme]) as $slug) {
            foreach (glob(self::templatesPath($slug).'/*.tsx') ?: [] as $file) {
                $files[basename($file)] = $file;
            }
        }
        ksort($files);

        return $files;
    }

    /**
     * Folder of a theme's page templates.
     */
    public static function templatesPath(string $theme = self::DEFAULT): string
    {
        return self::path($theme, 'front/templates');
    }

    /**
     * Forget the scanned themes (after adding or removing one).
     */
    public static function flush(): void
    {
        self::$themes = null;
    }
}
