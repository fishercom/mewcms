import { localePath } from '@/lib/locale-path';
import { useTexts } from '@/lib/theme-texts';
import { CmsArticle } from '@/types/models/cms-article';
import { Head, router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import React, { useState } from 'react';
import { PageHero } from './components/post-card';
import ResultList, { TagCloud } from './components/result-list';
import { PopularTag } from './components/sidebar';
import FrontLayout from './layout';

interface SearchResult {
    id: number;
    title: string;
    excerpt: string;
    url: string;
    type: string;
    date: string;
}

interface Props {
    results: SearchResult[];
    query: string;
    navigation: Pick<CmsArticle, 'id' | 'title' | 'slug'>[];
    popularTags?: PopularTag[];
}

export default function SearchPage({ results, query, navigation, popularTags = [] }: Props) {
    const [searchText, setSearchText] = useState(query);
    const { t, choice } = useTexts();

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(localePath('/search'), { q: searchText });
    };

    return (
        <FrontLayout navigation={navigation}>
            <Head title={query ? t('search.title_query', { query }) : t('search.title')} />

            <div className="space-y-12">
                <PageHero
                    eyebrow={t('search.title')}
                    title={t('search.heading')}
                    text={query ? choice('search.results', results.length, { query }) : t('search.prompt')}
                >
                    <form onSubmit={handleSearchSubmit} role="search" className="relative max-w-xl pt-4">
                        <label htmlFor="front-search" className="sr-only">
                            {t('search.terms')}
                        </label>
                        <Search className="pointer-events-none absolute top-[calc(50%+0.5rem)] left-5 h-5 w-5 -translate-y-1/2 text-(--theme-muted)" />
                        <input
                            id="front-search"
                            type="search"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            placeholder={t('search.placeholder')}
                            className="block w-full rounded-full border border-(--theme-line) bg-(--theme-bg) py-4 pr-32 pl-13 text-base text-(--theme-ink) shadow-sm placeholder:text-(--theme-muted) focus:border-(--theme-accent) focus:ring-4 focus:ring-(--theme-accent)/15 focus:outline-none"
                        />
                        <button
                            type="submit"
                            className="absolute top-[calc(50%+0.5rem)] right-2 -translate-y-1/2 rounded-full bg-(--theme-accent) px-5 py-2.5 text-sm font-semibold text-(--theme-on-accent) transition-colors hover:bg-(--theme-accent-strong)"
                        >
                            {t('search.submit')}
                        </button>
                    </form>
                </PageHero>

                <div className="mx-auto max-w-4xl space-y-12">
                    {results.length > 0 ? (
                        <ResultList items={results} formatDates={false} />
                    ) : query ? (
                        <p className="rounded-3xl border border-dashed border-(--theme-line) py-16 text-center text-sm text-(--theme-muted)">
                            {t('search.empty')}
                        </p>
                    ) : null}

                    <TagCloud tags={popularTags} title={t('tag.list_title')} />
                </div>
            </div>
        </FrontLayout>
    );
}
