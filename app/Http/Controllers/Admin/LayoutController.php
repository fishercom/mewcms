<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\CmsConfig;

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
        $data = $request->only([
            'layout_header_logo',
            'layout_footer_logo',
            'layout_copyright',
            'layout_facebook',
            'layout_instagram',
            'layout_twitter',
            'layout_linkedin',
            'layout_youtube',
            'layout_custom_css',
        ]);

        foreach ($data as $alias => $value) {
            CmsConfig::where('alias', $alias)->update(['value' => $value ?? '']);
        }

        return redirect()->route('layout.index')->with('success', 'Configuraciones de layout guardadas.');
    }
}
