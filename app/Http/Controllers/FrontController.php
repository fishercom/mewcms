<?php

namespace App\Http\Controllers;

use App\Models\CmsArticle;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FrontController extends Controller
{
    /**
     * Resolve and display a public CMS page.
     *
     * @param string|null $slug
     * @return Response
     */
    public function show(Request $request, $slug = null): Response
    {
        $article = null;

        if (empty($slug)) {
            // Find the Home page article
            $article = CmsArticle::whereHas('schema', function ($query) {
                $query->whereIn('type', ['HOME', 'PAGE']);
            })->where('slug', 'home')->where('active', 1)->first();

            if (!$article) {
                $article = CmsArticle::whereHas('schema', function ($query) {
                    $query->where('type', 'HOME');
                })->where('active', 1)->first();
            }

            // Fallback to first active article if still not found
            if (!$article) {
                $article = CmsArticle::where('active', 1)->orderBy('position')->first();
            }
        } else {
            // Map URL slashes back to DB underscore separator format
            $dbSlug = str_replace('/', '_', $slug);
            $article = CmsArticle::where('slug', $dbSlug)->where('active', 1)->first();
        }

        if (!$article) {
            abort(404);
        }

        // Eager load schema to extract rendering templates
        $article->load(['schema', 'terms.taxonomy', 'children' => function ($query) {
            $query->where('active', 1)->orderBy('position');
        }]);

        // Get template name from schema
        $template = $article->schema->front_view;

        if (empty($template)) {
            // Fallback to defaults based on schema type
            $type = $article->schema->type ?? 'PAGE';
            if ($type === 'HOME') {
                $template = 'front/templates/home';
            } elseif ($type === 'OPTIONS') {
                $template = 'front/templates/options';
            } else {
                $template = 'front/templates/page';
            }
        }

        // Fetch root navigation links (all active top-level pages)
        $navigation = CmsArticle::whereNull('parent_id')
            ->where('active', 1)
            ->orderBy('position')
            ->get(['id', 'title', 'slug']);

        // Fetch active taxonomies with active terms and their articles count
        $allTaxonomies = \App\Models\CmsTaxonomy::with(['terms' => function($q) {
            $q->where('active', true)->orderBy('position')->withCount('articles');
        }])->where('active', true)->get();

        // Fetch recent active articles (except home page)
        $recentArticles = CmsArticle::where('active', 1)
            ->where('slug', '!=', 'home-page')
            ->latest()
            ->take(5)
            ->get(['id', 'title', 'slug', 'created_at']);

        // Resolve slider if present in article metadata (recursively searches root and nested structures)
        $slider = null;
        if ($article->metadata && is_array($article->metadata)) {
            $findSlider = function($data) use (&$findSlider) {
                if (is_string($data) && !empty($data) && strlen($data) < 100) {
                    $potentialSlider = \App\Models\CmsSlider::getSlider($data);
                    if ($potentialSlider) {
                        return $potentialSlider;
                    }
                } elseif (is_array($data)) {
                    foreach ($data as $item) {
                        $res = $findSlider($item);
                        if ($res) {
                            return $res;
                        }
                    }
                }
                return null;
            };
            $slider = $findSlider($article->metadata);
        }

        return Inertia::render($template, [
            'article' => $article,
            'navigation' => $navigation,
            'allTaxonomies' => $allTaxonomies,
            'recentArticles' => $recentArticles,
            'slider' => $slider,
        ]);
    }

    /**
     * Display posts associated with a specific category term.
     */
    public function category(Request $request, $slug): Response
    {
        [$term, $articles, $taxonomy] = $this->getArticlesByTerm('categorias', $slug);
        return $this->renderTermList($term, $articles, $taxonomy);
    }

    /**
     * Display posts associated with a specific tag term.
     */
    public function tag(Request $request, $slug): Response
    {
        try {
            [$term, $articles, $taxonomy] = $this->getArticlesByTerm('tags', $slug);
        } catch (\Symfony\Component\HttpKernel\Exception\NotFoundHttpException $e) {
            [$term, $articles, $taxonomy] = $this->getArticlesByTerm('etiquetas', $slug);
        }
        return $this->renderTermList($term, $articles, $taxonomy);
    }

    /**
     * Resolve taxonomy term slug robustly and fetch related active articles.
     */
    protected function getArticlesByTerm(string $taxonomySlug, string $termSlug): array
    {
        $taxonomy = \App\Models\CmsTaxonomy::where('slug', $taxonomySlug)
            ->orWhere('slug', \Illuminate\Support\Str::plural($taxonomySlug))
            ->orWhere('slug', \Illuminate\Support\Str::singular($taxonomySlug))
            ->first();

        if (!$taxonomy) {
            $taxonomy = \App\Models\CmsTaxonomy::where('name', 'like', '%' . $taxonomySlug . '%')->first();
        }

        if (!$taxonomy) {
            abort(404, 'Taxonomy not found');
        }

        $term = $taxonomy->terms()->where('slug', $termSlug)->where('active', true)->first();
        if (!$term) {
            abort(404, 'Term not found');
        }

        $articles = $term->articles()
            ->with(['terms.taxonomy', 'schema'])
            ->where('active', true)
            ->orderBy('position')
            ->get();

        return [$term, $articles, $taxonomy];
    }

    /**
     * Render the taxonomy term listing page.
     */
    protected function renderTermList($term, $articles, $taxonomy): Response
    {
        $navigation = CmsArticle::whereNull('parent_id')
            ->where('active', 1)
            ->orderBy('position')
            ->get(['id', 'title', 'slug']);

        $allTaxonomies = \App\Models\CmsTaxonomy::with(['terms' => function($q) {
            $q->where('active', true)->orderBy('position')->withCount('articles');
        }])->where('active', true)->get();

        $recentArticles = CmsArticle::where('active', 1)
            ->where('slug', '!=', 'home-page')
            ->latest()
            ->take(5)
            ->get(['id', 'title', 'slug', 'created_at']);

        return Inertia::render('front/templates/term-list', [
            'term' => $term,
            'taxonomy' => $taxonomy,
            'articles' => $articles,
            'navigation' => $navigation,
            'allTaxonomies' => $allTaxonomies,
            'recentArticles' => $recentArticles,
        ]);
    }
}
