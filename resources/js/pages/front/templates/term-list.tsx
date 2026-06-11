/**
 * Template Name: Taxonomy Term List
 */
import React from 'react';
import FrontLayout from '../layout';
import { Head, Link } from '@inertiajs/react';
import { CmsArticle } from '@/types/models/cms-article';
import { CmsTaxonomy, CmsTaxonomyTerm } from '@/types/models/cms-taxonomy';
import { format } from 'date-fns';
import FrontSidebar from '../components/sidebar';
import { Tag, FolderOpen, Calendar, ArrowRight } from 'lucide-react';

interface TermListProps {
    term: CmsTaxonomyTerm;
    taxonomy: CmsTaxonomy;
    articles: CmsArticle[];
    navigation: Pick<CmsArticle, 'id' | 'title' | 'slug'>[];
    allTaxonomies: CmsTaxonomy[];
    recentArticles: Pick<CmsArticle, 'id' | 'title' | 'slug' | 'created_at'>[];
}

export default function TermList({
    term,
    taxonomy,
    articles = [],
    navigation,
    allTaxonomies,
    recentArticles,
}: TermListProps) {
    const isCategory = ['categorias', 'categories', 'category'].includes(taxonomy.slug.toLowerCase());
    
    // Helper to format URLs
    const getArticleUrl = (slug: string) => {
        if (!slug || slug === 'home') return '/';
        return '/' + slug.replace(/_/g, '/');
    };

    const getTermUrl = (taxSlug: string, termSlug: string) => {
        const cleanTaxSlug = taxSlug.toLowerCase();
        if (cleanTaxSlug === 'categorias' || cleanTaxSlug === 'categories' || cleanTaxSlug === 'category') {
            return `/category/${termSlug}`;
        }
        return `/tag/${termSlug}`;
    };

    // Helper to extract a short preview text from metadata
    const getExcerpt = (article: CmsArticle) => {
        const meta = article.metadata || {};
        const content = (meta.body || meta.content || meta.descripcion || '') as string;
        if (!content) return 'Sin descripción disponible.';
        
        // Strip basic HTML tags if any
        const clean = content.replace(/<\/?[^>]+(>|$)/g, "");
        if (clean.length > 160) {
            return clean.substring(0, 160) + '...';
        }
        return clean;
    };

    return (
        <FrontLayout navigation={navigation}>
            <Head title={`${taxonomy.name}: ${term.name}`} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-6">
                {/* Main Article List Column */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Filter Header */}
                    <div className="rounded-2xl bg-gradient-to-tr from-[#fff2f2] to-[#fffaf0] dark:from-[#1D0002] dark:to-[#1a0f00] p-6 sm:p-8 border border-[#19140010] dark:border-[#3E3E3A]/20 shadow-sm">
                        <div className="flex items-center gap-3 text-sm text-[#f53003] dark:text-[#FF4433] font-semibold mb-2">
                            {isCategory ? (
                                <FolderOpen className="h-5 w-5" />
                            ) : (
                                <Tag className="h-5 w-5" />
                            )}
                            <span className="capitalize">{taxonomy.name}</span>
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-[#1b1b18] dark:text-[#EDEDEC] capitalize">
                            {term.name}
                        </h1>
                        {term.description && (
                            <p className="mt-3 text-sm text-[#706f6c] dark:text-[#c5c4c0] leading-relaxed max-w-2xl">
                                {term.description}
                            </p>
                        )}
                    </div>

                    {/* Articles Feed */}
                    {articles.length > 0 ? (
                        <div className="space-y-6">
                            {articles.map((art) => (
                                <article
                                    key={art.id}
                                    className="p-6 rounded-2xl border border-[#19140012] bg-[#FDFDFC] dark:border-[#3E3E3A]/20 dark:bg-[#161615] hover:border-[#f53003]/30 dark:hover:border-[#FF4433]/30 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between"
                                >
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap items-center gap-2 text-xs">
                                            {/* Article Terms Badges */}
                                            {art.terms && art.terms.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {art.terms.map((t) => {
                                                        const tTaxSlug = t.taxonomy?.slug || 'category';
                                                        const isCat = ['categorias', 'categories', 'category'].includes(tTaxSlug.toLowerCase());
                                                        return (
                                                            <Link
                                                                key={t.id}
                                                                href={getTermUrl(tTaxSlug, t.slug)}
                                                                className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize transition-colors ${
                                                                    isCat
                                                                        ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:hover:bg-amber-950/60 dark:text-amber-400'
                                                                        : 'bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/40 dark:hover:bg-red-950/60 dark:text-red-400'
                                                                }`}
                                                            >
                                                                {isCat ? '' : '#'}
                                                                {t.name}
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            <span className="text-[#a1a09a]">•</span>

                                            <span className="flex items-center gap-1 text-[#706f6c] dark:text-[#A1A09A]">
                                                <Calendar className="h-3 w-3" />
                                                <time dateTime={art.created_at.toString()}>
                                                    {format(new Date(art.created_at), 'dd/MM/yyyy')}
                                                </time>
                                            </span>
                                        </div>

                                        <Link href={getArticleUrl(art.slug)} className="block group">
                                            <h2 className="text-xl font-bold tracking-tight text-[#1b1b18] group-hover:text-[#f53003] dark:text-[#EDEDEC] dark:group-hover:text-[#FF4433] transition-colors leading-tight capitalize">
                                                {art.title}
                                            </h2>
                                        </Link>

                                        <p className="text-sm text-[#706f6c] dark:text-[#c5c4c0] leading-relaxed">
                                            {getExcerpt(art)}
                                        </p>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-[#19140008] dark:border-[#3E3E3A]/10 flex justify-end">
                                        <Link
                                            href={getArticleUrl(art.slug)}
                                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#f53003] hover:text-[#c42400] dark:text-[#FF4433] dark:hover:text-[#ff6655] transition-colors group"
                                        >
                                            <span>Leer Más</span>
                                            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 border border-dashed border-[#19140015] dark:border-[#3E3E3A]/40 rounded-2xl">
                            <p className="text-sm text-[#706f6c] dark:text-[#A1A09A] italic">
                                No se encontraron artículos asociados con este término.
                            </p>
                        </div>
                    )}
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
