import React, { useState } from 'react';
import FrontLayout from './layout';
import { Head, Link, router } from '@inertiajs/react';
import { CmsArticle } from '@/types/models/cms-article';
import { CmsTaxonomy } from '@/types/models/cms-taxonomy';
import { Search, Calendar, ArrowRight } from 'lucide-react';
import FrontSidebar from './components/sidebar';

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
            <div className="py-12 border-b border-[#19140010] dark:border-[#3E3E3A]/20">
                <div className="max-w-3xl">
                    <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-zinc-900 dark:text-white">
                        Resultados de Búsqueda
                    </h1>
                    <p className="mt-3 text-sm text-zinc-500 dark:text-[#A1A09A]">
                        {query ? (
                            <>Mostrando {results.length} coincidencias encontradas para <strong className="text-red-600 dark:text-red-500 font-semibold">"{query}"</strong></>
                        ) : (
                            'Introduce un término de búsqueda para comenzar.'
                        )}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-8">
                {/* Results Column */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Search Bar Form */}
                    <form onSubmit={handleSearchSubmit} className="relative">
                        <input
                            type="text"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            placeholder="Buscar en el sitio..."
                            className="block w-full pl-4 pr-12 py-3 border border-zinc-205 dark:border-zinc-800 rounded-xl bg-white dark:bg-transparent text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                        />
                        <button
                            type="submit"
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
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
                                    className="p-5 bg-white dark:bg-[#161615]/20 border border-[#19140010] dark:border-[#3E3E3A]/40 rounded-xl hover:shadow-xs hover:border-zinc-250 dark:hover:border-zinc-700 transition-all group"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                        {/* Result dynamic type badge */}
                                        <span className="self-start px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 rounded-md border border-red-100 dark:border-red-900/30">
                                            {result.type}
                                        </span>
                                        
                                        {result.date && (
                                            <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                                                <Calendar className="h-3 w-3" />
                                                <span>{result.date}</span>
                                            </div>
                                        )}
                                    </div>

                                    <h3 className="text-base font-bold text-zinc-950 dark:text-white capitalize group-hover:text-red-600 dark:group-hover:text-red-500 transition-colors">
                                        <Link href={result.url}>
                                            {result.title}
                                        </Link>
                                    </h3>

                                    {result.excerpt && (
                                        <p className="mt-1 text-xs text-zinc-500 dark:text-[#A1A09A] line-clamp-2 leading-relaxed">
                                            {result.excerpt}
                                        </p>
                                    )}

                                    <div className="mt-3 flex justify-end">
                                        <Link href={result.url} className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 dark:text-red-500 hover:underline">
                                            <span>Ver contenido</span>
                                            <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : query ? (
                        <div className="py-16 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-400">
                            <Search className="h-8 w-8 mx-auto text-zinc-300 mb-2" />
                            <p className="text-xs">No se encontraron resultados para tu búsqueda.</p>
                        </div>
                    ) : null}
                </div>

                {/* Sidebar Column */}
                <div className="lg:col-span-4">
                    <FrontSidebar
                        allTaxonomies={allTaxonomies}
                        recentArticles={recentArticles}
                    />
                </div>
            </div>
        </FrontLayout>
    );
}
