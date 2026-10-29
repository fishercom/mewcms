<?php

namespace App\Http\Controllers;

use App\Blocks\BlockRegistry;
use App\Models\CmsArticle;
use App\Models\CmsForm;
use App\Models\CmsPost;
use App\Models\CmsPostType;
use App\Models\CmsRegister;
use App\Models\CmsRegisterField;
use App\Models\CmsSlider;
use App\Models\CmsTag;
use App\Support\ContentSanitizer;
use App\Support\FrontCache;
use App\Support\MediaLibrary;
use App\Support\Sites;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class FrontController extends Controller
{
    /**
     * Resolve and display a public CMS page.
     *
     * @param  string|null  $slug
     */
    public function show(Request $request, $slug = null): Response|RedirectResponse
    {
        if (! empty($slug)) {
            $parts = explode('/', $slug);
            $firstSegment = $parts[0];

            $cpt = CmsPostType::where('slug', $firstSegment)->where('active', 1)->first();
            if ($cpt) {
                if (count($parts) === 1) {
                    return $this->cptIndex($request, $cpt);
                }
                if (count($parts) === 2) {
                    return $this->cptShow($request, $cpt, $parts[1]);
                }
            }
        }

        $article = null;

        if (empty($slug)) {
            // The site's language goes first when there is a home page per language
            $siteLang = Sites::current()?->lang_id;
            $inSiteLang = fn ($query) => $siteLang ? $query->orderByRaw('lang_id = ? desc', [$siteLang]) : $query;

            // Find the Home page article
            $article = CmsArticle::whereHas('schema', function ($query): void {
                $query->whereIn('type', ['HOME', 'PAGE']);
            })->where('slug', 'home')->published()->tap($inSiteLang)->first();

            if (! $article) {
                $article = CmsArticle::whereHas('schema', function ($query): void {
                    $query->where('type', 'HOME');
                })->published()->tap($inSiteLang)->first();
            }

            // Fallback to first published article if still not found
            if (! $article) {
                $article = CmsArticle::published()->orderBy('position')->first();
            }
        } else {
            // Pages are found by their full path
            $uri = trim($slug, '/');
            $article = CmsArticle::where('uri', $uri)->published()->first();

            // Every page above it must be published too (one query for all ancestors)
            $segments = explode('/', $uri);
            if ($article && count($segments) > 1) {
                $ancestors = collect(range(1, count($segments) - 1))->map(fn (int $depth): string => implode('/', array_slice($segments, 0, $depth)));
                if (CmsArticle::published()->where('lang_id', $article->lang_id)->whereIn('uri', $ancestors)->count() !== $ancestors->count()) {
                    $article = null;
                }
            }

            // Old taxonomy archives ("/categorias/{term}", "/news/{term}"...) now live at "/tag/{term}"
            if (! $article && isset($parts) && count($parts) === 2 && CmsTag::where('slug', $parts[1])->where('active', true)->exists()) {
                return redirect('/tag/'.$parts[1], 301);
            }
        }

        if (! $article) {
            abort(404);
        }

        // Eager load schema to extract rendering templates
        $article->load(['schema', 'tags', 'children' => function ($query): void {
            $query->published()->orderBy('position');
        }]);

        return $this->renderArticle($article);
    }

    /**
     * Editor preview: render the unsaved data stored by the admin preview endpoint, behind
     * a temporary signed URL. Drafts and scheduled items render too; nothing is cached
     * and search engines are told not to index it.
     */
    public function preview(Request $request, string $token): SymfonyResponse
    {
        $payload = Cache::get('preview.'.$token);
        abort_unless(is_array($payload), 404);

        // Shown as the site it was edited in, whatever domain the preview link uses
        $response = Sites::as(Sites::find($payload['site_id'] ?? null) ?? Sites::current(), fn (): SymfonyResponse => ($payload['module'] === 'posts'
            ? $this->previewPost($payload['data'])
            : $this->previewArticle($payload['data']))->toResponse($request));

        return $response->withHeaders([
            'X-Robots-Tag' => 'noindex, nofollow',
            'Cache-Control' => 'no-store, private',
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    protected function previewArticle(array $data): Response
    {
        $article = ! empty($data['id']) ? CmsArticle::withTrashed()->findOrFail($data['id']) : new CmsArticle;
        $article->forceFill([
            ...$this->previewFields($data, ['title', 'excerpt', 'featured_image', 'schema_id', 'parent_id', 'status', 'published_at']),
            ...$this->previewContent($data),
            'metadata' => ContentSanitizer::metadata($data['metadata'] ?? []),
        ]);
        $article->created_at ??= now();

        $article->load('schema');
        $article->setRelation('tags', CmsTag::whereIn('cms_taxonomy_terms.id', $data['tag_ids'] ?? [])->get());
        $article->setRelation('children', $article->exists
            ? $article->children()->published()->orderBy('position')->get()
            : $article->newCollection());

        return $this->renderArticle($article);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    protected function previewPost(array $data): Response
    {
        $post = ! empty($data['id']) ? CmsPost::withTrashed()->findOrFail($data['id']) : new CmsPost(['post_type' => 'post']);
        $post->forceFill([
            ...$this->previewFields($data, ['title', 'excerpt', 'featured_image', 'schema_id', 'status', 'published_at', 'post_type', 'user_id']),
            ...$this->previewContent($data),
            'metadata' => ContentSanitizer::metadata($data['metadata'] ?? []),
        ]);
        $post->created_at ??= now();
        $post->published_at ??= now();

        $post->load(['user', 'schema']);
        $post->setRelation('tags', CmsTag::whereIn('cms_taxonomy_terms.id', $data['tag_ids'] ?? [])->get());

        return Inertia::render('front/blog/show', [
            'post' => $post,
            'cpt' => $post->post_type !== 'post' ? CmsPostType::where('slug', $post->post_type)->first() : null,
            ...FrontCache::shared(),
        ]);
    }

    /**
     * The previewed blocks (cleaned) and the content built from them, or the plain content
     * of an editor that sends no blocks.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    protected function previewContent(array $data): array
    {
        if (isset($data['blocks']) && is_array($data['blocks'])) {
            $blocks = BlockRegistry::sanitize($data['blocks']);

            return ['blocks' => $blocks, 'content' => BlockRegistry::toContent($blocks)];
        }

        return ['blocks' => null, 'content' => ContentSanitizer::html($data['content'] ?? null)];
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  list<string>  $fields
     * @return array<string, mixed>
     */
    protected function previewFields(array $data, array $fields): array
    {
        return array_intersect_key($data, array_flip($fields));
    }

    /**
     * Render a page with the template of its schema. Also used by the editor preview,
     * with an unsaved article.
     */
    public function renderArticle(CmsArticle $article): Response
    {

        // Get template name from schema
        $template = $article->schema?->front_view;

        if (empty($template)) {
            // Fallback to defaults based on schema type
            $type = $article->schema?->type ?? 'PAGE';
            if ($type === 'HOME') {
                $template = 'front/templates/home';
            } elseif ($type === 'OPTIONS') {
                $template = 'front/templates/options';
            } else {
                $template = 'front/templates/page';
            }
        }

        $shared = FrontCache::shared();

        // Resolve slider from article metadata: any short string (root or nested) may be a slider key
        $slider = null;
        $metadata = $article->metadata;
        if ($metadata && is_array($metadata)) {
            $candidates = [];
            array_walk_recursive($metadata, function ($value) use (&$candidates): void {
                if (is_string($value) && $value !== '' && strlen($value) < 100) {
                    $candidates[] = $value;
                }
            });

            if ($candidates !== []) {
                $candidates = array_values(array_unique($candidates));
                $sliders = CmsSlider::whereIn('key', $candidates)
                    ->with(['slides' => function ($query): void {
                        $query->where('active', true)->orderBy('position');
                    }])
                    ->get()
                    ->keyBy('key');

                // Keep metadata order: the first matching key wins
                foreach ($candidates as $candidate) {
                    if ($sliders->has($candidate)) {
                        $slider = $sliders->get($candidate);
                        break;
                    }
                }
            }
        }

        // Fallback to default or home slider if template is home and no slider was found in metadata
        if (! $slider && in_array($template, ['front/templates/home', 'home'])) {
            $slider = CmsSlider::getSlider('default') ?? CmsSlider::getSlider('home_slider') ?? CmsSlider::with(['slides' => function ($query): void {
                $query->where('active', true)->orderBy('position');
            }])->first();
        }

        return Inertia::render($template, [
            'article' => $article,
            // Templates may list the recent posts, so their featured images get srcsets too
            'media' => $this->mediaFor($article, $article->metadata)
                + MediaLibrary::lookup(collect($shared['recentPosts'])->pluck('featured_image')->filter()),
            ...$shared,
            'slider' => $slider,
        ]);
    }

    /**
     * Archive of the published pages and posts tagged with a tag.
     */
    public function tag(string $slug): Response
    {
        $tag = CmsTag::where('slug', $slug)->where('active', true)->firstOrFail();

        $pages = $tag->articles()->published()->latest('cms_articles.published_at')->get()
            ->map(fn (CmsArticle $article): array => [
                'id' => 'page-'.$article->id,
                'type' => 'Página',
                'title' => $article->title,
                'url' => $article->url,
                'excerpt' => $this->excerpt($article->excerpt ?: $article->content),
                'date' => ($article->published_at ?? $article->created_at)?->toAtomString(),
            ]);

        $cpts = CmsPostType::where('active', 1)->get()->keyBy('slug');
        $posts = $tag->posts()->published()->latest('cms_posts.published_at')->get()
            ->map(fn (CmsPost $post): array => [
                'id' => 'post-'.$post->id,
                'type' => $cpts->get($post->post_type)?->singular_name ?? 'Entrada',
                'title' => $post->title,
                'url' => ($cpts->has($post->post_type) ? '/'.$post->post_type : '/blog').'/'.$post->slug,
                'excerpt' => $this->excerpt($post->excerpt ?: $post->content),
                'date' => ($post->published_at ?? $post->created_at)?->toAtomString(),
            ]);

        return Inertia::render('front/tag', [
            'tag' => $tag->only(['id', 'name', 'slug']),
            'items' => $pages->concat($posts)->sortByDesc('date')->values(),
            ...FrontCache::shared(),
        ]);
    }

    /**
     * Old "/category/{term}" URLs: categories were merged into tags.
     */
    public function category(string $slug): RedirectResponse
    {
        abort_unless(CmsTag::where('slug', $slug)->where('active', true)->exists(), 404);

        return redirect('/tag/'.$slug, 301);
    }

    protected function excerpt(?string $html): string
    {
        return Str::limit(trim(strip_tags((string) $html)), 160);
    }

    /**
     * Add srcset and alt text to the library images in the item's content, and return
     * the library details (alt, srcset, size) of its featured and field images.
     *
     * @return array<string, array<string, mixed>>
     */
    protected function mediaFor(Model $item, mixed $fields = null): array
    {
        $item->setAttribute('content', MediaLibrary::enrichHtml($item->getAttribute('content')));

        $blocks = $item->getAttribute('blocks');
        if (is_array($blocks)) {
            $blocks = BlockRegistry::resolve($blocks);
            $item->setAttribute('blocks', $blocks);
        }

        return MediaLibrary::lookup(MediaLibrary::collectUrls($item->getAttribute('featured_image'), $fields, $blocks));
    }

    public function blogIndex(Request $request): Response
    {
        $shared = FrontCache::shared();

        // Load standard posts (post_type = 'post')
        $posts = CmsPost::with(['user', 'tags'])
            ->where('post_type', 'post')
            ->published()
            ->latest('published_at')
            ->paginate(6)
            ->withQueryString();

        return Inertia::render('front/blog/index', [
            'posts' => $posts,
            'cpt' => null,
            'media' => MediaLibrary::lookup($posts->getCollection()->pluck('featured_image')->filter()),
            ...$shared,
        ]);
    }

    public function blogShow(Request $request, $slug): Response
    {
        $shared = FrontCache::shared();

        $post = CmsPost::with(['user', 'tags', 'schema'])
            ->where('post_type', 'post')
            ->where('slug', $slug)
            ->published()
            ->firstOrFail();

        return Inertia::render('front/blog/show', [
            'post' => $post,
            'cpt' => null,
            // The page may list the recent posts ("keep reading"), so their images get srcsets too
            'media' => $this->mediaFor($post, $post->metadata ?? null)
                + MediaLibrary::lookup(collect($shared['recentPosts'])->pluck('featured_image')->filter()),
            ...$shared,
        ]);
    }

    protected function cptIndex(Request $request, $cpt): Response
    {
        $shared = FrontCache::shared();

        // Load posts for this specific post type
        $posts = CmsPost::with(['user', 'tags'])
            ->where('post_type', $cpt->slug)
            ->published()
            ->latest('published_at')
            ->paginate(6)
            ->withQueryString();

        return Inertia::render('front/blog/index', [
            'posts' => $posts,
            'cpt' => $cpt,
            'media' => MediaLibrary::lookup($posts->getCollection()->pluck('featured_image')->filter()),
            ...$shared,
        ]);
    }

    protected function cptShow(Request $request, $cpt, $postSlug): Response
    {
        $shared = FrontCache::shared();

        $post = CmsPost::with(['user', 'tags', 'schema'])
            ->where('post_type', $cpt->slug)
            ->where('slug', $postSlug)
            ->published()
            ->firstOrFail();

        return Inertia::render('front/blog/show', [
            'post' => $post,
            'cpt' => $cpt,
            'media' => $this->mediaFor($post, $post->metadata ?? null),
            ...$shared,
        ]);
    }

    public function publicFormSubmit(Request $request): JsonResponse
    {
        $form = CmsForm::with('fields')
            ->where('alias', $request->input('form_alias'))
            ->where('active', 1)
            ->firstOrFail();

        // A filled honeypot means a bot: pretend success without storing anything
        if (filled($request->input('_hp'))) {
            return response()->json([
                'success' => true,
                'message' => '¡Formulario enviado con éxito!',
            ]);
        }

        $validationRules = [];
        foreach ($form->fields as $field) {
            if (! $field->active) {
                continue;
            }
            $rule = ['required'];
            if ($field->type === 'email') {
                $rule[] = 'email';
                $rule[] = 'max:255';
            } elseif ($field->type === 'checkbox') {
                $rule[] = 'array';
                $rule[] = 'max:50';
                $validationRules[$field->alias.'.*'] = ['string', 'max:255'];
            } else {
                $rule[] = 'string';
                $rule[] = 'max:5000';
            }
            $validationRules[$field->alias] = $rule;
        }

        $request->validate($validationRules);

        $nameVal = '';
        $emailVal = '';
        $phoneVal = '';
        $msgVal = '';

        foreach ($form->fields as $field) {
            if (! $field->active) {
                continue;
            }
            $val = $request->input($field->alias);
            if ($field->alias === 'name' || $field->alias === 'nombre') {
                $nameVal = $val;
            } elseif ($field->alias === 'email' || $field->alias === 'correo') {
                $emailVal = $val;
            } elseif (in_array($field->alias, ['phone', 'telefono', 'celular'], true)) {
                $phoneVal = $val;
            } elseif ($field->alias === 'message' || $field->alias === 'mensaje') {
                $msgVal = $val;
            }
        }

        if (empty($nameVal)) {
            $nameVal = $request->input('name', 'Anónimo');
        }
        if (empty($emailVal)) {
            $emailVal = $request->input('email', '');
        }
        if (empty($phoneVal)) {
            $phoneVal = $request->input('phone', '');
        }
        if (empty($msgVal)) {
            $msgVal = $request->input('message', '');
        }

        $register = CmsRegister::create([
            'form_id' => $form->id,
            'name' => Str::limit((string) $nameVal, 255, ''),
            'email' => Str::limit((string) $emailVal, 255, ''),
            'phone' => Str::limit((string) $phoneVal, 50, ''),
            'message' => Str::limit((string) $msgVal, 5000, ''),
            'acceptance' => true,
        ]);

        foreach ($form->fields as $field) {
            if (! $field->active) {
                continue;
            }
            $val = $request->input($field->alias);
            $valStr = is_array($val) ? implode(', ', $val) : strval($val);

            CmsRegisterField::create([
                'register_id' => $register->id,
                'field_id' => $field->id,
                'value' => substr($valStr, 0, 255),
                'txt_value' => strlen($valStr) > 255 ? $valStr : null,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => '¡Formulario enviado con éxito!',
        ]);
    }

    public function getFormConfig(string $alias): JsonResponse
    {
        $form = CmsForm::with(['fields' => function ($q): void {
            $q->where('active', 1)->orderBy('id');
        }])->where('alias', $alias)->where('active', 1)->firstOrFail();

        return response()->json($form);
    }

    public function search(Request $request): Response
    {
        $query = $request->get('q', '');
        $cleanQuery = str_replace(' ', '%', trim($query));

        $shared = FrontCache::shared();

        $results = [];

        if (! empty($query)) {
            // 1. Search in Articles (Pages)
            $articles = CmsArticle::published()
                ->where('slug', '!=', 'home-page')
                ->where(function ($q) use ($cleanQuery): void {
                    $q->where('title', 'LIKE', '%'.$cleanQuery.'%')
                        ->orWhere('content', 'LIKE', '%'.$cleanQuery.'%');
                })
                ->get();

            foreach ($articles as $art) {
                $results[] = [
                    'id' => $art->id,
                    'title' => $art->title,
                    'excerpt' => $art->excerpt ?: strip_tags(substr($art->content ?? '', 0, 200)),
                    'url' => $art->url,
                    'type' => 'Página',
                    'date' => $art->created_at ? $art->created_at->format('d/m/Y') : '',
                ];
            }

            // 2. Search in Posts & CPTs
            $posts = CmsPost::with('user')
                ->published()
                ->where(function ($q) use ($cleanQuery): void {
                    $q->where('title', 'LIKE', '%'.$cleanQuery.'%')
                        ->orWhere('content', 'LIKE', '%'.$cleanQuery.'%');
                })
                ->get();

            $cpts = CmsPostType::where('active', 1)->get()->keyBy('slug');

            foreach ($posts as $post) {
                $cpt = $cpts->get($post->post_type);
                $typeLabel = $cpt ? $cpt->singular_name : 'Entrada';
                $url = $cpt ? '/'.$cpt->slug.'/'.$post->slug : '/blog/'.$post->slug;

                $results[] = [
                    'id' => $post->id,
                    'title' => $post->title,
                    'excerpt' => $post->excerpt ?: strip_tags(substr($post->content ?? '', 0, 200)),
                    'url' => $url,
                    'type' => $typeLabel,
                    'date' => $post->published_at ? Carbon::parse($post->published_at)->format('d/m/Y') : ($post->created_at ? $post->created_at->format('d/m/Y') : ''),
                ];
            }
        }

        return Inertia::render('front/search', [
            'results' => $results,
            'query' => $query,
            ...$shared,
        ]);
    }

    public function sitemap(): \Illuminate\Http\Response
    {
        $xml = FrontCache::sitemap(function (): string {
            $urls = [];
            $baseUrl = url('/');

            // 1. Add Homepage
            $urls[] = [
                'loc' => $baseUrl,
                'lastmod' => now()->toAtomString(),
                'changefreq' => 'daily',
                'priority' => '1.0',
            ];

            // 2. Add Pages (Articles)
            $articles = CmsArticle::published()->where('slug', '!=', 'home-page')->get();
            foreach ($articles as $art) {
                // The home page is already listed as the site root
                if ($art->url === '/') {
                    continue;
                }
                $urls[] = [
                    'loc' => $baseUrl.$art->url,
                    'lastmod' => $art->updated_at ? $art->updated_at->toAtomString() : now()->toAtomString(),
                    'changefreq' => 'weekly',
                    'priority' => '0.8',
                ];
            }

            // 3. Add Blog Index
            $urls[] = [
                'loc' => $baseUrl.'/blog',
                'lastmod' => now()->toAtomString(),
                'changefreq' => 'daily',
                'priority' => '0.9',
            ];

            // 4. Add Posts & dynamic CPTs
            $posts = CmsPost::published()->get();
            $cpts = CmsPostType::where('active', 1)->get()->keyBy('slug');

            foreach ($posts as $post) {
                $cpt = $cpts->get($post->post_type);
                $path = $cpt ? '/'.$cpt->slug.'/'.$post->slug : '/blog/'.$post->slug;

                $urls[] = [
                    'loc' => $baseUrl.$path,
                    'lastmod' => $post->updated_at ? $post->updated_at->toAtomString() : now()->toAtomString(),
                    'changefreq' => 'weekly',
                    'priority' => '0.7',
                ];
            }

            // 5. Add dynamic CPT archive pages
            foreach ($cpts as $cpt) {
                $urls[] = [
                    'loc' => $baseUrl.'/'.$cpt->slug,
                    'lastmod' => now()->toAtomString(),
                    'changefreq' => 'daily',
                    'priority' => '0.8',
                ];
            }

            // 6. Add tag archives that list published content
            $tags = CmsTag::where('active', true)->withPublishedCounts()->get()
                ->filter(fn (CmsTag $tag): bool => $tag->articles_count + $tag->posts_count > 0);
            foreach ($tags as $tag) {
                $urls[] = [
                    'loc' => $baseUrl.'/tag/'.$tag->slug,
                    'lastmod' => $tag->updated_at ? $tag->updated_at->toAtomString() : now()->toAtomString(),
                    'changefreq' => 'weekly',
                    'priority' => '0.5',
                ];
            }

            // Render XML sitemap
            $xml = '<?xml version="1.0" encoding="UTF-8"?>';
            $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
            foreach ($urls as $url) {
                $xml .= '<url>';
                $xml .= '<loc>'.htmlspecialchars($url['loc']).'</loc>';
                $xml .= '<lastmod>'.$url['lastmod'].'</lastmod>';
                $xml .= '<changefreq>'.$url['changefreq'].'</changefreq>';
                $xml .= '<priority>'.$url['priority'].'</priority>';
                $xml .= '</url>';
            }
            $xml .= '</urlset>';

            return $xml;
        });

        return response($xml, 200, [
            'Content-Type' => 'application/xml',
        ]);
    }

    public function robots(): \Illuminate\Http\Response
    {
        $baseUrl = url('/');
        $robots = "User-agent: *\n";
        $robots .= "Allow: /\n";
        $robots .= "Disallow: /admin/\n";
        $robots .= "Sitemap: {$baseUrl}/sitemap.xml\n";

        return response($robots, 200, [
            'Content-Type' => 'text/plain',
        ]);
    }
}
