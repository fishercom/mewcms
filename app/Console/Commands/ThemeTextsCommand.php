<?php

namespace App\Console\Commands;

use App\Support\Themes;
use App\Support\ThemeTexts;
use Illuminate\Console\Command;

/**
 * Checks that every text a theme's pages use with t('key') has a text in the theme's
 * catalogs (lang/<locale>.json), and with --write adds the missing keys to the theme's
 * own files, empty, ready to fill in. Fails when a key has no text in the fallback
 * language, so a theme can't ship a page that shows a raw key.
 */
class ThemeTextsCommand extends Command
{
    protected $signature = 'cms:theme-texts
        {theme?* : Themes to check (all of them when left out)}
        {--write : Add the missing keys to the theme\'s lang/*.json files}';

    protected $description = 'Find the texts used in theme pages that are missing from their translation catalogs';

    public function handle(): int
    {
        $themes = $this->argument('theme') ?: array_keys(Themes::all());
        $failed = false;

        foreach ($themes as $theme) {
            if (! Themes::exists($theme)) {
                $this->error("No theme \"{$theme}\".");
                $failed = true;

                continue;
            }

            $failed = $this->check($theme) || $failed;
        }

        return $failed ? self::FAILURE : self::SUCCESS;
    }

    /**
     * Report (and with --write, fill) the gaps of one theme. True when the fallback language lacks a key.
     */
    protected function check(string $theme): bool
    {
        $folder = Themes::dir($theme);
        $used = ThemeTexts::used($theme);
        $locales = $this->locales($folder);
        $this->line("<info>{$theme}</info>: ".count($used).' keys used, catalogs: '.implode(', ', $locales));

        $fallbackMissing = false;
        foreach ($locales as $locale) {
            $known = ThemeTexts::defaults($theme, $locale, $locale === ThemeTexts::FALLBACK);
            $missing = array_values(array_diff($used, array_keys($known)));
            if ($missing === []) {
                continue;
            }

            $fallbackMissing = $fallbackMissing || $locale === ThemeTexts::FALLBACK;
            $this->warn("  {$locale}: ".count($missing).' missing');
            foreach ($missing as $key) {
                $this->line("    {$key}");
            }

            if ($this->option('write')) {
                $this->write($folder.'/lang/'.$locale.'.json', $missing);
            }
        }

        return $fallbackMissing && ! $this->option('write');
    }

    /**
     * Languages of the theme's own catalogs, the fallback language always first.
     *
     * @return list<string>
     */
    protected function locales(string $folder): array
    {
        $locales = array_map(fn (string $file): string => basename($file, '.json'), glob($folder.'/lang/*.json') ?: []);
        $locales = array_values(array_unique([ThemeTexts::FALLBACK, ...$locales]));

        return $locales;
    }

    /**
     * Add $keys, empty, to the catalog at $path (created when missing), sorted by key.
     *
     * @param  list<string>  $keys
     */
    protected function write(string $path, array $keys): void
    {
        $texts = is_file($path) ? (array) json_decode((string) file_get_contents($path), true) : [];
        foreach ($keys as $key) {
            $texts[$key] ??= '';
        }
        ksort($texts);

        if (! is_dir(dirname($path))) {
            mkdir(dirname($path), 0755, true);
        }
        file_put_contents($path, json_encode($texts, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)."\n");
        ThemeTexts::flush();
        $this->line('    → added to '.basename(dirname($path)).'/'.basename($path));
    }
}
