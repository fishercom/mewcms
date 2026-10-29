<?php

namespace App\Http\Controllers\Admin\Concerns;

use App\Models\CmsLang;
use App\Support\Sites;
use Illuminate\Database\Eloquent\Builder;

/**
 * The language that the pages and posts screens edit in: the language of the site being
 * edited, else the one picked in the admin (?lang_id=), else the first active one.
 *
 * Each site holds the content of one language, so with sites the lists show every page
 * of the site whatever language it was saved in; only an install without sites lists
 * one language at a time.
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

        $siteLang = Sites::current()?->lang_id;
        $langId = $siteLang && CmsLang::whereKey($siteLang)->where('active', true)->exists() ? $siteLang : null;

        $langId ??= (int) request()->get('lang_id') ?: null;
        $langId ??= CmsLang::where('active', true)->orderBy('name', 'desc')->value('id');

        return $this->resolvedLangId = $langId;
    }

    /**
     * Limit $query to the content language when there are no sites to do it.
     *
     * @template T of Builder
     *
     * @param  T  $query
     * @return T
     */
    protected function inContentLanguage(Builder $query): Builder
    {
        return Sites::current() ? $query : $query->where('lang_id', $this->langId());
    }
}
