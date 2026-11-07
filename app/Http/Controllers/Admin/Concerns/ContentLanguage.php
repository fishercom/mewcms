<?php

namespace App\Http\Controllers\Admin\Concerns;

use App\Models\CmsLang;
use App\Support\Locales;
use App\Support\Sites;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

/**
 * The language that the pages and posts screens edit in: the one picked in the admin's
 * language switcher for the site being edited (its main language by default), else the
 * one picked in the admin (?lang_id=), else the first active one.
 *
 * A site with a single language lists every page of the site whatever language it was
 * saved in; a site with several lists the language being edited (see Locales::scope).
 * Only an install without sites lists one language at a time by lang_id.
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

        $lang = Sites::current() ? Locales::current() : null;
        $langId = $lang?->active ? $lang->id : null;

        $langId ??= (int) request()->get('lang_id') ?: null;
        $langId ??= CmsLang::where('active', true)->orderBy('name', 'desc')->value('id');

        return $this->resolvedLangId = $langId;
    }

    /**
     * Edit in the language of the item being opened ($langId), so its parent options and
     * the lists behind it are that language's.
     */
    protected function editIn(Request $request, ?int $langId): void
    {
        $lang = Locales::multiple() ? Locales::forContent($langId) : null;
        if ($lang && $lang->id !== Locales::currentId()) {
            Locales::choose($request, $lang->id);
            $this->resolvedLangId = null;
        }
    }

    /**
     * Limit $query to the content language.
     *
     * @template T of Builder
     *
     * @param  T  $query
     * @return T
     */
    protected function inContentLanguage(Builder $query): Builder
    {
        return Sites::current() ? Locales::scope($query) : $query->where('lang_id', $this->langId());
    }
}
