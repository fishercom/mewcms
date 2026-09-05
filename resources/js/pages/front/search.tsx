import { CmsArticle } from '@/types/models/cms-article';
import { CmsTaxonomy } from '@/types/models/cms-taxonomy';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowRight, Calendar, Search } from 'lucide-react';
import React, { useState } from 'react';
import FrontSidebar from './components/sidebar';
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
    allTaxonomies?: CmsTaxonomy[];
    recentArticles?: Pick<CmsArticle, 'id' | 'title' | 'slug' | 'created_at'>[];
}

export default function SearchPage({ results, query, navigation, allTaxonomies = [], recentArticles = [] }: Props) {
    const [searchText, setSearchText] = useState(query);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/search', { q: searchText });
    };

    return (
        <FrontLayout navigation={navigation}>
            <Head title={`Resultados de búsqueda para: "${query}"`} />

            {/* Header Title with gradient */}
            <div className="border-b border-[#19140010] py-12 dark:border-[#3E3E3A]/20">
                <div className="max-w-3xl">
                    <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl dark:text-white">Resultados de Búsqueda</h1>
                    <p className="mt-3 text-sm text-zinc-500 dark:text-[#A1A09A]">
                        {query ? (
                            <>
                                Mostrando {results.length} coincidencias encontradas para{' '}
                                <strong className="font-semibold text-red-600 dark:text-red-500">"{query}"</strong>
                            </>
                        ) : (
                            'Introduce un término de búsqueda para comenzar.'
                        )}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8 py-8 lg:grid-cols-12">
                {/* Results Column */}
                <div className="space-y-6 lg:col-span-8">
                    {/* Search Bar Form */}
                    <form onSubmit={handleSearchSubmit} className="relative">
                        <input
                            type="text"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            placeholder="Buscar en el sitio..."
                            className="border-zinc-205 block w-full rounded-xl border bg-white py-3 pr-12 pl-4 text-sm text-zinc-800 placeholder-zinc-400 transition-all focus:border-transparent focus:ring-2 focus:ring-red-500 focus:outline-none dark:border-zinc-800 dark:bg-transparent dark:text-zinc-200"
                        />
                        <button
                            type="submit"
                            className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-lg bg-red-600 p-1.5 text-white transition-colors hover:bg-red-700"
                        >
                            <Search className="h-4 w-4" />
                        </button>
                    </form>

                    {/* Results lists */}
                    {results.length > 0 ? (
                        <div className="space-y-4">
                            {results.map((result, idx) => (
                                <article
                                    key={`${result.type}-${result.id}-${idx}`}
                                    className="hover:border-zinc-250 group rounded-xl border border-[#19140010] bg-white p-5 transition-all hover:shadow-xs dark:border-[#3E3E3A]/40 dark:bg-[#161615]/20 dark:hover:border-zinc-700"
                                >
                                    <div className="mb-2 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                                        {/* Result dynamic type badge */}
                                        <span className="self-start rounded-md border border-red-100 bg-red-50 px-2 py-0.5 text-[9px] font-bold tracking-wider text-red-700 uppercase dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">
                                            {result.type}
                                        </span>

                                        {result.date && (
                                            <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                                                <Calendar className="h-3 w-3" />
                                                <span>{result.date}</span>
                                            </div>
                                        )}
                                    </div>

                                    <h3 className="text-base font-bold text-zinc-950 capitalize transition-colors group-hover:text-red-600 dark:text-white dark:group-hover:text-red-500">
                                        <Link href={result.url}>{result.title}</Link>
                                    </h3>

                                    {result.excerpt && (
                                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500 dark:text-[#A1A09A]">
                                            {result.excerpt}
                                        </p>
                                    )}

                                    <div className="mt-3 flex justify-end">
                                        <Link
                                            href={result.url}
                                            className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:underline dark:text-red-500"
                                        >
                                            <span>Ver contenido</span>
                                            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : query ? (
                        <div className="rounded-xl border border-dashed border-zinc-200 py-16 text-center text-zinc-400 dark:border-zinc-800">
                            <Search className="mx-auto mb-2 h-8 w-8 text-zinc-300" />
                            <p className="text-xs">No se encontraron resultados para tu búsqueda.</p>
                        </div>
                    ) : null}
                </div>

                {/* Sidebar Column */}
                <div className="lg:col-span-4">
                    <FrontSidebar allTaxonomies={allTaxonomies} recentArticles={recentArticles} />
                </div>
            </div>
        </FrontLayout>
    );
}
