<?php

namespace App\Console\Commands;

use App\Models\CmsConfig;
use App\Models\CmsSite;
use App\Support\ContentImporter;
use App\Support\FrontCache;
use App\Support\MediaLibrary;
use App\Support\Sites;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

/**
 * Replace all the content with two demo sites: a pet boutique (site 1, theme "velvet")
 * and its pet care journal (site 2, theme "journal"). The content is the starting content
 * of those themes (resources/themes/<theme>/content/content.json, see ContentImporter);
 * the photos are downloaded from Unsplash into the media library (and kept in
 * storage/app/private/content-cache, so a re-run needs no network).
 *
 * Users, profiles, the admin tables, languages and themes are not touched.
 */
class DemoSites extends Command
{
    protected $signature = 'cms:demo-sites
        {--shop-url= : Public address of the shop (default: http://mewcms.localhost)}
        {--blog-url= : Public address of the journal (default: http://blog.localhost)}
        {--force : Do not ask for confirmation}';

    protected $description = 'Delete all content and build the demo pet shop and pet care blog sites';

    /** Content tables emptied before the demo is built */
    private const TABLES = [
        'cms_article_term', 'cms_post_term', 'cms_revisions', 'cms_menu_items', 'cms_menus', 'cms_slides', 'cms_sliders',
        'cms_register_fields', 'cms_registers', 'cms_notifies', 'cms_form_fields', 'cms_forms', 'cms_redirects', 'cms_media',
        'cms_block_patterns', 'cms_articles', 'cms_posts', 'cms_post_types', 'cms_taxonomy_terms', 'cms_schemas',
    ];

    /** Folders of uploaded files on the public disk (themes/ is kept) */
    private const FILE_FOLDERS = ['media', 'photos', 'files'];

    private const ENGLISH = 'en';

    public function handle(): int
    {
        $shop = CmsSite::find(1);
        $journal = CmsSite::find(2);
        if (! $shop || ! $journal) {
            $this->error('Sites 1 (shop) and 2 (journal) must exist. Create them in Admin → Sites first.');

            return self::FAILURE;
        }

        if (! $this->option('force') && ! $this->confirm('This deletes every page, post, menu, form, slider, tag and media file. Continue?')) {
            return self::FAILURE;
        }

        $shopUrl = rtrim($this->option('shop-url') ?: 'http://mewcms.localhost', '/');
        $blogUrl = rtrim($this->option('blog-url') ?: 'http://blog.localhost', '/');
        $urls = ['shop' => $shopUrl, 'journal' => $blogUrl];
        $log = fn (string $line) => $this->line($line);

        $shopContent = ContentImporter::fromFile((string) ContentImporter::themeFile('velvet'))->with($urls)->logUsing($log);
        $journalContent = ContentImporter::fromFile((string) ContentImporter::themeFile('journal'))->with($urls)->logUsing($log);

        // Download first: if Unsplash can't be reached, nothing has been deleted yet
        $this->info('Photos from Unsplash');
        try {
            $journalContent->prefetch();
            $shopContent->prefetch();
        } catch (RuntimeException $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        $this->reset();

        $this->placeSite($shop, $shopUrl, true);
        $this->placeSite($journal, $blogUrl, false);
        $this->resetSharedSettings();

        // The journal first: the shop's home page lists its newest articles
        $journalContent->import($journal, 'journal');
        $shopContent->import($shop, 'velvet');

        $home = $shopContent->pages()['home'] ?? null;
        if ($home) {
            $tags = $journalContent->data()['tags'] ?? [];
            $home->metadata = [...$home->metadata, 'journal_items' => collect($journalContent->posts())->take(3)->map(fn ($post): array => [
                'title' => $post->title,
                'label' => $tags[$post->tags->first()?->slug] ?? '',
                'image' => $post->featured_image,
                'url' => "{$blogUrl}/blog/{$post->slug}",
            ])->all()];
            $home->saveQuietly();
        }

        Sites::flush();
        FrontCache::flush();

        $this->newLine();
        $this->info('Demo sites ready:');
        $this->line("  Shop     {$shopUrl}  (theme velvet)");
        $this->line("  Journal  {$blogUrl}  (theme journal)");

        return self::SUCCESS;
    }

    /**
     * Empty the content tables and delete the uploaded files.
     */
    private function reset(): void
    {
        $this->info('Deleting the old content');
        Schema::disableForeignKeyConstraints();
        try {
            foreach (self::TABLES as $table) {
                $count = DB::table($table)->count();
                DB::table($table)->truncate();
                $this->line(sprintf('  %-22s %d rows', $table, $count));
            }
        } finally {
            Schema::enableForeignKeyConstraints();
        }

        // Settings of a single site are demo settings; the shared ones are reset later
        DB::table('cms_configs')->whereNotNull('site_id')->delete();

        $disk = Storage::disk(MediaLibrary::DISK);
        foreach (self::FILE_FOLDERS as $folder) {
            $count = count($disk->allFiles($folder));
            $disk->deleteDirectory($folder);
            $this->line(sprintf('  %-22s %d files', "storage/{$folder}", $count));
        }
    }

    /**
     * The demo's address, language and currency for a site; its texts come from the theme's content.
     */
    private function placeSite(CmsSite $site, string $url, bool $default): void
    {
        $site->forceFill([
            'site_url' => $url,
            'domains' => [CmsSite::normalizeDomain($url)],
            'lang_id' => DB::table('cms_langs')->where('iso', self::ENGLISH)->value('id') ?? $site->lang_id,
            'default' => $default,
            'active' => true,
        ])->save();
    }

    /**
     * The settings shared by every site go back to empty values.
     */
    private function resetSharedSettings(): void
    {
        $defaults = [
            'layout_copyright' => '© '.now()->year.' MewCMS.',
            'layout_social_links' => '[]',
        ];
        CmsConfig::whereNull('site_id')->get()->each(function (CmsConfig $config) use ($defaults): void {
            $config->value = $defaults[$config->alias] ?? '';
            $config->saveQuietly();
        });
    }
}
