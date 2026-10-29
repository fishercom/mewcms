<?php

namespace App\Console\Commands;

use App\Models\CmsArticle;
use App\Models\CmsConfig;
use App\Models\CmsForm;
use App\Models\CmsFormField;
use App\Models\CmsMenu;
use App\Models\CmsMenuItem;
use App\Models\CmsPost;
use App\Models\CmsSchema;
use App\Models\CmsSite;
use App\Models\CmsTag;
use App\Models\User;
use App\Support\FrontCache;
use App\Support\MediaLibrary;
use App\Support\Sites;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Replace all the content with two demo sites: a pet boutique (site 1, theme "velvet")
 * and its pet care journal (site 2, theme "journal"). The content lives in
 * database/demo/pet-sites.php; the photos are downloaded from Unsplash into the media
 * library (and kept in storage/app/private/demo-photos, so a re-run needs no network).
 *
 * Users, profiles, the admin tables, languages and themes are not touched.
 */
class DemoSites extends Command
{
    protected $signature = 'cms:demo-sites
        {--shop-url= : Public address of the shop (default: http://mewcms.localhost plus the port of APP_URL)}
        {--blog-url= : Public address of the journal (default: http://blog.localhost plus the port of APP_URL)}
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

    /** @var array<string, string> photo key => URL in the library */
    private array $photos = [];

    /** @var array<string, string> */
    private array $replacements = [];

    public function handle(): int
    {
        $data = require database_path('demo/pet-sites.php');

        $shop = CmsSite::find(1);
        $journal = CmsSite::find(2);
        if (! $shop || ! $journal) {
            $this->error('Sites 1 (shop) and 2 (journal) must exist. Create them in Admin → Sites first.');

            return self::FAILURE;
        }

        if (! $this->option('force') && ! $this->confirm('This deletes every page, post, menu, form, slider, tag and media file. Continue?')) {
            return self::FAILURE;
        }

        $port = parse_url((string) config('app.url'), PHP_URL_PORT);
        $suffix = $port ? ':'.$port : '';
        $shopUrl = rtrim($this->option('shop-url') ?: 'http://mewcms.localhost'.$suffix, '/');
        $blogUrl = rtrim($this->option('blog-url') ?: 'http://blog.localhost'.$suffix, '/');
        $this->replacements = ['{shop}' => $shopUrl, '{journal}' => $blogUrl];

        // Download first: if Unsplash can't be reached, nothing has been deleted yet
        $files = $this->downloadPhotos($data['photos']);

        $this->reset();

        $langId = DB::table('cms_langs')->where('iso', self::ENGLISH)->value('id');
        $userId = User::orderBy('id')->value('id');
        $schemas = $this->createSchemas();

        $this->storePhotos($data['photos'], $files, $userId);

        $this->updateSite($shop, $data['shop']['site'], $shopUrl, 'velvet', $langId, true);
        $this->updateSite($journal, $data['journal']['site'], $blogUrl, 'journal', $langId, false);
        $this->resetSharedSettings();

        // The journal first: the shop's home page lists its newest articles
        $posts = Sites::as($journal, function () use ($data, $schemas, $langId, $userId, $blogUrl): array {
            $this->saveSettings($data['journal']['settings']);
            $pages = $this->createPages($data['journal'], $schemas['journal_home'], $schemas['journal_page'], $langId);
            $this->createMenus($data['journal']['menus'], $pages);

            return $this->createPosts($data['journal'], $schemas['article'], $langId, $userId, $blogUrl);
        });

        Sites::as($shop, function () use ($data, $schemas, $langId, $posts): void {
            $this->saveSettings($data['shop']['settings']);
            $this->createForm($data['shop']['form']);
            $data['shop']['home']['metadata']['journal_items'] = array_slice($posts, 0, 3);
            $pages = $this->createPages($data['shop'], $schemas['shop_home'], $schemas['shop_page'], $langId);
            $this->createMenus($data['shop']['menus'], $pages);
        });

        Sites::flush();
        FrontCache::flush();

        $this->newLine();
        $this->info('Demo sites ready:');
        $this->line("  Shop     {$shopUrl}  (theme velvet)");
        $this->line("  Journal  {$blogUrl}  (theme journal)");

        return self::SUCCESS;
    }

    /**
     * @param  array<string, array{0: string, 1: string}>  $photos
     * @return array<string, string> photo key => local file
     */
    private function downloadPhotos(array $photos): array
    {
        $this->info('Photos from Unsplash');
        $cache = Storage::disk('local');

        $files = [];
        foreach ($photos as $key => [$id]) {
            $file = "demo-photos/{$id}.jpg";
            if (! $cache->exists($file) || $cache->size($file) === 0) {
                $response = Http::timeout(60)->retry(3, 1000)->get("https://images.unsplash.com/photo-{$id}", [
                    'w' => 2000, 'q' => 80, 'fm' => 'jpg', 'fit' => 'max',
                ]);
                if (! $response->successful() || ! str_starts_with((string) $response->header('Content-Type'), 'image/')) {
                    throw new RuntimeException("Could not download Unsplash photo {$id} (HTTP {$response->status()}).");
                }
                $cache->put($file, $response->body());
                $this->line("  ↓ {$key}");
            }
            $files[$key] = $cache->path($file);
        }

        return $files;
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
     * Page templates for both sites. Schemas are shared by all sites; the template name
     * ("front/templates/home") is drawn by each site's own theme.
     *
     * @return array<string, int>
     */
    private function createSchemas(): array
    {
        $groupId = DB::table('cms_schema_groups')->orderByDesc('default')->orderBy('id')->value('id')
            ?? DB::table('cms_schema_groups')->insertGetId(['name' => 'Templates', 'layout' => 'front', 'default' => true, 'active' => true, 'created_at' => now(), 'updated_at' => now()]);
        DB::table('cms_schema_groups')->where('id', $groupId)->update(['name' => 'Templates']);

        $card = fn (array $extra = []): array => [
            $this->field('title', 'Title'),
            $this->field('text', 'Text', 'textarea'),
            $this->field('image', 'Image', 'image'),
            $this->field('url', 'Link', 'url'),
            ...$extra,
        ];

        $schemas = [
            'shop_home' => ['Shop Home', 'HOME', 'front/templates/home', [
                $this->field('hero_eyebrow', 'Hero: eyebrow'),
                $this->field('hero_title', 'Hero: title (*word* = italics)'),
                $this->field('hero_text', 'Hero: text', 'textarea'),
                $this->field('hero_image', 'Hero: image', 'image'),
                $this->field('hero_button_label', 'Hero: button label'),
                $this->field('hero_button_url', 'Hero: button link', 'url'),
                $this->field('hero_secondary_label', 'Hero: second link label'),
                $this->field('hero_secondary_url', 'Hero: second link', 'url'),
                $this->field('hero_note', 'Hero: round badge'),
                $this->field('categories_eyebrow', 'Categories: eyebrow'),
                $this->field('categories_title', 'Categories: title'),
                $this->field('categories', 'Categories', 'repeater', $card()),
                $this->field('story_eyebrow', 'Story: eyebrow'),
                $this->field('story_title', 'Story: title'),
                $this->field('story_text', 'Story: text', 'textarea'),
                $this->field('story_image', 'Story: image', 'image'),
                $this->field('story_image_small', 'Story: small round image', 'image'),
                $this->field('story_button_label', 'Story: link label'),
                $this->field('story_button_url', 'Story: link', 'url'),
                $this->field('collections_eyebrow', 'Collections: eyebrow'),
                $this->field('collections_title', 'Collections: title'),
                $this->field('collections_text', 'Collections: text', 'textarea'),
                $this->field('collections', 'Collections', 'repeater', $card([$this->field('label', 'Badge'), $this->field('price', 'Price')])),
                $this->field('services_eyebrow', 'Services: eyebrow'),
                $this->field('services_title', 'Services: title'),
                $this->field('services_text', 'Services: text', 'textarea'),
                $this->field('services', 'Services', 'repeater', [
                    $this->field('title', 'Title'),
                    $this->field('text', 'Text', 'textarea'),
                    $this->field('icon', 'Icon', 'icon'),
                    $this->field('price', 'Price'),
                    $this->field('url', 'Link', 'url'),
                ]),
                $this->field('testimonials', 'Testimonials', 'repeater', [
                    $this->field('quote', 'Quote', 'textarea'),
                    $this->field('author', 'Author'),
                    $this->field('pet', 'Pet'),
                ]),
                $this->field('journal_eyebrow', 'Journal: eyebrow'),
                $this->field('journal_title', 'Journal: title'),
                $this->field('journal_text', 'Journal: text', 'textarea'),
                $this->field('journal_url', 'Journal: address', 'url'),
                $this->field('journal_items', 'Journal: articles', 'repeater', $card([$this->field('label', 'Topic')])),
                $this->field('gallery_title', 'Gallery: title'),
                $this->field('gallery_handle', 'Gallery: handle'),
                $this->field('gallery', 'Gallery', 'repeater', [$this->field('title', 'Name'), $this->field('image', 'Image', 'image')]),
                $this->field('cta_title', 'Closing: title'),
                $this->field('cta_text', 'Closing: text', 'textarea'),
                $this->field('cta_image', 'Closing: image', 'image'),
                $this->field('cta_button_label', 'Closing: button label'),
                $this->field('cta_button_url', 'Closing: button link', 'url'),
            ]],
            'shop_page' => ['Shop Page', 'PAGE', 'front/templates/page', [
                $this->field('eyebrow', 'Eyebrow'),
                $this->field('subtitle', 'Display title (*word* = italics)'),
                $this->field('products_title', 'Products: title'),
                $this->field('products', 'Products', 'repeater', [
                    $this->field('name', 'Name'),
                    $this->field('category', 'Category'),
                    $this->field('text', 'Description', 'textarea'),
                    $this->field('price', 'Price'),
                    $this->field('image', 'Image', 'image'),
                    $this->field('badge', 'Badge'),
                ]),
                $this->field('services', 'Services', 'repeater', [
                    $this->field('title', 'Title'),
                    $this->field('text', 'Text', 'textarea'),
                    $this->field('image', 'Image', 'image'),
                    $this->field('price', 'Price'),
                    $this->field('duration', 'Duration'),
                    $this->field('includes', 'Includes (one per line)', 'textarea'),
                ]),
                $this->field('form_alias', 'Form alias (Admin → Forms)'),
                $this->field('form_title', 'Form: title'),
                $this->field('form_text', 'Form: text', 'textarea'),
            ]],
            'journal_home' => ['Journal Home', 'HOME', 'front/templates/home', [
                $this->field('intro_eyebrow', 'Intro: eyebrow'),
                $this->field('intro_title', 'Intro: title'),
                $this->field('intro_text', 'Intro: text', 'textarea'),
                $this->field('topics_title', 'Topics: title'),
                $this->field('topics', 'Topics', 'repeater', [$this->field('title', 'Title'), $this->field('text', 'Text', 'textarea'), $this->field('url', 'Link', 'url')]),
                $this->field('promo_eyebrow', 'Shop band: eyebrow'),
                $this->field('promo_title', 'Shop band: title'),
                $this->field('promo_text', 'Shop band: text', 'textarea'),
                $this->field('promo_image', 'Shop band: image', 'image'),
                $this->field('promo_button_label', 'Shop band: button label'),
                $this->field('promo_button_url', 'Shop band: button link', 'url'),
            ]],
            'journal_page' => ['Journal Page', 'PAGE', 'front/templates/page', [
                $this->field('eyebrow', 'Eyebrow'),
                $this->field('subtitle', 'Display title'),
            ]],
            'article' => ['Article', null, null, [
                $this->field('author', 'Author'),
                $this->field('image_credit', 'Photo credit'),
                $this->field('image_credit_url', 'Photo credit link', 'url'),
            ]],
        ];

        $ids = [];
        foreach ($schemas as $key => [$name, $type, $view, $fields]) {
            $schema = CmsSchema::create(['group_id' => $groupId, 'name' => $name, 'fields' => $fields, 'front_view' => $view, 'active' => true]);
            $schema->forceFill(['type' => $type])->save();
            $ids[$key] = $schema->id;
        }

        return $ids;
    }

    /**
     * @param  list<array<string, mixed>>|null  $fields
     * @return array<string, mixed>
     */
    private function field(string $key, string $label, string $type = 'text', ?array $fields = null): array
    {
        return ['key' => $key, 'label' => $label, 'type' => $type] + ($fields !== null ? ['fields' => $fields] : []);
    }

    /**
     * @param  array<string, array{0: string, 1: string}>  $photos
     * @param  array<string, string>  $files
     */
    private function storePhotos(array $photos, array $files, ?int $userId): void
    {
        $this->info('Media library');
        $disk = Storage::disk(MediaLibrary::DISK);
        $dir = 'media/'.now()->format('Y/m');

        foreach ($photos as $key => [$id, $alt]) {
            $path = "{$dir}/{$key}.jpg";
            $disk->put($path, file_get_contents($files[$key]));
            $media = MediaLibrary::register($path, 'image/jpeg', $userId, [
                'filename' => "{$key}.jpg",
                'title' => Str::headline($key),
                'alt' => $alt,
                'caption' => "Photo from Unsplash (https://images.unsplash.com/photo-{$id}), Unsplash License.",
            ]);
            $this->photos[$key] = '/storage/'.$media->path;
            $this->line("  + {$media->path}");
        }
    }

    private function updateSite(CmsSite $site, array $info, string $url, string $theme, ?int $langId, bool $default): void
    {
        $site->forceFill([
            ...$info,
            'site_url' => $url,
            'domains' => [CmsSite::normalizeDomain($url)],
            'theme' => $theme,
            'lang_id' => $langId,
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

    /**
     * Layout settings of the current site.
     *
     * @param  array<string, mixed>  $settings
     */
    private function saveSettings(array $settings): void
    {
        foreach ($settings as $alias => $value) {
            $value = $this->resolve($value);
            CmsConfig::create([
                'site_id' => Sites::currentId(),
                'alias' => $alias,
                'name' => Str::of($alias)->after('layout_')->headline()->toString(),
                'type' => is_array($value) ? 'json' : 'string',
                'value' => is_array($value) ? json_encode($value, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) : $value,
            ]);
        }
    }

    /**
     * The home page and the other pages of the current site.
     *
     * @param  array<string, mixed>  $site
     * @return array<string, CmsArticle> slug => page
     */
    private function createPages(array $site, int $homeSchema, int $pageSchema, ?int $langId): array
    {
        $pages = ['home' => $this->createPage([...$site['home'], 'slug' => 'home', 'body' => null], $homeSchema, $langId)];
        foreach ($site['pages'] as $page) {
            $pages[$page['slug']] = $this->createPage($page, $pageSchema, $langId);
        }
        $this->line('  '.Sites::current()?->title.': '.count($pages).' pages');

        return $pages;
    }

    /**
     * @param  array<string, mixed>  $page
     */
    private function createPage(array $page, int $schemaId, ?int $langId): CmsArticle
    {
        $article = new CmsArticle([
            'schema_id' => $schemaId,
            'lang_id' => $langId,
            'title' => $page['title'],
            'slug' => $page['slug'],
            'excerpt' => $page['excerpt'] ?? null,
            'featured_image' => $this->resolve($page['featured_image'] ?? null),
            'metadata' => $this->resolve($page['metadata'] ?? []),
            'status' => 'published',
            'published_at' => now()->subDays(60),
            'active' => true,
        ]);
        $article->blocks = $this->textBlocks($page['body'] ?? null);
        $article->save();

        return $article;
    }

    /**
     * @param  array<string, list<array<string, string>>>  $menus
     * @param  array<string, CmsArticle>  $pages
     */
    private function createMenus(array $menus, array $pages): void
    {
        foreach ($menus as $slug => $items) {
            $menu = CmsMenu::create(['name' => Str::headline($slug), 'slug' => $slug, 'auto_add_pages' => false, 'auto_add_subpages' => false, 'active' => true]);
            foreach ($items as $position => $item) {
                CmsMenuItem::create([
                    'menu_id' => $menu->id,
                    'title' => $item['title'],
                    'article_id' => isset($item['page']) ? $pages[$item['page']]->id : null,
                    'url' => isset($item['url']) ? $this->resolve($item['url']) : null,
                    'position' => $position,
                    'active' => true,
                ]);
            }
        }
    }

    /**
     * The journal's articles and tags.
     *
     * @param  array<string, mixed>  $journal
     * @return list<array<string, string>> the newest articles, as cards for the shop's home page
     */
    private function createPosts(array $journal, int $schemaId, ?int $langId, ?int $userId, string $blogUrl): array
    {
        $tags = [];
        foreach ($journal['tags'] as $slug => $name) {
            $tags[$slug] = CmsTag::create(['name' => $name, 'slug' => $slug, 'active' => true]);
        }

        $cards = [];
        foreach ($journal['posts'] as $data) {
            $post = new CmsPost([
                'user_id' => $userId,
                'lang_id' => $langId,
                'schema_id' => $schemaId,
                'post_type' => 'post',
                'title' => $data['title'],
                'slug' => $data['slug'],
                'excerpt' => $data['excerpt'],
                'featured_image' => $this->resolve($data['image']),
                'metadata' => [
                    'author' => $data['author'],
                    'image_credit' => 'Photo: Unsplash',
                    'image_credit_url' => 'https://unsplash.com',
                ],
                'status' => 'published',
                'published_at' => now()->subDays($data['days_ago'])->setTime(8, 30),
                'active' => true,
            ]);
            $post->blocks = $this->textBlocks($this->resolve($data['body']));
            $post->save();
            $post->tags()->sync(collect($data['tags'])->map(fn (string $slug): int => $tags[$slug]->id)->all());

            $cards[] = [
                'title' => $post->title,
                'label' => $journal['tags'][$data['tags'][0]],
                'image' => $post->featured_image,
                'url' => "{$blogUrl}/blog/{$post->slug}",
            ];
        }
        $this->line('  '.Sites::current()?->title.': '.count($cards).' articles, '.count($tags).' tags');

        return $cards;
    }

    /**
     * @param  array<string, mixed>  $form
     */
    private function createForm(array $form): void
    {
        $model = CmsForm::create(['name' => $form['name'], 'alias' => $form['alias'], 'info' => $form['info'], 'active' => true]);
        foreach ($form['fields'] as $field) {
            CmsFormField::create(['form_id' => $model->id, 'options' => $field['options'] ?? null, 'active' => true] + $field);
        }
    }

    /**
     * One text block, or null for a page without body text.
     *
     * @return list<array<string, mixed>>|null
     */
    private function textBlocks(?string $html): ?array
    {
        return $html ? [['type' => 'rich_text', 'data' => ['html' => $this->resolve($html)]]] : null;
    }

    /**
     * Replace "@photo" values with the photo's URL and {shop}/{journal} with the sites' addresses.
     */
    private function resolve(mixed $value): mixed
    {
        if (is_array($value)) {
            return array_map($this->resolve(...), $value);
        }
        if (! is_string($value)) {
            return $value;
        }
        if (str_starts_with($value, '@') && isset($this->photos[substr($value, 1)])) {
            return $this->photos[substr($value, 1)];
        }

        return strtr($value, $this->replacements);
    }
}
