<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CmsLang;
use App\Models\CmsSite;
use App\Rules\SafeUrl;
use App\Support\FrontCache;
use App\Support\Locales;
use App\Support\Sites;
use App\Support\Themes;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Redirector;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class SiteController extends Controller
{
    /**
     * Show the user's log settings page.
     */
    public function index(Request $request): Response
    {
        $s = $request->get('s');

        $items = CmsSite::select()
            ->where(function ($query) use ($s): void {
                if (! empty($s)) {
                    $query->where('name', 'LIKE', '%'.str_replace(' ', '%', $s).'%');
                }
            })
            ->orderByDesc('default')
            ->orderBy('name')
            ->paginate(15);

        // Where to see each site, and whether "/" shows anything yet
        $items->getCollection()->transform(fn (CmsSite $site): CmsSite => $site->setAttribute('public_url', $site->publicUrl())
            ->setAttribute('has_home', $site->hasHomePage()));

        return Inertia::render('admin/sites/index', [
            'items' => $items,
            'themes' => Themes::all(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/sites/create', $this->formOptions());
    }

    public function store(Request $request): Redirector|RedirectResponse
    {
        $data = $this->validatedData($request);
        $site = new CmsSite(Arr::except($data, 'lang_ids'));
        $site->save();
        $this->syncLangs($site, $data);

        return redirect('admin/sites');
    }

    /**
     * Show the user's log settings page.
     */
    public function edit($id, Request $request): Response
    {
        $item = CmsSite::findOrFail($id);
        $item->setAttribute('lang_ids', $item->langs()->pluck('cms_langs.id')->all());

        return Inertia::render('admin/sites/edit', [
            'item' => $item,
            ...$this->formOptions(),
        ]);
    }

    /**
     * Update the user's log settings.
     */
    public function update($id, Request $request): RedirectResponse
    {
        $item = CmsSite::findOrFail($id);
        $data = $this->validatedData($request, $item->id);
        $item->fill(Arr::except($data, 'lang_ids'));
        $item->save();
        $this->syncLangs($item, $data);

        return redirect('admin/sites');
    }

    /**
     * Delete the user's account.
     */
    public function destroy($id, Request $request): RedirectResponse
    {
        $item = CmsSite::findOrFail($id);

        // Deleting a site would orphan its pages, posts and menus: they must go first
        if ($item->hasContent()) {
            return back()->withErrors(['error' => __('Este sitio todavía tiene contenido. Elimínalo o muévelo antes de borrar el sitio.')]);
        }
        if ($item->default && CmsSite::count() > 1) {
            return back()->withErrors(['error' => __('Elige otro sitio por defecto antes de borrar este.')]);
        }

        $item->delete();
        if ((int) $request->session()->get(Sites::SESSION_KEY) === $item->id) {
            $request->session()->forget(Sites::SESSION_KEY);
        }

        return redirect('admin/sites');
    }

    /**
     * Preview image of a theme (the screenshot.png in its folder).
     */
    public function themeScreenshot(string $theme): BinaryFileResponse
    {
        abort_unless(Themes::exists($theme) && Themes::all()[$theme]['screenshot'], 404);

        return response()->file(Themes::dir($theme, 'screenshot.png'), ['Cache-Control' => 'public, max-age=86400']);
    }

    /**
     * @return array<string, mixed>
     */
    protected function formOptions(): array
    {
        return [
            'themes' => array_values(Themes::all()),
            'langs' => CmsLang::where('active', true)->orderBy('name')->get(['id', 'name', 'iso']),
        ];
    }

    /**
     * Save the site's extra languages (the main one is never listed among them).
     *
     * @param  array<string, mixed>  $data
     */
    protected function syncLangs(CmsSite $site, array $data): void
    {
        $ids = array_values(array_diff(array_map('intval', $data['lang_ids'] ?? []), [(int) $site->lang_id]));
        $changes = $site->langs()->sync($ids);

        if (array_filter($changes) !== []) {
            Sites::flush();
            FrontCache::flush();
        }
    }

    /**
     * Work on another site in the admin: content lists and editors show that site's
     * pages, posts, menus, forms, sliders, redirects and layout settings.
     */
    public function switch($id, Request $request): RedirectResponse
    {
        $site = CmsSite::findOrFail($id);
        $request->session()->put(Sites::SESSION_KEY, $site->id);

        return back()->with('success', __('Ahora trabajas en el sitio :name.', ['name' => $site->name]));
    }

    /**
     * Edit the current site in another of its languages: page and post lists, editors and
     * the theme texts show that language.
     */
    public function language(int $lang, Request $request): RedirectResponse
    {
        $chosen = Locales::choose($request, $lang);
        abort_unless($chosen, 404);

        return back()->with('success', __('Ahora editas en :name.', ['name' => $chosen->name]));
    }

    /**
     * @return array<string, mixed>
     */
    protected function validatedData(Request $request, ?int $id = null): array
    {
        // One host per line or separated by commas
        if (is_string($request->input('domains'))) {
            $request->merge(['domains' => preg_split('/[\s,]+/', $request->input('domains'), -1, PREG_SPLIT_NO_EMPTY)]);
        }

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'site_url' => ['nullable', 'url:http,https', 'max:255', Rule::unique('cms_sites', 'site_url')->ignore($id)],
            'domains' => 'nullable|array|max:20',
            'domains.*' => ['string', 'max:255', 'regex:/^(https?:\/\/)?[a-z0-9.-]+(:\d+)?\/?$/i'],
            'theme' => ['required', 'string', Rule::in(array_keys(Themes::all()))],
            'lang_id' => 'required|integer|exists:cms_langs,id',
            'lang_ids' => 'nullable|array|max:50',
            'lang_ids.*' => ['integer', Rule::exists('cms_langs', 'id')->where('active', true)],
            'currency' => ['nullable', 'string', 'size:3', 'regex:/^[A-Za-z]{3}$/'],
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:500',
            'favicon' => ['nullable', 'string', 'max:2048', new SafeUrl],
            'head_scripts' => 'nullable|string|max:20000',
            'body_scripts' => 'nullable|string|max:20000',
            'default' => 'nullable|boolean',
            'active' => 'nullable|boolean',
        ], [
            'domains.*.regex' => __('Dominio no válido: usa solo el nombre, como www.ejemplo.com.'),
        ]);

        // A domain answers for one site only
        $taken = Sites::all()
            ->reject(fn (CmsSite $site): bool => $site->id === $id)
            ->flatMap(fn (CmsSite $site): array => $site->hosts());
        $hosts = array_map(fn (string $domain): string => CmsSite::normalizeDomain($domain), $data['domains'] ?? []);
        if (filled($data['site_url'] ?? null)) {
            $hosts[] = CmsSite::normalizeDomain($data['site_url']);
        }
        $clash = $taken->intersect($hosts)->first();
        if ($clash !== null) {
            throw ValidationException::withMessages(['domains' => __('El dominio :domain ya pertenece a otro sitio.', ['domain' => $clash])]);
        }

        return $data;
    }
}
