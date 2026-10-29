<?php

namespace App\Support;

/**
 * Public site themes. A theme comes from one of two places:
 *
 * - Built themes, in resources/themes/<slug>: React pages (front/, named like the Inertia
 *   components, "front/templates/page"), a css/theme.css that Vite compiles, and assets/
 *   imported from them. They change with the code and need `npm run build`.
 * - Uploaded themes, in storage/app/public/themes/<slug> (Admin → Themes): stylesheets,
 *   scripts, images and fonts ready to serve. They use the pages of a built theme (their
 *   "layout") and add their own files on top, with no build.
 *
 * Both have a theme.json (name, description, version, author, layout, styles, scripts)
 * and may have a screenshot.png, shown in Admin → Sites.
 *
 * A built theme only needs the pages it changes: any other page comes from the default theme.
 */
class Themes
{
    public const DEFAULT = 'default';

    /** Folder of the uploaded themes, on the public disk */
    public const UPLOADS = 'themes';

    /** @var array<string, array<string, mixed>>|null */
    private static ?array $themes = null;

    /**
     * Folder of a built theme, or of a file in it.
     */
    public static function path(string $theme = self::DEFAULT, string $file = ''): string
    {
        return resource_path('themes/'.$theme.($file !== '' ? '/'.ltrim($file, '/') : ''));
    }

    /**
     * Folder of an uploaded theme, or of a file in it.
     */
    public static function uploadPath(string $theme = '', string $file = ''): string
    {
        return storage_path('app/public/'.self::UPLOADS.($theme !== '' ? '/'.$theme : '').($file !== '' ? '/'.ltrim($file, '/') : ''));
    }

    /**
     * Folder of any installed theme, or of a file in it.
     */
    public static function dir(string $theme, string $file = ''): string
    {
        return (self::all()[$theme]['uploaded'] ?? false) ? self::uploadPath($theme, $file) : self::path($theme, $file);
    }

    /**
     * Installed themes, keyed by slug: the built ones (default first), then the uploaded ones.
     *
     * @return array<string, array{slug: string, name: string, description: string, version: string, author: string, screenshot: bool, uploaded: bool, layout: string, styles: list<array{href: string, media: string|null}>, scripts: list<array{src: string, position: string, defer: bool, async: bool, module: bool}>}>
     */
    public static function all(): array
    {
        if (self::$themes !== null) {
            return self::$themes;
        }

        $built = [];
        foreach (glob(self::path('*').'/theme.json') ?: [] as $manifest) {
            $slug = basename(dirname($manifest));
            if (self::validSlug($slug)) {
                $built[$slug] = self::read($slug, dirname($manifest), false, []);
            }
        }
        ksort($built);
        if (isset($built[self::DEFAULT])) {
            $built = [self::DEFAULT => $built[self::DEFAULT]] + $built;
        }

        $uploaded = [];
        foreach (glob(self::uploadPath('*').'/theme.json') ?: [] as $manifest) {
            $slug = basename(dirname($manifest));
            // A built theme with the same name wins
            if (self::validSlug($slug) && ! isset($built[$slug])) {
                $uploaded[$slug] = self::read($slug, dirname($manifest), true, array_keys($built));
            }
        }
        ksort($uploaded);

        return self::$themes = $built + $uploaded;
    }

    public static function validSlug(string $slug): bool
    {
        return preg_match('/^[a-z0-9][a-z0-9_-]{0,49}$/', $slug) === 1;
    }

    /**
     * The manifest of a theme: what theme.json says, with only the files and addresses
     * that are safe to print in a page.
     *
     * @param  list<string>  $layouts  built themes an uploaded theme may use the pages of
     * @return array<string, mixed>
     */
    private static function read(string $slug, string $folder, bool $uploaded, array $layouts): array
    {
        $info = self::manifest($folder.'/theme.json') ?? [];
        $version = (string) ($info['version'] ?? '');
        // Changes on every upload, so browsers never keep an old copy of the files
        $stamp = substr(md5($version.'|'.@filemtime($folder.'/theme.json')), 0, 8);

        $layout = $slug;
        if ($uploaded) {
            $layout = in_array($info['layout'] ?? null, $layouts, true) ? $info['layout'] : self::DEFAULT;
        }

        $styles = [];
        foreach ((array) ($info['styles'] ?? []) as $style) {
            $style = is_string($style) ? ['href' => $style] : $style;
            $href = is_array($style) ? self::fileUrl($slug, $folder, $uploaded, $style['href'] ?? null, 'css', $stamp) : null;
            if ($href !== null) {
                $styles[] = ['href' => $href, 'media' => self::attribute($style['media'] ?? null)];
            }
        }

        $scripts = [];
        foreach ((array) ($info['scripts'] ?? []) as $script) {
            $script = is_string($script) ? ['src' => $script] : $script;
            $src = is_array($script) ? self::fileUrl($slug, $folder, $uploaded, $script['src'] ?? null, 'js', $stamp) : null;
            if ($src !== null) {
                $scripts[] = [
                    'src' => $src,
                    'position' => ($script['position'] ?? 'body') === 'head' ? 'head' : 'body',
                    'defer' => (bool) ($script['defer'] ?? false),
                    'async' => (bool) ($script['async'] ?? false),
                    'module' => ($script['type'] ?? null) === 'module',
                ];
            }
        }

        return [
            'slug' => $slug,
            'name' => (string) ($info['name'] ?? ucfirst($slug)),
            'description' => (string) ($info['description'] ?? ''),
            'version' => $version,
            'author' => (string) ($info['author'] ?? ''),
            'screenshot' => is_file($folder.'/screenshot.png'),
            'uploaded' => $uploaded,
            'layout' => $layout,
            'styles' => $styles,
            'scripts' => $scripts,
        ];
    }

    /**
     * The decoded theme.json at $file, or null when it is missing or not a JSON object.
     *
     * @return array<string, mixed>|null
     */
    public static function manifest(string $file): ?array
    {
        $info = is_file($file) ? json_decode((string) file_get_contents($file), true) : null;

        return is_array($info) ? $info : null;
    }

    /**
     * Address of a stylesheet or script a theme lists: an https:// URL as it is, or a
     * file of an uploaded theme with the expected extension (served from /storage, with
     * a stamp so a new upload is not cached). Built themes bundle their own
     * files with Vite, so only URLs count for them.
     */
    private static function fileUrl(string $slug, string $folder, bool $uploaded, mixed $file, string $extension, string $stamp): ?string
    {
        if (! is_string($file) || $file === '' || preg_match('/[\s"\'<>]/', $file)) {
            return null;
        }

        if (str_starts_with($file, 'https://')) {
            return filter_var($file, FILTER_VALIDATE_URL) ? $file : null;
        }

        $file = ltrim($file, './');
        if (! $uploaded
            || ! preg_match('#^[A-Za-z0-9_-][A-Za-z0-9_./-]*$#', $file)
            || str_contains($file, '..')
            || strtolower(pathinfo($file, PATHINFO_EXTENSION)) !== $extension
            || ! is_file($folder.'/'.$file)) {
            return null;
        }

        return '/storage/'.self::UPLOADS.'/'.$slug.'/'.$file.'?v='.$stamp;
    }

    private static function attribute(mixed $value): ?string
    {
        return is_string($value) && preg_match('/^[A-Za-z0-9 ():,.-]{1,100}$/', $value) ? $value : null;
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
     * The built theme whose pages and compiled stylesheet $theme uses: itself for a
     * built theme, its "layout" for an uploaded one.
     */
    public static function layout(?string $theme = null): string
    {
        $theme ??= self::current();

        return self::all()[$theme]['layout'] ?? self::DEFAULT;
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

        $theme = self::layout($theme);
        $file = $component.'.tsx';

        return 'resources/themes/'.(is_file(self::path($theme, $file)) ? $theme : self::DEFAULT).'/'.$file;
    }

    /**
     * Stylesheet of a theme, relative to the project root, for @vite.
     */
    public static function styleFile(?string $theme = null): string
    {
        $theme = self::layout($theme);

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
        $theme = self::layout($theme);

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
