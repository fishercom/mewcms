<?php

namespace App\Support;

/**
 * Public site themes. Each theme is a folder in resources/themes/<slug> with:
 *
 * - theme.json      name, description, version, author
 * - css/theme.css   its stylesheet (its own Vite entry, so themes never share CSS)
 * - front/          its pages, named like the Inertia components ("front/templates/page")
 * - assets/         images and fonts, imported from its pages or CSS so Vite bundles them
 * - screenshot.png  its preview in Admin → Sites
 *
 * theme.json may declare "settings" each site can change (colours, fonts): each one
 * sets a CSS variable on the public pages (see cssVariables).
 *
 * A theme only needs the pages it changes: any other page comes from the default theme.
 */
class Themes
{
    public const DEFAULT = 'default';

    /** @var array<string, array{slug: string, name: string, description: string, version: string, author: string, screenshot: bool, settings: list<array<string, mixed>>}>|null */
    private static ?array $themes = null;

    public static function path(string $theme = self::DEFAULT, string $file = ''): string
    {
        return resource_path('themes/'.$theme.($file !== '' ? '/'.ltrim($file, '/') : ''));
    }

    /**
     * Installed themes, keyed by folder name.
     *
     * @return array<string, array{slug: string, name: string, description: string, version: string, author: string, screenshot: bool, settings: list<array<string, mixed>>}>
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
                'screenshot' => is_file(self::path($slug, 'screenshot.png')),
                'settings' => self::settingDefinitions($info['settings'] ?? []),
            ];
        }
        ksort($themes);

        // The default theme first
        if (isset($themes[self::DEFAULT])) {
            $themes = [self::DEFAULT => $themes[self::DEFAULT]] + $themes;
        }

        return self::$themes = $themes;
    }

    /**
     * Valid setting definitions from theme.json: a key, a label, a CSS variable, and
     * a colour or a list of options (each with the CSS value it stands for).
     *
     * @return list<array<string, mixed>>
     */
    private static function settingDefinitions(mixed $settings): array
    {
        $definitions = [];
        foreach (is_array($settings) ? $settings : [] as $setting) {
            $key = $setting['key'] ?? null;
            $css = $setting['css'] ?? null;
            $type = $setting['type'] ?? null;
            if (! is_string($key) || ! is_string($css) || ! preg_match('/^--[a-z0-9-]+$/', $css) || ! in_array($type, ['color', 'select'], true)) {
                continue;
            }

            $definition = [
                'key' => $key,
                'label' => (string) ($setting['label'] ?? $key),
                'type' => $type,
                'css' => $css,
                'default' => (string) ($setting['default'] ?? ''),
            ];

            if ($type === 'select') {
                $definition['options'] = array_values(array_filter(array_map(fn ($option): ?array => is_array($option) && isset($option['value'], $option['css']) ? [
                    'value' => (string) $option['value'],
                    'label' => (string) ($option['label'] ?? $option['value']),
                    'css' => (string) $option['css'],
                ] : null, (array) ($setting['options'] ?? []))));
            }

            $definitions[] = $definition;
        }

        return $definitions;
    }

    /**
     * Keep the values of $values that $theme declares and that are valid (a #rrggbb
     * colour, or one of the options). Anything else falls back to the theme default.
     *
     * @param  array<string, mixed>  $values
     * @return array<string, string>
     */
    public static function cleanSettings(string $theme, array $values): array
    {
        $clean = [];
        foreach (self::all()[$theme]['settings'] ?? [] as $setting) {
            $value = $values[$setting['key']] ?? null;
            if (! is_string($value)) {
                continue;
            }

            $valid = $setting['type'] === 'color'
                ? preg_match('/^#[0-9a-f]{6}$/i', $value) === 1
                : in_array($value, array_column($setting['options'], 'value'), true);

            if ($valid) {
                $clean[$setting['key']] = $setting['type'] === 'color' ? strtolower($value) : $value;
            }
        }

        return $clean;
    }

    /**
     * CSS declarations ("--site-accent: #f53003; ...") for a site's theme settings,
     * printed on its public pages.
     *
     * @param  array<string, mixed>|null  $values
     */
    public static function cssVariables(string $theme, ?array $values): string
    {
        $values = self::cleanSettings($theme, (array) $values);

        $declarations = [];
        foreach (self::all()[$theme]['settings'] ?? [] as $setting) {
            $value = $values[$setting['key']] ?? $setting['default'];
            if ($setting['type'] === 'select') {
                $option = collect($setting['options'])->firstWhere('value', $value);
                $value = $option['css'] ?? null;
            } elseif (preg_match('/^#[0-9a-f]{6}$/i', $value) !== 1) {
                $value = null;
            }

            if ($value !== null && $value !== '') {
                // Values come from theme.json; still keep them from closing the rule or the tag
                $declarations[] = $setting['css'].': '.str_replace(['<', '>', '{', '}', ';'], '', $value).';';
            }
        }

        return implode(' ', $declarations);
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
