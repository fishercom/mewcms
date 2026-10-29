<?php

namespace App\Http\Controllers\Admin\Concerns;

use App\Models\CmsLang;
use App\Support\Sites;

/**
 * The language that the pages and posts screens list and edit in: the one picked in the
 * admin (?lang_id=), else the language of the site being edited, else the first active one.
 *
 * Resolved on first use rather than in the constructor: controllers are built before the
 * web middleware runs, so the current site (and the admin's site switcher) is not known there.
 */
trait ContentLanguage
{
    private ?int $resolvedLangId = null;

    protected function langId(): ?int
    {
        if ($this->resolvedLangId !== null) {
            return $this->resolvedLangId;
        }

        $langId = (int) request()->get('lang_id') ?: null;

        if (! $langId) {
            $siteLang = Sites::current()?->lang_id;
            if ($siteLang && CmsLang::whereKey($siteLang)->where('active', true)->exists()) {
                $langId = $siteLang;
            }
        }

        $langId ??= CmsLang::where('active', true)->orderBy('name', 'desc')->value('id');

        return $this->resolvedLangId = $langId;
    }
}
