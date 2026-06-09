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
                $query->where('type', 'HOME');
            })->where('active', 1)->first();

            // Fallback to first active article if no HOME type schema is seeded
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
        $article->load(['schema', 'children' => function ($query) {
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

        return Inertia::render($template, [
            'article' => $article,
            'navigation' => $navigation,
        ]);
    }
}
