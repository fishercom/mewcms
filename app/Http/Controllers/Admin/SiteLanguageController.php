<?php

namespace App\Http\Controllers\Admin;

use App\Ai\AiException;
use App\Ai\AiManager;
use App\Ai\AiSettings;
use App\Http\Controllers\Controller;
use App\Models\AdmAction;
use App\Models\CmsLang;
use App\Models\CmsSite;
use App\Support\AdminActivity;
use App\Support\LanguagePreparer;
use App\Support\Locales;
use App\Support\Sites;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Sites → "Preparar versión en …": builds a new language of a site from its main one
 * (pages and posts as drafts, menus, theme texts), then publishes the drafts once the
 * editor has reviewed them. The page runs the steps one request at a time.
 */
class SiteLanguageController extends Controller
{
    public function show(CmsSite $site, int $lang, Request $request, LanguagePreparer $preparer, AiManager $ai): Response|RedirectResponse
    {
        // The work happens on the site the admin is in: switch to it first
        if ($site->id !== Sites::currentId()) {
            $request->session()->put(Sites::SESSION_KEY, $site->id);

            return redirect()->route('sites.languages.show', [$site->id, $lang]);
        }

        $target = $this->language($lang);
        $canUseAi = (bool) $request->user()->hasAdminPermission('ai', AdmAction::MANAGE) && $ai->enabled();

        return Inertia::render('admin/sites/language', [
            'site_id' => $site->id,
            'site_name' => $site->name,
            'target' => $target->only(['id', 'name', 'iso']),
            'source' => Locales::main()?->only(['id', 'name', 'iso']),
            'summary' => $preparer->summary($target),
            'tasks' => $preparer->tasks($target, $canUseAi),
            'drafts' => $preparer->drafts($target),
            'ai' => $canUseAi ? [
                'available' => $ai->available(),
                'spent' => round($ai->monthSpent(), 4),
                'budget' => (float) AiSettings::all()['monthly_budget'],
            ] : null,
        ]);
    }

    /**
     * One step of the preparation (a page, a post, a menu, a batch of theme texts, or the links).
     */
    public function step(CmsSite $site, int $lang, Request $request, LanguagePreparer $preparer): JsonResponse
    {
        abort_unless($site->id === Sites::currentId(), 409);
        $target = $this->language($lang);

        $data = $request->validate([
            'type' => ['required', Rule::in([LanguagePreparer::TASK_PAGE, LanguagePreparer::TASK_POST, LanguagePreparer::TASK_MENU, LanguagePreparer::TASK_TEXTS, LanguagePreparer::TASK_LINKS])],
            'id' => 'nullable|integer',
            'ai' => 'boolean',
        ]);
        $useAi = (bool) ($data['ai'] ?? false);
        abort_if($useAi && ! $request->user()->hasAdminPermission('ai', AdmAction::MANAGE), 403);

        try {
            $result = $preparer->run($data['type'], $data['id'] ?? null, $target, $useAi, $request->user());
        } catch (AiException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['ok' => true, ...$result]);
    }

    /**
     * "Publicar todas": publish the drafts of the language made from published pages and posts.
     */
    public function publish(CmsSite $site, int $lang, Request $request, LanguagePreparer $preparer): RedirectResponse
    {
        abort_unless($site->id === Sites::currentId(), 409);
        $target = $this->language($lang);

        $count = $preparer->publish($target, $request->user());
        AdminActivity::record('sites', AdmAction::MANAGE, 'Publicado', $target->name.': '.$count);

        return back()->with('success', trans_choice(':count versión publicada en :lang.|:count versiones publicadas en :lang.', $count, ['count' => $count, 'lang' => $target->name]));
    }

    /**
     * An extra language of the current site, or a 404.
     */
    protected function language(int $langId): CmsLang
    {
        $lang = Locales::extra()->firstWhere('id', $langId);
        abort_unless($lang, 404);

        return $lang;
    }
}
