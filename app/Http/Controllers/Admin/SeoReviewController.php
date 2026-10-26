<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Support\SeoAnalyzer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * SEO review of the page or post being edited, unsaved changes included. The routes pass
 * the module as the "module" default, so permissions follow the articles/posts modules.
 */
class SeoReviewController extends Controller
{
    public function review(Request $request, string $module): JsonResponse
    {
        $data = $request->validate([
            'id' => 'nullable|integer',
            'lang_id' => 'nullable|integer',
            'title' => 'nullable|string|max:255',
            'content' => 'nullable|string',
            'blocks' => 'nullable|array',
            'metadata' => 'nullable|array',
        ]);

        return response()->json(SeoAnalyzer::analyze($data, $module));
    }
}
