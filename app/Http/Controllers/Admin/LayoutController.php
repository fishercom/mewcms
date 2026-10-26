<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdmAction;
use App\Models\CmsConfig;
use App\Rules\SafeUrl;
use App\Support\AdminActivity;
use App\Support\ContentSanitizer;
use App\Support\FrontCache;
use App\Support\SocialLinks;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
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
            'socialLinks' => SocialLinks::all(),
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
            'layout_custom_css' => 'nullable|string|max:65535',
            'social_links' => 'nullable|array|max:'.SocialLinks::MAX_LINKS,
            'social_links.*.network' => ['required', 'string', Rule::in(SocialLinks::NETWORKS)],
            'social_links.*.url' => ['required', 'string', 'max:2048'],
            'social_links.*.label' => 'nullable|string|max:60',
        ], [
            'social_links.*.url.required' => 'Cada red social necesita su enlace.',
        ]);

        // E-mail and phone accept a bare address or number; everything else must be a safe URL
        $socialLinks = $data['social_links'] ?? [];
        foreach ($socialLinks as $i => $link) {
            $url = SocialLinks::normalizeUrl($link['network'], trim($link['url']));
            if (! ContentSanitizer::isSafeUrl($url)) {
                throw ValidationException::withMessages(["social_links.{$i}.url" => 'Enlace no válido: usa https://, mailto: o tel:.']);
            }
        }
        unset($data['social_links']);
        $savesSocial = $request->has('social_links') || $request->boolean('social_links_managed');
        if ($savesSocial) {
            SocialLinks::save($socialLinks);
        }

        // The footer credit may hold simple links; nothing else survives
        if (array_key_exists('layout_copyright', $data)) {
            $data['layout_copyright'] = ContentSanitizer::inline($data['layout_copyright']);
        }

        if (array_key_exists('layout_custom_css', $data)) {
            $data['layout_custom_css'] = ContentSanitizer::css($data['layout_custom_css']);
        }

        foreach ($data as $alias => $value) {
            CmsConfig::where('alias', $alias)->update(['value' => $value ?? '']);
        }

        // Query-builder updates fire no model events
        FrontCache::flush();
        AdminActivity::record('layout', AdmAction::MANAGE, 'Actualizado', $savesSocial
            ? 'logos, textos y redes sociales ('.count(SocialLinks::all()).' enlaces)'
            : 'logos y textos');

        return redirect()->route('layout.index')->with('success', 'Configuraciones de layout guardadas.');
    }
}
