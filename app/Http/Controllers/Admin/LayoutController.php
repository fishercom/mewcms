<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdmAction;
use App\Models\CmsConfig;
use App\Rules\SafeUrl;
use App\Support\AdminActivity;
use App\Support\ContentSanitizer;
use App\Support\FrontCache;
use App\Support\Sites;
use App\Support\SocialLinks;
use App\Support\Themes;
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
        // The current site's settings, over the ones shared by every site
        $settings = CmsConfig::forSite('layout_%');

        return Inertia::render('admin/layout/index', [
            'settings' => $settings,
            'socialLinks' => SocialLinks::all(),
            // The settings the site's theme declares in its theme.json ("layout_fields")
            'themeFields' => self::fields(),
            'themeName' => Themes::all()[Themes::current()]['name'] ?? '',
        ]);
    }

    /**
     * Update the layout settings.
     */
    public function update(Request $request): RedirectResponse
    {
        $url = ['nullable', 'string', 'max:2048', new SafeUrl];

        $themeFields = self::fields();
        $themeRules = [];
        foreach ($themeFields as $field) {
            $themeRules[$field['alias']] = match ($field['type']) {
                'url', 'image' => $url,
                'textarea' => 'nullable|string|max:5000',
                default => 'nullable|string|max:1000',
            };
        }

        $data = $request->validate($themeRules + [
            'layout_header_logo' => $url,
            'layout_footer_logo' => $url,
            'layout_copyright' => 'nullable|string|max:1000',
            'layout_custom_css' => 'nullable|string|max:65535',
            'social_links' => 'nullable|array|max:'.SocialLinks::MAX_LINKS,
            'social_links.*.network' => ['required', 'string', Rule::in(SocialLinks::NETWORKS)],
            'social_links.*.url' => ['required', 'string', 'max:2048'],
            'social_links.*.label' => 'nullable|string|max:60',
        ], [
            'social_links.*.url.required' => __('Cada red social necesita su enlace.'),
        ]);

        // E-mail and phone accept a bare address or number; everything else must be a safe URL
        $socialLinks = $data['social_links'] ?? [];
        foreach ($socialLinks as $i => $link) {
            $url = SocialLinks::normalizeUrl($link['network'], trim($link['url']));
            if (! ContentSanitizer::isSafeUrl($url)) {
                throw ValidationException::withMessages(["social_links.{$i}.url" => __('Enlace no válido: usa https://, mailto: o tel:.')]);
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

        // The theme's own fields are plain text or addresses: no markup is kept
        foreach ($themeFields as $field) {
            if (array_key_exists($field['alias'], $data) && in_array($field['type'], ['text', 'textarea'], true)) {
                $data[$field['alias']] = trim(strip_tags((string) $data[$field['alias']]));
            }
        }
        $names = array_column($themeFields, 'name', 'alias');
        $types = array_column($themeFields, 'type', 'alias');

        foreach ($data as $alias => $value) {
            CmsConfig::saveForSite($alias, $value ?? '', isset($names[$alias]) ? [
                'type' => ($types[$alias] ?? '') === 'textarea' ? 'text' : 'string',
                'name' => $names[$alias],
            ] : []);
        }

        // Saved without model events
        FrontCache::flush();
        AdminActivity::record('layout', AdmAction::MANAGE, 'Actualizado', $savesSocial
            ? 'logos, textos y redes sociales ('.count(SocialLinks::all()).' enlaces)'
            : 'logos y textos');

        return redirect()->route('layout.index')->with('success', __('Configuraciones de layout guardadas.'));
    }

    /**
     * The extra fields of the form: those the site's theme declares in its theme.json
     * ("layout_fields"), then any other "layout_*" setting the site has in cms_configs
     * (a parameter added for one site), as plain text under «Otros parámetros».
     *
     * @return list<array{alias: string, name: string, type: string, help: string, placeholder: string, group: string}>
     */
    private static function fields(): array
    {
        $fields = Themes::all()[Themes::current()]['layout_fields'] ?? [];
        $known = array_merge(Themes::RESERVED_LAYOUT_FIELDS, array_keys(SocialLinks::LEGACY_ALIASES), array_column($fields, 'alias'));

        $siteId = Sites::currentId();
        $rows = CmsConfig::where('alias', 'like', 'layout_%')
            ->where(fn ($query) => $query->whereNull('site_id')->when($siteId, fn ($query) => $query->orWhere('site_id', $siteId)))
            ->where('type', '!=', 'json')
            ->orderBy('id')
            ->get(['alias', 'name', 'type']);

        foreach ($rows as $row) {
            if (in_array($row->alias, $known, true) || ! preg_match('/^layout_[a-z0-9_]{1,60}$/', (string) $row->alias)) {
                continue;
            }
            $known[] = $row->alias;
            $fields[] = [
                'alias' => $row->alias,
                'name' => (string) ($row->name ?: $row->alias),
                'type' => $row->type === 'text' ? 'textarea' : 'text',
                'help' => '',
                'placeholder' => '',
                'group' => __('Otros parámetros'),
            ];
        }

        return $fields;
    }
}
