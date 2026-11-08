<?php

namespace App\Http\Controllers\Admin;

use App\Ai\AiException;
use App\Ai\TextTranslator;
use App\Http\Controllers\Controller;
use App\Models\AdmAction;
use App\Models\CmsTranslation;
use App\Support\AdminActivity;
use App\Support\Sites;
use App\Support\Themes;
use App\Support\ThemeTexts;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Admin → Translations: the fixed texts of the site's theme, in the site's language.
 * Every key the theme knows is listed with the theme's text; saving a different value
 * keeps it for this site only, and clearing it goes back to the theme's text.
 */
class TranslationController extends Controller
{
    public function index(): Response
    {
        $theme = Themes::current();
        $locale = ThemeTexts::locale();
        $defaults = ThemeTexts::defaults($theme, $locale);
        $translated = ThemeTexts::defaults($theme, $locale, false);
        $overrides = CmsTranslation::inLocale($locale)->orderBy('key')->get()->keyBy('key');

        $themeKeys = ThemeTexts::keys($theme);
        $keys = array_values(array_unique([...$themeKeys, ...$overrides->keys()->all()]));
        sort($keys);

        $items = array_map(fn (string $key): array => [
            'key' => $key,
            'group' => explode('.', $key)[0],
            'default' => $defaults[$key] ?? null,
            // The theme has no text for it in the site's language: it shows the fallback language
            'missing' => ! array_key_exists($key, $translated),
            'value' => $overrides->get($key)?->value,
            'id' => $overrides->get($key)?->id,
            // Kept by the site but not used by its theme (e.g. after changing themes)
            'unused' => ! in_array($key, $themeKeys, true),
        ], $keys);

        return Inertia::render('admin/translations/index', [
            'items' => $items,
            'theme' => Themes::all()[$theme]['name'] ?? $theme,
            'locale' => $locale,
            'fallback' => ThemeTexts::FALLBACK,
            'site_name' => Sites::current()?->name,
        ]);
    }

    /**
     * Save the texts sent: a value equal to the theme's, or empty, removes the change.
     */
    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'texts' => 'required|array|max:1000',
            'texts.*.key' => ['required', 'string', 'max:191', 'regex:'.ThemeTexts::KEY_PATTERN],
            'texts.*.value' => 'nullable|string|max:5000',
        ]);

        $locale = ThemeTexts::locale();
        $defaults = ThemeTexts::defaults(Themes::current(), $locale);
        $changed = 0;
        foreach ($data['texts'] as $text) {
            $value = $text['value'] ?? null;
            $existing = CmsTranslation::inLocale($locale)->where('key', $text['key'])->first();

            if ($value === null || trim($value) === '' || $value === ($defaults[$text['key']] ?? null)) {
                if ($existing) {
                    $existing->delete();
                    $changed++;
                }

                continue;
            }

            if ($existing?->value === $value) {
                continue;
            }
            $existing ? $existing->update(['value' => $value]) : CmsTranslation::create(['locale' => $locale, 'key' => $text['key'], 'value' => $value]);
            $changed++;
        }

        if ($changed > 0) {
            AdminActivity::record('translations', AdmAction::MANAGE, 'Actualizado', trans_choice(':count texto|:count textos', $changed, ['count' => $changed]));
        }

        return back()->with('success', __('Textos guardados.'));
    }

    /**
     * "Traducir con IA": the theme's English texts of the keys sent (by default, every key
     * the site's language lacks and the site has not changed), translated into the
     * language being edited. Nothing is saved: the editor reviews the suggestions first.
     */
    public function suggest(Request $request, TextTranslator $translator): JsonResponse
    {
        abort_unless($request->user()->hasAdminPermission('ai', AdmAction::MANAGE), 403);

        $data = $request->validate([
            'keys' => 'nullable|array|max:'.TextTranslator::MAX_KEYS,
            'keys.*' => ['string', 'max:191', 'regex:'.ThemeTexts::KEY_PATTERN],
        ]);

        $theme = Themes::current();
        $locale = ThemeTexts::locale();
        if ($locale === ThemeTexts::FALLBACK) {
            return response()->json(['message' => __('Los textos del tema ya vienen en :locale.', ['locale' => $locale])], 422);
        }

        $source = ThemeTexts::defaults($theme, ThemeTexts::FALLBACK);
        $keys = $data['keys'] ?? ThemeTexts::missing($theme, $locale);
        $texts = array_intersect_key($source, array_flip($keys));
        if ($texts === []) {
            return response()->json(['texts' => [], 'skipped' => 0]);
        }

        $site = Sites::current()?->name;
        $context = 'interface texts of the theme «'.(Themes::all()[$theme]['name'] ?? $theme).'»'.($site ? ' on the website «'.$site.'»' : '');

        try {
            $translated = $translator->translate($texts, TextTranslator::languageName(ThemeTexts::FALLBACK), TextTranslator::languageName($locale), $context, $request->user());
        } catch (AiException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['texts' => $translated, 'skipped' => count($texts) - count($translated)]);
    }

    /**
     * Go back to the theme's text for one key.
     */
    public function destroy(CmsTranslation $translation): RedirectResponse
    {
        $translation->delete();
        AdminActivity::record('translations', AdmAction::MANAGE, 'Eliminado', $translation->key);

        return back()->with('success', __('Se restauró el texto del tema.'));
    }
}
