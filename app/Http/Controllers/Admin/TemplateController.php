<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CmsSchema;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TemplateController extends Controller
{
    /**
     * List all templates inside the templates directory.
     */
    public function index(Request $request): Response
    {
        $templates = CmsSchema::getAvailableTemplates();

        return Inertia::render('admin/templates/index', [
            'items' => $templates,
        ]);
    }

    /**
     * Show the template creation form.
     */
    public function create(): Response
    {
        // Default React boilerplate code for a new MewCMS template
        $defaultBoilerplate = "import React from 'react';\n"
            ."import FrontLayout from '../layout';\n"
            ."import { Head } from '@inertiajs/react';\n"
            ."import { CmsArticle } from '@/types/models/cms-article';\n\n"
            ."interface Props {\n"
            ."    article: CmsArticle;\n"
            ."    navigation: Pick<CmsArticle, 'id' | 'title' | 'slug'>[];\n"
            ."}\n\n"
            ."export default function CustomTemplate({ article, navigation }: Props) {\n"
            ."    return (\n"
            ."        <FrontLayout navigation={navigation}>\n"
            ."            <Head title={article.title} />\n"
            ."            <div className=\"max-w-4xl mx-auto py-12 px-4 space-y-6\">\n"
            ."                <h1 className=\"text-3xl font-extrabold tracking-tight sm:text-4xl capitalize\">{article.title}</h1>\n"
            ."                <div className=\"prose dark:prose-invert max-w-none text-sm leading-relaxed\">\n"
            ."                    <p>Welcome to your new custom template!</p>\n"
            ."                </div>\n"
            ."            </div>\n"
            ."        </FrontLayout>\n"
            ."    );\n"
            ."}\n";

        return Inertia::render('admin/templates/create', [
            'defaultBoilerplate' => $defaultBoilerplate,
        ]);
    }

    /**
     * Create a new template file.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'filename' => 'required|string|max:255|regex:/^[a-zA-Z0-9_-]+$/',
            'content' => 'required|string',
        ]);

        $filename = $request->input('filename').'.tsx';
        $directory = resource_path('js/pages/front/templates');
        $filePath = $directory.'/'.$filename;

        // Ensure directory exists
        if (! is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        // Security check
        if (realpath($filePath) !== false && ! str_starts_with(realpath($filePath), realpath($directory))) {
            abort(403, 'Unauthorized path traversal.');
        }

        if (file_exists($filePath)) {
            return back()->withErrors(['filename' => 'El archivo de la plantilla ya existe.']);
        }

        // Inject template name directive if not present
        $content = $request->input('content');
        $name = $request->input('name');
        if (! str_contains($content, 'Template Name:')) {
            $directive = "/**\n * Template Name: ".$name."\n */\n";
            $content = $directive.$content;
        }

        file_put_contents($filePath, $content);

        return redirect()->route('templates.index');
    }

    /**
     * Show the template editing form.
     */
    public function edit(string $filename): Response
    {
        [$filePath, $filename] = $this->getSafeFilePath($filename);

        if (! file_exists($filePath)) {
            abort(404, 'Template not found.');
        }

        $content = file_get_contents($filePath);

        // Parse Template Name directive
        $templateName = null;
        if (preg_match('/Template\s+Name:\s*([^\r\n\*]+)/i', $content, $matches)) {
            $templateName = trim($matches[1]);
        }
        if (! $templateName) {
            $templateName = ucfirst(basename($filename, '.tsx'));
        }

        return Inertia::render('admin/templates/edit', [
            'filename' => basename($filename, '.tsx'),
            'name' => $templateName,
            'content' => $content,
        ]);
    }

    /**
     * Update an existing template file.
     */
    public function update(string $filename, Request $request): RedirectResponse
    {
        [$filePath, $filename] = $this->getSafeFilePath($filename);

        if (! file_exists($filePath)) {
            abort(404, 'Template not found.');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        $content = $request->input('content');
        $name = $request->input('name');

        // Clean template name directive if it changed, or ensure it's in the content
        if (preg_match('/(Template\s+Name:\s*)([^\r\n\*]+)/i', $content)) {
            $content = preg_replace('/(Template\s+Name:\s*)([^\r\n\*]+)/i', '${1}'.$name, $content);
        } else {
            $directive = "/**\n * Template Name: ".$name."\n */\n";
            $content = $directive.$content;
        }

        file_put_contents($filePath, $content);

        return redirect()->route('templates.index');
    }

    /**
     * Delete a template file.
     */
    public function destroy(string $filename): RedirectResponse
    {
        [$filePath, $filename] = $this->getSafeFilePath($filename);

        if (! file_exists($filePath)) {
            abort(404, 'Template not found.');
        }

        $baseName = basename($filename, '.tsx');
        $coreTemplates = ['home', 'page', 'post', 'term-list'];
        if (in_array($baseName, $coreTemplates)) {
            return back()->withErrors(['error' => 'No se pueden eliminar las plantillas principales del sistema.']);
        }

        // Check if any schema uses it
        $frontViewPath = 'front/templates/'.$baseName;
        $inUse = CmsSchema::where('front_view', $frontViewPath)->exists();
        if ($inUse) {
            return back()->withErrors(['error' => 'Esta plantilla está en uso por un esquema y no se puede eliminar.']);
        }

        unlink($filePath);

        return redirect()->route('templates.index');
    }

    /**
     * Clean and validate filepath from path traversal
     */
    protected function getSafeFilePath(string $filename): array
    {
        if (! str_ends_with($filename, '.tsx')) {
            $filename .= '.tsx';
        }

        if (! preg_match('/^[a-zA-Z0-9_-]+\.tsx$/', $filename)) {
            abort(400, 'Invalid template filename.');
        }

        $directory = resource_path('js/pages/front/templates');
        $filePath = $directory.'/'.$filename;

        // Double check traversal
        $realDirectory = realpath($directory);
        $realFilePath = realpath($filePath);
        if ($realFilePath !== false && ! str_starts_with($realFilePath, $realDirectory)) {
            abort(403, 'Path traversal detected.');
        }

        return [$filePath, $filename];
    }
}
