<?php

namespace App\Support;

use App\Ai\AiException;
use App\Ai\AiManager;
use App\Ai\ContentTranslator;
use App\Ai\TextTranslator;
use App\Models\CmsArticle;
use App\Models\CmsLang;
use App\Models\CmsMenu;
use App\Models\CmsPost;
use App\Models\CmsTranslation;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * "Preparar versión en …": builds a new language of the current site from its main
 * language, one step at a time so that a long run never hits a time limit and can be
 * resumed. Each page and post gets a draft version (translated by the AI when asked),
 * each menu a copy, and the theme texts the language lacks are translated. A last step
 * points the links inside the new versions at the translated addresses.
 *
 * Every step is safe to repeat: what was done already is skipped.
 */
class LanguagePreparer
{
    public const TASK_PAGE = 'page';

    public const TASK_POST = 'post';

    public const TASK_MENU = 'menu';

    public const TASK_TEXTS = 'texts';

    public const TASK_LINKS = 'links';

    public function __construct(
        protected AiManager $ai,
        protected ContentTranslator $content,
        protected TextTranslator $texts,
    ) {}

    /**
     * Pages of the main language without a version in $lang, parents first.
     *
     * @return Collection<int, CmsArticle>
     */
    public function pendingPages(CmsLang $lang): Collection
    {
        return $this->pending(CmsArticle::query(), $lang)
            ->sortBy(fn (CmsArticle $page): array => [substr_count((string) $page->uri, '/'), (int) $page->position, $page->id])
            ->values();
    }

    /**
     * Posts of the main language without a version in $lang, oldest first.
     *
     * @return Collection<int, CmsPost>
     */
    public function pendingPosts(CmsLang $lang): Collection
    {
        return $this->pending(CmsPost::query(), $lang)->sortBy('id')->values();
    }

    /**
     * Menus of the main language that $lang has no copy of.
     *
     * @return Collection<int, CmsMenu>
     */
    public function pendingMenus(CmsLang $lang): Collection
    {
        $copied = CmsMenu::where('lang_id', $lang->id)->pluck('slug')->all();

        return Locales::scope(CmsMenu::query(), Locales::main()?->id)
            ->whereNotIn('slug', $copied)
            ->orderBy('id')
            ->get();
    }

    /**
     * Theme texts $lang lacks (and the site has not written), with their English text.
     *
     * @return array<string, string>
     */
    public function missingTexts(CmsLang $lang): array
    {
        $locale = ThemeTexts::normalizeLocale((string) $lang->iso);
        if ($locale === ThemeTexts::FALLBACK) {
            return [];
        }

        $theme = Themes::current();
        $source = ThemeTexts::defaults($theme, ThemeTexts::FALLBACK);

        return array_intersect_key($source, array_flip(ThemeTexts::missing($theme, $locale)));
    }

    /**
     * The steps still to run for $lang, in order. The theme texts are only translated by
     * the AI, so they are left out without it.
     *
     * @return list<array{type: string, id: int|null, title: string}>
     */
    public function tasks(CmsLang $lang, bool $ai): array
    {
        $tasks = [];
        foreach ($this->pendingPages($lang) as $page) {
            $tasks[] = ['type' => self::TASK_PAGE, 'id' => $page->id, 'title' => (string) $page->title];
        }
        foreach ($this->pendingPosts($lang) as $post) {
            $tasks[] = ['type' => self::TASK_POST, 'id' => $post->id, 'title' => (string) $post->title];
        }
        foreach ($this->pendingMenus($lang) as $menu) {
            $tasks[] = ['type' => self::TASK_MENU, 'id' => $menu->id, 'title' => (string) $menu->name];
        }
        if ($ai) {
            $count = count($this->missingTexts($lang));
            for ($i = 0; $i < (int) ceil($count / TextTranslator::CHUNK); $i++) {
                $tasks[] = ['type' => self::TASK_TEXTS, 'id' => null, 'title' => __('Textos del tema')];
            }
        }
        $tasks[] = ['type' => self::TASK_LINKS, 'id' => null, 'title' => __('Enlaces entre páginas')];

        return $tasks;
    }

    /**
     * What is left to prepare, and what the AI would cost (null when it has no price).
     *
     * @return array{pages: int, posts: int, menus: int, texts: int, cost: float|null}
     */
    public function summary(CmsLang $lang): array
    {
        $pages = $this->pendingPages($lang);
        $posts = $this->pendingPosts($lang);
        $menus = $this->pendingMenus($lang);
        $texts = $this->missingTexts($lang);

        $chars = $pages->concat($posts)->sum(fn (Model $item): int => $this->content->size($item))
            + array_sum(array_map('mb_strlen', $texts))
            + $menus->sum(fn (CmsMenu $menu): int => (int) $menu->items()->get()->sum(fn ($item): int => mb_strlen((string) $item->title)));
        $calls = $pages->count() + $posts->count() + $menus->count() + (int) ceil(count($texts) / TextTranslator::CHUNK);

        return [
            'pages' => $pages->count(),
            'posts' => $posts->count(),
            'menus' => $menus->count(),
            'texts' => count($texts),
            'cost' => $this->cost($chars, $calls),
        ];
    }

    /**
     * Estimated cost in USD of translating $chars characters in $calls calls: about four
     * characters a token, as many tokens back (plus the JSON around them), and the
     * instructions of each call.
     */
    protected function cost(int $chars, int $calls): ?float
    {
        $price = $this->ai->price($this->ai->model('fast'));
        if (! $price) {
            return null;
        }

        $input = $chars / 4 * 1.3 + $calls * 400;
        $output = $chars / 4 * 1.4;

        return round(($input * $price['input'] + $output * $price['output']) / 1_000_000, 4);
    }

    /**
     * Run one step. Returns the item it made (title and editor address), if any.
     *
     * @return array{title?: string, edit_url?: string}
     *
     * @throws AiException
     */
    public function run(string $type, ?int $id, CmsLang $lang, bool $ai, ?User $user): array
    {
        $result = match ($type) {
            self::TASK_PAGE => $this->version(CmsArticle::find($id), $lang, $ai, $user),
            self::TASK_POST => $this->version(CmsPost::find($id), $lang, $ai, $user),
            self::TASK_MENU => $this->menu(CmsMenu::find($id), $lang, $ai, $user),
            self::TASK_TEXTS => $ai ? $this->themeTexts($lang, $user) : [],
            self::TASK_LINKS => $this->links($lang),
            default => [],
        };
        FrontCache::flush();

        return $result;
    }

    /**
     * @return array{title?: string, edit_url?: string}
     */
    protected function version(CmsArticle|CmsPost|null $item, CmsLang $lang, bool $ai, ?User $user): array
    {
        // Gone, in another language, or done in an earlier run
        if (! $item || Locales::forContent($item->lang_id)?->id !== Locales::main()?->id || $item->translationIn($lang->id)) {
            return [];
        }

        $attributes = $ai
            ? $this->content->translate($item, $this->languageName(Locales::main()), $this->languageName($lang), $user)
            : [];
        $version = ContentVersions::create($item, $lang, $user?->id, $attributes);

        return ['title' => (string) $version->title, 'edit_url' => $this->editUrl($version)];
    }

    /**
     * @return array{title?: string, edit_url?: string}
     */
    protected function menu(?CmsMenu $menu, CmsLang $lang, bool $ai, ?User $user): array
    {
        if (! $menu) {
            return [];
        }

        $translate = $ai ? function (array $labels) use ($lang, $user, $menu): array {
            $keyed = [];
            foreach (array_values($labels) as $index => $label) {
                $keyed['menu.item_'.$index] = $label;
            }
            $translated = $this->texts->translate($keyed, $this->languageName(Locales::main()), $this->languageName($lang), 'labels of the website menu «'.$menu->name.'»', $user);

            $out = [];
            foreach ($keyed as $key => $label) {
                if (isset($translated[$key])) {
                    $out[$label] = $translated[$key];
                }
            }

            return $out;
        } : null;

        $copy = MenuCopier::copy($menu, $lang, $translate);

        return ['title' => (string) $copy->name, 'edit_url' => route('menus.edit', $copy->id)];
    }

    /**
     * Translate the next batch of theme texts $lang lacks, saved as the site's own texts.
     *
     * @return array{title?: string}
     */
    protected function themeTexts(CmsLang $lang, ?User $user): array
    {
        $texts = array_slice($this->missingTexts($lang), 0, TextTranslator::CHUNK, true);
        if ($texts === []) {
            return [];
        }

        $locale = ThemeTexts::normalizeLocale((string) $lang->iso);
        $theme = Themes::current();
        $context = 'interface texts of the theme «'.(Themes::all()[$theme]['name'] ?? $theme).'» on the website «'.Sites::current()?->name.'»';
        $translated = $this->texts->translate($texts, TextTranslator::languageName(ThemeTexts::FALLBACK), TextTranslator::languageName($locale), $context, $user);

        foreach ($translated as $key => $value) {
            CmsTranslation::updateOrCreate(['locale' => $locale, 'key' => $key], ['value' => $value]);
        }
        ThemeTexts::flush();

        return ['title' => trans_choice(':count texto|:count textos', count($translated), ['count' => count($translated)])];
    }

    /**
     * Point the links inside the versions in $lang at the versions' addresses: a link to
     * "/nosotros" in the English "Home" becomes "/en/about" once "Nosotros" has a version.
     *
     * @return array{title?: string}
     */
    public function links(CmsLang $lang): array
    {
        $map = [];
        $versions = [];
        foreach ([CmsArticle::class, CmsPost::class] as $class) {
            $inLang = $class::where('lang_id', $lang->id)->whereNotNull('translation_group')->get();
            $main = Locales::scope($class::query(), Locales::main()?->id)
                ->whereIn('translation_group', $inLang->pluck('translation_group'))
                ->get()
                ->keyBy('translation_group');
            foreach ($inLang as $version) {
                $original = $main->get($version->translation_group);
                if ($original && $original->url !== $version->url) {
                    $map[$original->url] = $version->url;
                }
                $versions[] = $version;
            }
        }
        if ($map === []) {
            return [];
        }

        $changed = 0;
        foreach ($versions as $version) {
            $content = $this->rewrite($version->content, $map);
            $blocks = is_array($version->blocks) ? $this->rewrite($version->blocks, $map) : $version->blocks;
            if ($content !== $version->content || $blocks !== $version->blocks) {
                $version->forceFill(['content' => $content, 'blocks' => $blocks])->save();
                $changed++;
            }
        }

        return ['title' => trans_choice(':count página actualizada|:count páginas actualizadas', $changed, ['count' => $changed])];
    }

    /**
     * $value with every internal link of $map replaced: whole values ("/nosotros" in a
     * link field) and href="..." inside HTML.
     *
     * @param  array<string, string>  $map
     */
    protected function rewrite(mixed $value, array $map): mixed
    {
        if (is_array($value)) {
            return array_map(fn ($item) => $this->rewrite($item, $map), $value);
        }
        if (! is_string($value) || ! str_contains($value, '/')) {
            return $value;
        }
        if (isset($map[$value])) {
            return $map[$value];
        }

        return preg_replace_callback('/href=(["\'])(\/[^"\'#?]*)([#?][^"\']*)?\1/', function (array $match) use ($map): string {
            $path = $map[$match[2]] ?? $match[2];

            return 'href='.$match[1].$path.($match[3] ?? '').$match[1];
        }, $value) ?? $value;
    }

    /**
     * Drafts in $lang made from a published page or post of the main language, to review.
     *
     * @return list<array{id: int, type: string, title: string, edit_url: string, url: string}>
     */
    public function drafts(CmsLang $lang): array
    {
        return collect([CmsArticle::class, CmsPost::class])
            ->flatMap(fn (string $class) => $this->publishable($class, $lang))
            ->map(fn (CmsArticle|CmsPost $item): array => [
                'id' => $item->id,
                'type' => $item instanceof CmsArticle ? self::TASK_PAGE : self::TASK_POST,
                'title' => (string) $item->title,
                'edit_url' => $this->editUrl($item),
                'url' => $item->url,
            ])
            ->values()
            ->all();
    }

    /**
     * Publish every draft listed by drafts(). Returns how many.
     */
    public function publish(CmsLang $lang, ?User $user): int
    {
        $count = 0;
        foreach ([CmsArticle::class, CmsPost::class] as $class) {
            foreach ($this->publishable($class, $lang) as $item) {
                $item->forceFill(['status' => $item::STATUS_PUBLISHED])->save();
                $item->recordSave($user?->id);
                $count++;
            }
        }
        FrontCache::flush();

        return $count;
    }

    /**
     * @param  class-string<CmsArticle|CmsPost>  $class
     * @return Collection<int, CmsArticle|CmsPost>
     */
    protected function publishable(string $class, CmsLang $lang): Collection
    {
        $live = Locales::scope($class::query(), Locales::main()?->id)
            ->whereNotNull('translation_group')
            // Pages have always treated an empty status as published
            ->where(fn ($query) => $query->where('status', $class::STATUS_PUBLISHED)->orWhereNull('status'))
            ->pluck('translation_group');

        return $class::where('lang_id', $lang->id)
            ->where('status', $class::STATUS_DRAFT)
            ->whereIn('translation_group', $live)
            ->orderBy('id')
            ->get();
    }

    /**
     * Rows of the main language with no version in $lang.
     *
     * @template T of Model
     *
     * @param  Builder<T>  $query
     * @return Collection<int, T>
     */
    protected function pending($query, CmsLang $lang): Collection
    {
        $model = $query->getModel();
        $done = $model->newQuery()->where('lang_id', $lang->id)->whereNotNull('translation_group')->pluck('translation_group');

        return Locales::scope($query, Locales::main()?->id)
            ->where(fn ($query) => $query->whereNull('translation_group')->orWhereNotIn('translation_group', $done))
            ->get();
    }

    protected function editUrl(CmsArticle|CmsPost $item): string
    {
        return $item instanceof CmsArticle
            ? route('articles.edit', $item->id)
            : route('posts.edit', ['post' => $item->id, 'post_type' => $item->post_type]);
    }

    protected function languageName(?CmsLang $lang): string
    {
        return $lang ? TextTranslator::languageName((string) $lang->iso) : 'the source language';
    }
}
