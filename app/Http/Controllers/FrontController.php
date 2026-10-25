<?php

namespace App\Http\Controllers;

use App\Models\CmsArticle;
use App\Models\CmsForm;
use App\Models\CmsPost;
use App\Models\CmsPostType;
use App\Models\CmsRegister;
use App\Models\CmsRegisterField;
use App\Models\CmsSlider;
use App\Models\CmsTag;
use App\Support\FrontCache;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

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
            // Find the Home page article
            $article = CmsArticle::whereHas('schema', function ($query): void {
                $query->whereIn('type', ['HOME', 'PAGE']);
            })->where('slug', 'home')->published()->first();

            if (! $article) {
                $article = CmsArticle::whereHas('schema', function ($query): void {
                    $query->where('type', 'HOME');
                })->published()->first();
            }

            // Fallback to first published article if still not found
            if (! $article) {
                $article = CmsArticle::published()->orderBy('position')->first();
            }
        } else {
            // Map URL slashes back to DB underscore separator format
            $dbSlug = str_replace('/', '_', $slug);
            $article = CmsArticle::where('slug', $dbSlug)->published()->first();

            // A page whose parent is unpublished or trashed is not reachable either
            if ($article?->parent_id && ! CmsArticle::published()->whereKey($article->parent_id)->exists()) {
                $article = null;
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
                'url' => '/'.str_replace('_', '/', $article->slug),
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
                    'url' => '/'.$art->slug,
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
                $urls[] = [
                    'loc' => $baseUrl.'/'.$art->slug,
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
