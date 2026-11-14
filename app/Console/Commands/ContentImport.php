<?php

namespace App\Console\Commands;

use App\Models\CmsSite;
use App\Support\ContentImporter;
use App\Support\Themes;
use Illuminate\Console\Command;
use RuntimeException;

/**
 * Load a site's starting content (pages, posts, menus, forms, sliders, media) from a
 * theme's content/content.json or from any file in that format. Optional: the CMS works
 * without it, and a site's content is usually written in the admin.
 */
class ContentImport extends Command
{
    protected $signature = 'cms:content-import
        {source : A theme with a content/content.json, or the path of a content file}
        {--site= : Id of the site to load it into (default: the default site)}
        {--theme= : Theme the site uses afterwards (default: the theme of the source, when it is one)}
        {--fresh : Delete the site\'s pages, posts, menus, forms and sliders first}
        {--var=* : Values for {name} placeholders in the file, as name=value}
        {--force : Do not ask for confirmation}';

    protected $description = 'Load a site\'s starting content from a theme\'s content.json';

    public function handle(): int
    {
        $source = (string) $this->argument('source');
        $isTheme = preg_match('/^[a-z0-9_-]+$/', $source) === 1 && Themes::exists($source);
        $file = $isTheme ? ContentImporter::themeFile($source) : $source;

        if ($file === null) {
            $this->error("The theme \"{$source}\" ships no content/content.json.");

            return self::FAILURE;
        }

        $site = $this->option('site') ? CmsSite::find((int) $this->option('site')) : CmsSite::where('default', true)->first() ?? CmsSite::orderBy('id')->first();
        if (! $site) {
            $this->error('There is no such site. Create it in Admin → Sites first.');

            return self::FAILURE;
        }

        $theme = $this->option('theme') ?: ($isTheme ? $source : null);
        if ($theme !== null && ! Themes::exists($theme)) {
            $this->error("Unknown theme \"{$theme}\".");

            return self::FAILURE;
        }

        $fresh = (bool) $this->option('fresh');
        $question = $fresh
            ? "This deletes every page, post, menu, form and slider of the site \"{$site->name}\" and loads {$file}. Continue?"
            : "Load {$file} into the site \"{$site->name}\"?";
        if (! $this->option('force') && ! $this->confirm($question)) {
            return self::FAILURE;
        }

        try {
            $importer = ContentImporter::fromFile($file)
                ->with($this->vars())
                ->logUsing(fn (string $line) => $this->line($line));

            if ($fresh) {
                ContentImporter::fresh($site);
            }
            $importer->import($site, $theme);
        } catch (RuntimeException $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        $this->info("Content loaded into \"{$site->name}\"".($theme ? " (theme {$theme})" : '').'.');

        return self::SUCCESS;
    }

    /**
     * @return array<string, string>
     */
    private function vars(): array
    {
        $vars = [];
        foreach ((array) $this->option('var') as $pair) {
            [$name, $value] = array_pad(explode('=', (string) $pair, 2), 2, '');
            if ($name !== '') {
                $vars[$name] = $value;
            }
        }

        return $vars;
    }
}
