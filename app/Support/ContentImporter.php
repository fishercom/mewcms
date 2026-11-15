<?php

namespace App\Support;

use App\Models\CmsArticle;
use App\Models\CmsBlockPattern;
use App\Models\CmsConfig;
use App\Models\CmsForm;
use App\Models\CmsFormField;
use App\Models\CmsLang;
use App\Models\CmsMedia;
use App\Models\CmsMenu;
use App\Models\CmsMenuItem;
use App\Models\CmsPost;
use App\Models\CmsPostType;
use App\Models\CmsSchema;
use App\Models\CmsSchemaGroup;
use App\Models\CmsSite;
use App\Models\CmsSlide;
use App\Models\CmsSlider;
use App\Models\CmsTag;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use JsonException;
use RuntimeException;

/**
 * Loads a site's starting content from a JSON file: the content a theme ships in
 * resources/themes/<theme>/content/content.json, or any other file in that format.
 * The format is described in resources/themes/README.md ("Starting content").
 *
 * The CMS itself never needs it: the database seeder only creates what the admin needs,
 * and a site gets its pages, menus, forms and media from here only when asked
 * (php artisan cms:content-import).
 */
class ContentImporter
{
    /** Content of one site, deleted by fresh() */
    private const SITE_TABLES = ['cms_articles', 'cms_posts', 'cms_menus', 'cms_forms', 'cms_sliders', 'cms_redirects'];

    /** @var array<string, mixed> */
    private array $data;

    /** Folder of the JSON file: "file" media paths are relative to it */
    private string $base;

    /** @var array<string, string> media key => URL in the library */
    private array $media = [];

    /** @var array<string, string> "{name}" => value */
    private array $replacements = [];

    /** @var array<string, int> schema key => id */
    private array $schemas = [];

    /** @var array<string, CmsTag> */
    private array $tags = [];

    /** @var array<string, CmsArticle> page slug => page */
    private array $pages = [];

    /** @var list<CmsPost> */
    private array $posts = [];

    /** @var (callable(string): void)|null */
    private $log = null;

    /**
     * @param  array<string, mixed>  $data
     */
    public function __construct(array $data, string $base, private readonly string $mediaFolder = 'content')
    {
        $this->data = $data;
        $this->base = rtrim($base, '/');
    }

    /**
     * The content file of a built theme, or null when the theme ships none.
     */
    public static function themeFile(string $theme): ?string
    {
        $file = Themes::dir($theme, 'content/content.json');

        return is_file($file) ? $file : null;
    }

    public static function fromFile(string $file): self
    {
        if (! is_file($file)) {
            throw new RuntimeException("Content file not found: {$file}");
        }

        try {
            $data = json_decode((string) file_get_contents($file), true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException $e) {
            throw new RuntimeException("{$file} is not valid JSON: {$e->getMessage()}");
        }
        if (! is_array($data)) {
            throw new RuntimeException("{$file} must hold a JSON object.");
        }

        $folder = basename(dirname($file)) === 'content' ? basename(dirname($file, 2)) : pathinfo($file, PATHINFO_FILENAME);

        return new self($data, dirname($file), Str::slug($folder) ?: 'content');
    }

    /**
     * @return array<string, mixed>
     */
    public function data(): array
    {
        return $this->data;
    }

    /**
     * Values for "{name}" placeholders in the file's texts and links.
     *
     * @param  array<string, string>  $values
     */
    public function with(array $values): self
    {
        foreach ($values as $name => $value) {
            $this->replacements['{'.$name.'}'] = $value;
        }

        return $this;
    }

    /**
     * @param  callable(string): void  $log
     */
    public function logUsing(callable $log): self
    {
        $this->log = $log;

        return $this;
    }

    /**
     * Delete the pages, posts, menus, forms, sliders and redirects of a site, and its own
     * settings. Shared things (field groups, post types, tags, media) are kept.
     */
    public static function fresh(CmsSite $site): void
    {
        $articles = DB::table('cms_articles')->where('site_id', $site->id)->pluck('id');
        $posts = DB::table('cms_posts')->where('site_id', $site->id)->pluck('id');

        Schema::disableForeignKeyConstraints();
        try {
            DB::table('cms_article_term')->whereIn('article_id', $articles)->delete();
            DB::table('cms_post_term')->whereIn('post_id', $posts)->delete();
            DB::table('cms_revisions')->where(fn ($query) => $query
                ->where(fn ($q) => $q->where('revisionable_type', (new CmsArticle)->getMorphClass())->whereIn('revisionable_id', $articles))
                ->orWhere(fn ($q) => $q->where('revisionable_type', (new CmsPost)->getMorphClass())->whereIn('revisionable_id', $posts)))
                ->delete();
            DB::table('cms_menu_items')->whereIn('menu_id', DB::table('cms_menus')->where('site_id', $site->id)->pluck('id'))->delete();
            DB::table('cms_form_fields')->whereIn('form_id', DB::table('cms_forms')->where('site_id', $site->id)->pluck('id'))->delete();
            DB::table('cms_slides')->whereIn('slider_id', DB::table('cms_sliders')->where('site_id', $site->id)->pluck('id'))->delete();
            foreach (self::SITE_TABLES as $table) {
                DB::table($table)->where('site_id', $site->id)->delete();
            }
            DB::table('cms_configs')->where('site_id', $site->id)->delete();
        } finally {
            Schema::enableForeignKeyConstraints();
        }
    }

    /**
     * Load the file into a site. The site's own fields (name, title, language...) are
     * updated from "site", and its theme is set when $theme is given.
     */
    public function import(CmsSite $site, ?string $theme = null): void
    {
        $this->replacements += ['{site}' => rtrim((string) ($site->site_url ?: config('app.url')), '/')];

        $userId = User::orderBy('id')->value('id');

        // All or nothing: a mistake in the file leaves the site as it was
        DB::transaction(function () use ($site, $theme, $userId): void {
            $this->updateSite($site, $theme);
            $langId = $site->lang_id;

            $this->importMedia($userId);
            $this->importSchemas();
            $this->importPostTypes();
            $this->importTags();

            // Inside the site, so the blocks of its theme are known
            Sites::as($site, function () use ($langId, $userId): void {
                $this->importPatterns();
                $this->importSettings();
                $this->importForms();
                $this->importSliders();
                $this->importPages($langId);
                $this->importPosts($langId, $userId);
                $this->importMenus($langId);
            });
        });

        Sites::flush();
        FrontCache::flush();
    }

    /**
     * @return array<string, CmsArticle> page slug => page
     */
    public function pages(): array
    {
        return $this->pages;
    }

    /**
     * @return list<CmsPost>
     */
    public function posts(): array
    {
        return $this->posts;
    }

    /**
     * Download the media the file links to, without changing anything else, so an import
     * that follows needs no network.
     */
    public function prefetch(): void
    {
        foreach ((array) ($this->data['media'] ?? []) as $key => $item) {
            $item = is_string($item) ? ['url' => $item] : (array) $item;
            if (! isset($item['file'])) {
                $this->mediaContents((string) $key, $item);
            }
        }
    }

    private function updateSite(CmsSite $site, ?string $theme): void
    {
        $info = (array) ($this->data['site'] ?? []);

        if (isset($info['lang'])) {
            $lang = CmsLang::where('iso', $info['lang'])->first();
            if ($lang) {
                $site->lang_id = $lang->id;
            }
        }

        $site->fill(collect($info)->only(['name', 'title', 'description', 'currency', 'favicon'])->map($this->resolve(...))->all());
        if ($theme !== null) {
            $site->theme = $theme;
        }
        $site->save();
    }

    private function importMedia(?int $userId): void
    {
        $items = (array) ($this->data['media'] ?? []);
        if ($items === []) {
            return;
        }

        $this->say('Media library');
        $disk = Storage::disk(MediaLibrary::DISK);

        foreach ($items as $key => $item) {
            $item = is_string($item) ? ['url' => $item] : (array) $item;
            [$contents, $extension] = $this->mediaContents((string) $key, $item);
            $path = "media/{$this->mediaFolder}/".Str::slug((string) $key).'.'.$extension;

            $media = CmsMedia::where('path', $path)->first();
            if (! $media) {
                $disk->put($path, $contents);
                $media = MediaLibrary::register($path, $this->mime($extension), $userId, [
                    'filename' => basename($path),
                    'title' => $item['title'] ?? Str::headline((string) $key),
                    'alt' => $item['alt'] ?? null,
                    'caption' => $item['caption'] ?? null,
                ]);
                $this->say("  + {$path}");
            }
            $this->media[(string) $key] = '/storage/'.$media->path;
        }
    }

    /**
     * The file of a media item: from the content folder ("file") or downloaded once
     * ("url") and kept in storage/app/private/content-cache, so a re-run needs no network.
     *
     * @param  array<string, mixed>  $item
     * @return array{0: string, 1: string} contents, extension
     */
    private function mediaContents(string $key, array $item): array
    {
        if (isset($item['file'])) {
            $file = $this->base.'/'.ltrim((string) $item['file'], '/');
            $real = realpath($file);
            if ($real === false || ! str_starts_with($real, (realpath($this->base) ?: $this->base).DIRECTORY_SEPARATOR)) {
                throw new RuntimeException("Media \"{$key}\": {$item['file']} is not a file in the content folder.");
            }

            return [(string) file_get_contents($real), strtolower(pathinfo($real, PATHINFO_EXTENSION)) ?: 'jpg'];
        }

        $url = (string) ($item['url'] ?? '');
        if (! str_starts_with($url, 'https://') && ! str_starts_with($url, 'http://')) {
            throw new RuntimeException("Media \"{$key}\" needs a \"file\" or an http(s) \"url\".");
        }

        $cache = Storage::disk('local');
        $extension = strtolower(pathinfo((string) parse_url($url, PHP_URL_PATH), PATHINFO_EXTENSION));
        $extension = in_array($extension, ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'mp4', 'webm', 'pdf'], true) ? $extension : 'jpg';
        $cached = 'content-cache/'.sha1($url).'.'.$extension;

        if (! $cache->exists($cached) || $cache->size($cached) === 0) {
            $response = Http::timeout(60)->retry(3, 1000, throw: false)->get($url);
            if (! $response->successful()) {
                throw new RuntimeException("Could not download media \"{$key}\" from {$url} (HTTP {$response->status()}).");
            }
            $cache->put($cached, $response->body());
            $this->say("  ↓ {$key}");
        }

        return [(string) $cache->get($cached), $extension];
    }

    private function mime(string $extension): string
    {
        return match ($extension) {
            'png' => 'image/png',
            'gif' => 'image/gif',
            'webp' => 'image/webp',
            'svg' => 'image/svg+xml',
            'mp4' => 'video/mp4',
            'webm' => 'video/webm',
            'pdf' => 'application/pdf',
            default => 'image/jpeg',
        };
    }

    /**
     * Field groups are shared by every site: one with the same name is updated.
     */
    private function importSchemas(): void
    {
        $schemas = (array) ($this->data['schemas'] ?? []);
        if ($schemas === []) {
            return;
        }

        $groupId = CmsSchemaGroup::orderByDesc('default')->orderBy('id')->value('id')
            ?? CmsSchemaGroup::create(['name' => 'Templates', 'layout' => 'front', 'default' => true, 'active' => true])->id;

        foreach ($schemas as $key => $schema) {
            $model = CmsSchema::firstOrNew(['group_id' => $groupId, 'name' => $schema['name'] ?? Str::headline((string) $key)]);
            $model->fill([
                'fields' => $schema['fields'] ?? [],
                'front_view' => $schema['template'] ?? null,
                'active' => true,
            ] + collect($schema)->only(['allowed_blocks', 'default_blocks'])->all());
            $model->forceFill(['type' => $schema['type'] ?? null])->save();
            $this->schemas[(string) $key] = $model->id;
        }
        $this->say('Field groups: '.count($schemas));
    }

    /**
     * Reusable blocks ("patterns"), shared by every site like field groups: each is
     * found by its key and updated, so importing again does not duplicate them. A page
     * shows a synced one with a block {"type": "pattern", "data": {"pattern": "..."}}.
     */
    private function importPatterns(): void
    {
        $patterns = (array) ($this->data['patterns'] ?? []);
        foreach ($patterns as $key => $pattern) {
            $key = (string) ($pattern['key'] ?? $key);
            CmsBlockPattern::updateOrCreate(['key' => $key], [
                'name' => $pattern['name'] ?? Str::headline($key),
                'description' => $pattern['description'] ?? null,
                'category' => $pattern['category'] ?? 'general',
                'blocks' => $this->resolve($pattern['blocks'] ?? []),
                'synced' => (bool) ($pattern['synced'] ?? true),
                'active' => true,
            ]);
        }
        if ($patterns !== []) {
            $this->say('Reusable blocks: '.count($patterns));
        }
    }

    private function importPostTypes(): void
    {
        foreach ((array) ($this->data['post_types'] ?? []) as $type) {
            $model = CmsPostType::firstOrNew(['slug' => $type['slug']]);
            $model->fill([
                'name' => $type['name'] ?? Str::headline($type['slug']),
                'singular_name' => $type['singular_name'] ?? $type['name'] ?? Str::headline($type['slug']),
                'icon' => $type['icon'] ?? 'book-open',
                'description' => $type['description'] ?? null,
                'default_schema_id' => isset($type['schema']) ? $this->schemaId($type['schema']) : null,
                'active' => true,
            ] + collect($type)->only(['per_page', 'order'])->all());
            $model->save();
        }
    }

    private function importTags(): void
    {
        foreach ((array) ($this->data['tags'] ?? []) as $slug => $name) {
            $this->tags[(string) $slug] = CmsTag::firstOrCreate(['slug' => (string) $slug], ['name' => $name, 'active' => true]);
        }
    }

    private function importSettings(): void
    {
        foreach ((array) ($this->data['settings'] ?? []) as $alias => $value) {
            $value = $this->resolve($value);
            CmsConfig::updateOrCreate(['site_id' => Sites::currentId(), 'alias' => $alias], [
                'name' => Str::of($alias)->after('layout_')->headline()->toString(),
                'type' => is_array($value) ? 'json' : 'string',
                'value' => is_array($value) ? json_encode($value, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) : $value,
            ]);
        }
    }

    private function importForms(): void
    {
        foreach ((array) ($this->data['forms'] ?? []) as $form) {
            $model = CmsForm::create(['name' => $form['name'], 'alias' => $form['alias'], 'info' => $form['info'] ?? null, 'active' => true]);
            foreach ((array) ($form['fields'] ?? []) as $field) {
                CmsFormField::create([
                    'form_id' => $model->id,
                    'name' => $field['name'],
                    'alias' => $field['alias'] ?? Str::snake($field['name']),
                    'type' => $field['type'] ?? 'text',
                    'options' => $field['options'] ?? null,
                    'active' => true,
                ]);
            }
        }
    }

    private function importSliders(): void
    {
        foreach ((array) ($this->data['sliders'] ?? []) as $slider) {
            $model = CmsSlider::create([
                'name' => $slider['name'] ?? Str::headline($slider['key']),
                'key' => $slider['key'],
                'description' => $slider['description'] ?? null,
                'settings' => $slider['settings'] ?? null,
            ]);
            foreach (array_values((array) ($slider['slides'] ?? [])) as $position => $slide) {
                CmsSlide::create([
                    'slider_id' => $model->id,
                    'title' => $this->resolve($slide['title'] ?? null),
                    'caption' => $this->resolve($slide['caption'] ?? null),
                    'image_url' => $this->resolve($slide['image'] ?? ''),
                    'image_mobile_url' => $this->resolve($slide['image_mobile'] ?? null),
                    'video_url' => $this->resolve($slide['video'] ?? null),
                    'secondary_image_url' => $this->resolve($slide['secondary_image'] ?? null),
                    'link_url' => $this->resolve($slide['url'] ?? null),
                    'button_label' => $this->resolve($slide['button_label'] ?? null),
                    'position' => $position + 1,
                    'active' => true,
                ]);
            }
        }
    }

    private function importPages(?int $langId): void
    {
        $pages = (array) ($this->data['pages'] ?? []);
        foreach (array_values($pages) as $position => $page) {
            $article = new CmsArticle([
                'schema_id' => isset($page['schema']) ? $this->schemaId($page['schema']) : null,
                'parent_id' => isset($page['parent']) ? ($this->pages[$page['parent']]->id ?? null) : null,
                'lang_id' => $langId,
                'title' => $this->resolve($page['title']),
                'slug' => $page['slug'],
                'excerpt' => $this->resolve($page['excerpt'] ?? null),
                'featured_image' => $this->resolve($page['featured_image'] ?? null),
                'metadata' => $this->resolve($page['metadata'] ?? []),
                'status' => $page['status'] ?? 'published',
                'published_at' => now()->subDays((int) ($page['days_ago'] ?? 0)),
                'active' => true,
            ]);
            $article->blocks = $this->blocks($page);
            $article->save();
            if (isset($page['tags'])) {
                $article->tags()->sync($this->tagIds($page['tags']));
            }
            $this->pages[$page['slug']] = $article;
        }
        if ($pages !== []) {
            $this->say('  '.Sites::current()?->name.': '.count($pages).' pages');
        }
    }

    private function importPosts(?int $langId, ?int $userId): void
    {
        $posts = (array) ($this->data['posts'] ?? []);
        foreach ($posts as $data) {
            $post = new CmsPost([
                'user_id' => $userId,
                'lang_id' => $langId,
                'schema_id' => isset($data['schema']) ? $this->schemaId($data['schema']) : null,
                'post_type' => $data['type'] ?? 'post',
                'title' => $this->resolve($data['title']),
                'slug' => $data['slug'],
                'excerpt' => $this->resolve($data['excerpt'] ?? null),
                'featured_image' => $this->resolve($data['featured_image'] ?? null),
                'metadata' => $this->resolve($data['metadata'] ?? []),
                'status' => $data['status'] ?? 'published',
                // 8:30 on that day, or now when that is still to come (a post dated later stays hidden)
                'published_at' => now()->subDays((int) ($data['days_ago'] ?? 0))->setTime(8, 30)->min(now()),
                'active' => true,
            ]);
            $post->blocks = $this->blocks($data);
            $post->save();
            $post->tags()->sync($this->tagIds($data['tags'] ?? []));
            $this->posts[] = $post;
        }
        if ($posts !== []) {
            $this->say('  '.Sites::current()?->name.': '.count($posts).' posts, '.count($this->tags).' tags');
        }
    }

    private function importMenus(?int $langId): void
    {
        foreach ((array) ($this->data['menus'] ?? []) as $slug => $items) {
            $menu = CmsMenu::create([
                'lang_id' => $langId,
                'name' => Str::headline((string) $slug),
                'slug' => (string) $slug,
                'auto_add_pages' => false,
                'auto_add_subpages' => false,
                'active' => true,
            ]);
            $this->menuItems($menu, (array) $items, null);
        }
    }

    /**
     * @param  list<array<string, mixed>>  $items
     */
    private function menuItems(CmsMenu $menu, array $items, ?int $parentId): void
    {
        foreach (array_values($items) as $position => $item) {
            if (isset($item['page']) && ! isset($this->pages[$item['page']])) {
                throw new RuntimeException("Menu \"{$menu->slug}\" links to the page \"{$item['page']}\", which the file does not have.");
            }
            $model = CmsMenuItem::create([
                'menu_id' => $menu->id,
                'parent_id' => $parentId,
                'title' => $this->resolve($item['title']),
                'article_id' => isset($item['page']) ? $this->pages[$item['page']]->id : null,
                'url' => isset($item['url']) ? $this->resolve($item['url']) : (isset($item['page']) ? null : '#'),
                'target' => $item['target'] ?? '_self',
                'position' => $position + 1,
                'active' => true,
            ]);
            $this->menuItems($menu, (array) ($item['children'] ?? []), $model->id);
        }
    }

    /**
     * The blocks of a page or post: its "blocks" as they are, or one text block with its "body".
     *
     * @param  array<string, mixed>  $item
     * @return list<array<string, mixed>>|null
     */
    private function blocks(array $item): ?array
    {
        if (isset($item['blocks'])) {
            return $this->resolve($item['blocks']);
        }

        $html = $this->resolve($item['body'] ?? null);

        return $html ? [['type' => 'rich_text', 'data' => ['html' => $html]]] : null;
    }

    /**
     * @param  list<string>  $slugs
     * @return list<int>
     */
    private function tagIds(array $slugs): array
    {
        return collect($slugs)->map(function (string $slug): int {
            $this->tags[$slug] ??= CmsTag::firstOrCreate(['slug' => $slug], ['name' => Str::headline($slug), 'active' => true]);

            return $this->tags[$slug]->id;
        })->all();
    }

    private function schemaId(string $key): int
    {
        if (isset($this->schemas[$key])) {
            return $this->schemas[$key];
        }

        // A field group the file does not define: one the CMS already has, by name or template
        $id = CmsSchema::where('name', $key)->orWhere('front_view', $key)->value('id');
        if (! $id) {
            throw new RuntimeException("The field group \"{$key}\" is not in the file's \"schemas\".");
        }

        return $this->schemas[$key] = $id;
    }

    /**
     * Replace "@key" values with the URL of that media item, and {name} with its value.
     */
    private function resolve(mixed $value): mixed
    {
        if (is_array($value)) {
            return array_map($this->resolve(...), $value);
        }
        if (! is_string($value)) {
            return $value;
        }
        if (str_starts_with($value, '@') && isset($this->media[substr($value, 1)])) {
            return $this->media[substr($value, 1)];
        }

        return strtr($value, $this->replacements);
    }

    private function say(string $line): void
    {
        if ($this->log) {
            ($this->log)($line);
        }
    }
}
