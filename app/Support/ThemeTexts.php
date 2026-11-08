<?php

namespace App\Support;

use App\Models\CmsTranslation;
use Illuminate\Support\Facades\Cache;

/**
 * The fixed texts of a theme ("Explore", "from :price"), written in its pages as keys:
 * t('shop.from_price', { price }). Each theme ships them per language in
 * lang/<locale>.json (BCP 47 names: es.json, en.json, pt-BR.json), and a site can change
 * any of them, per language, in Admin → Translations (cms_translations).
 *
 * A key resolves to, from strongest to weakest: the site's value, then the theme's text
 * in the site's language ("es-PE", then "es"), then in the fallback language (English).
 * Within one language the theme's own catalog wins over the theme whose pages it uses
 * and over the default theme, which holds the texts shared by every theme.
 */
class ThemeTexts
{
    /** Language used when the site's language has no text for a key */
    public const FALLBACK = 'en';

    /** Keys look like "shop.from_price": lowercase words joined by dots */
    public const KEY_PATTERN = '/^[a-z0-9_-]+(\.[a-z0-9_-]+)+$/';

    /** t('key') or choice("key", ...) in a theme's pages */
    private const CALL_PATTERN = '/(?<![\w.$])(?:t|choice)\(\s*([\'"])([a-z0-9_.-]+)\1/';

    /** @var array<string, array<string, string>> */
    private static array $files = [];

    /**
     * Shared parts of the public pages that use theme texts, outside the themes (forms,
     * sliders, galleries...): their keys belong to the default theme's catalogs.
     *
     * @return list<string>
     */
    public static function coreSources(): array
    {
        return [resource_path('js/blocks'), resource_path('js/components/front-form.tsx'), resource_path('js/components/front-slider.tsx'), resource_path('js/components/front-language-switcher.tsx')];
    }

    /**
     * Keys used by the pages of $theme's own folder (and, for the default theme, by the shared parts).
     *
     * @return list<string>
     */
    public static function used(string $theme): array
    {
        $keys = self::extract(Themes::dir($theme));
        if ($theme === Themes::DEFAULT) {
            foreach (self::coreSources() as $source) {
                $keys = [...$keys, ...self::extract($source)];
            }
        }
        $keys = array_values(array_unique($keys));
        sort($keys);

        return $keys;
    }

    /**
     * Texts of the current site: its theme's in its language, with the site's changes.
     *
     * @return array<string, string>
     */
    public static function forCurrentSite(): array
    {
        return Cache::remember(FrontCache::key('texts'), FrontCache::TTL, fn (): array => [
            ...self::defaults(Themes::current(), self::locale()),
            ...self::overrides(),
        ]);
    }

    /**
     * The values the current site changed in $locale (its language by default), keyed by key.
     *
     * @return array<string, string>
     */
    public static function overrides(?string $locale = null): array
    {
        return CmsTranslation::inLocale($locale ?? self::locale())->orderBy('key')->pluck('value', 'key')->map(fn ($value): string => (string) $value)->all();
    }

    /**
     * Language of the current request (the site's language, or the extra language in the
     * address or picked in the admin; else the CMS language), as a BCP 47 tag.
     */
    public static function locale(): string
    {
        return self::normalizeLocale(Locales::current()?->iso ?: (string) config('app.locale'));
    }

    /**
     * The theme's own texts in $locale, before any site changes them. Without the
     * fallback, only the texts the theme really has in $locale.
     *
     * @return array<string, string>
     */
    public static function defaults(string $theme, string $locale, bool $withFallback = true): array
    {
        $texts = [];
        $chain = self::localeChain($locale);
        if (! $withFallback && self::normalizeLocale($locale) !== self::FALLBACK) {
            $chain = array_slice($chain, 1);
        }
        foreach ($chain as $candidate) {
            foreach (self::sources($theme) as $folder) {
                foreach (self::file($folder.'/lang/'.$candidate.'.json') as $key => $value) {
                    if ($value !== '') {
                        $texts[$key] = $value;
                    }
                }
            }
        }
        ksort($texts);

        return $texts;
    }

    /**
     * Keys $theme has no text for in $locale and the site has not changed.
     *
     * @return list<string>
     */
    public static function missing(string $theme, string $locale): array
    {
        $translated = self::defaults($theme, $locale, false);
        $changed = self::overrides($locale);

        return array_values(array_filter(
            self::keys($theme),
            fn (string $key): bool => ! array_key_exists($key, $translated) && ! array_key_exists($key, $changed),
        ));
    }

    /**
     * Every key $theme knows: those its pages use and those its catalogs hold.
     *
     * @return list<string>
     */
    public static function keys(string $theme): array
    {
        $keys = array_keys(self::defaults($theme, self::FALLBACK));
        foreach (self::sources($theme) as $folder) {
            foreach (glob($folder.'/lang/*.json') ?: [] as $file) {
                $keys = [...$keys, ...array_keys(self::file($file))];
            }
            $keys = [...$keys, ...self::extract($folder)];
        }
        foreach (self::coreSources() as $source) {
            $keys = [...$keys, ...self::extract($source)];
        }
        $keys = array_values(array_unique($keys));
        sort($keys);

        return $keys;
    }

    /**
     * Keys used with t() or choice() in the code files of a folder (or in one file).
     *
     * @return list<string>
     */
    public static function extract(string $folder): array
    {
        $keys = [];
        $files = match (true) {
            is_dir($folder) => new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($folder, \FilesystemIterator::SKIP_DOTS)),
            is_file($folder) => [new \SplFileInfo($folder)],
            default => [],
        };
        foreach ($files as $file) {
            if (! $file->isFile() || ! in_array($file->getExtension(), ['tsx', 'ts', 'jsx', 'js'], true) || str_contains($file->getPathname(), '/node_modules/')) {
                continue;
            }
            preg_match_all(self::CALL_PATTERN, (string) file_get_contents($file->getPathname()), $matches);
            $keys = [...$keys, ...$matches[2]];
        }
        $keys = array_values(array_unique(array_filter($keys, fn (string $key): bool => preg_match(self::KEY_PATTERN, $key) === 1)));
        sort($keys);

        return $keys;
    }

    /**
     * Folders whose catalogs make up $theme's texts, weakest first: the default theme,
     * the built theme whose pages $theme uses, and $theme itself.
     *
     * @return list<string>
     */
    public static function sources(string $theme): array
    {
        $folders = [Themes::path(Themes::DEFAULT), Themes::path(Themes::layout($theme))];
        if (Themes::exists($theme)) {
            $folders[] = Themes::dir($theme);
        }

        return array_values(array_unique($folders));
    }

    /**
     * The languages to look a text up in, weakest first: "es-PE" gives en, es, es-PE.
     *
     * @return list<string>
     */
    public static function localeChain(string $locale): array
    {
        $locale = self::normalizeLocale($locale);
        $chain = [self::FALLBACK];
        $parts = explode('-', $locale);
        for ($i = 1; $i <= count($parts); $i++) {
            $chain[] = implode('-', array_slice($parts, 0, $i));
        }

        return array_values(array_unique(array_filter($chain)));
    }

    /**
     * "es_pe" and "ES-pe" become "es-PE"; anything that is not a language tag becomes the fallback.
     */
    public static function normalizeLocale(string $locale): string
    {
        $parts = preg_split('/[-_]/', trim($locale)) ?: [];
        if (! preg_match('/^[a-zA-Z]{2,3}$/', $parts[0] ?? '')) {
            return self::FALLBACK;
        }

        $tag = [strtolower($parts[0])];
        foreach (array_slice($parts, 1) as $part) {
            if (! preg_match('/^[a-zA-Z0-9]{2,8}$/', $part)) {
                break;
            }
            $tag[] = match (true) {
                strlen($part) === 2 => strtoupper($part),
                strlen($part) === 4 => ucfirst(strtolower($part)),
                default => strtolower($part),
            };
        }

        return implode('-', $tag);
    }

    /**
     * A catalog file: key => text, only string values with a valid key.
     *
     * @return array<string, string>
     */
    public static function file(string $path): array
    {
        if (array_key_exists($path, self::$files)) {
            return self::$files[$path];
        }

        $data = is_file($path) ? json_decode((string) file_get_contents($path), true) : null;
        $texts = [];
        foreach (is_array($data) ? $data : [] as $key => $value) {
            if (is_string($key) && is_string($value) && preg_match(self::KEY_PATTERN, $key)) {
                $texts[$key] = $value;
            }
        }

        return self::$files[$path] = $texts;
    }

    /**
     * Forget the catalogs read so far (after a theme is installed or a file is written).
     */
    public static function flush(): void
    {
        self::$files = [];
    }
}
