<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CmsConfig;
use App\Rules\SafeUrl;
use App\Support\ContentSanitizer;
use App\Support\FrontCache;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LayoutController extends Controller
{
    /**
     * Show the layout customizer page.
     */
    public function index(): Response
    {
        $configs = CmsConfig::where('alias', 'like', 'layout_%')->get();

        // Map alias keys directly to their values
        $settings = [];
        foreach ($configs as $config) {
            $settings[$config->alias] = $config->value;
        }

        return Inertia::render('admin/layout/index', [
            'settings' => $settings,
        ]);
    }

    /**
     * Update the layout settings.
     */
    public function update(Request $request): RedirectResponse
    {
        $url = ['nullable', 'string', 'max:2048', new SafeUrl];

        $data = $request->validate([
            'layout_header_logo' => $url,
            'layout_footer_logo' => $url,
            'layout_copyright' => 'nullable|string|max:1000',
            'layout_facebook' => $url,
            'layout_instagram' => $url,
            'layout_twitter' => $url,
            'layout_linkedin' => $url,
            'layout_youtube' => $url,
            'layout_custom_css' => 'nullable|string|max:65535',
        ]);

        if (array_key_exists('layout_custom_css', $data)) {
            $data['layout_custom_css'] = ContentSanitizer::css($data['layout_custom_css']);
        }

        foreach ($data as $alias => $value) {
            CmsConfig::where('alias', $alias)->update(['value' => $value ?? '']);
        }

        // Query-builder updates fire no model events
        FrontCache::flush();

        return redirect()->route('layout.index')->with('success', 'Configuraciones de layout guardadas.');
    }
}
