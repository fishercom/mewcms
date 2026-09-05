/**
 * Template Name: Taxonomy Term List
 */
import { CmsArticle } from '@/types/models/cms-article';
import { CmsTaxonomy, CmsTaxonomyTerm } from '@/types/models/cms-taxonomy';
import { Head, Link } from '@inertiajs/react';
import { format } from 'date-fns';
import { ArrowRight, Calendar, FolderOpen, Tag } from 'lucide-react';
import FrontSidebar from '../components/sidebar';
import FrontLayout from '../layout';

interface TermListProps {
    term: CmsTaxonomyTerm;
    taxonomy: CmsTaxonomy;
    articles: CmsArticle[];
    navigation: Pick<CmsArticle, 'id' | 'title' | 'slug'>[];
    allTaxonomies: CmsTaxonomy[];
    recentArticles: Pick<CmsArticle, 'id' | 'title' | 'slug' | 'created_at'>[];
}

export default function TermList({ term, taxonomy, articles = [], navigation, allTaxonomies, recentArticles }: TermListProps) {
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
        const clean = content.replace(/<\/?[^>]+(>|$)/g, '');
        if (clean.length > 160) {
            return clean.substring(0, 160) + '...';
        }
        return clean;
    };

    return (
        <FrontLayout navigation={navigation}>
            <Head title={`${taxonomy.name}: ${term.name}`} />

            <div className="grid grid-cols-1 gap-8 py-6 lg:grid-cols-12">
                {/* Main Article List Column */}
                <div className="space-y-8 lg:col-span-8">
                    {/* Filter Header */}
                    <div className="rounded-2xl border border-[#19140010] bg-gradient-to-tr from-[#fff2f2] to-[#fffaf0] p-6 shadow-sm sm:p-8 dark:border-[#3E3E3A]/20 dark:from-[#1D0002] dark:to-[#1a0f00]">
                        <div className="mb-2 flex items-center gap-3 text-sm font-semibold text-[#f53003] dark:text-[#FF4433]">
                            {isCategory ? <FolderOpen className="h-5 w-5" /> : <Tag className="h-5 w-5" />}
                            <span className="capitalize">{taxonomy.name}</span>
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-[#1b1b18] capitalize sm:text-4xl dark:text-[#EDEDEC]">
                            {term.name}
                        </h1>
                        {term.description && (
                            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#706f6c] dark:text-[#c5c4c0]">{term.description}</p>
                        )}
                    </div>

                    {/* Articles Feed */}
                    {articles.length > 0 ? (
                        <div className="space-y-6">
                            {articles.map((art) => (
                                <article
                                    key={art.id}
                                    className="flex flex-col justify-between rounded-2xl border border-[#19140012] bg-[#FDFDFC] p-6 shadow-sm transition-all duration-300 hover:border-[#f53003]/30 hover:shadow-md dark:border-[#3E3E3A]/20 dark:bg-[#161615] dark:hover:border-[#FF4433]/30"
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
                                                                className={`rounded px-2 py-0.5 text-[10px] font-semibold capitalize transition-colors ${
                                                                    isCat
                                                                        ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:hover:bg-amber-950/60'
                                                                        : 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950/60'
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
                                                <time dateTime={art.created_at.toString()}>{format(new Date(art.created_at), 'dd/MM/yyyy')}</time>
                                            </span>
                                        </div>

                                        <Link href={getArticleUrl(art.slug)} className="group block">
                                            <h2 className="text-xl leading-tight font-bold tracking-tight text-[#1b1b18] capitalize transition-colors group-hover:text-[#f53003] dark:text-[#EDEDEC] dark:group-hover:text-[#FF4433]">
                                                {art.title}
                                            </h2>
                                        </Link>

                                        <p className="text-sm leading-relaxed text-[#706f6c] dark:text-[#c5c4c0]">{getExcerpt(art)}</p>
                                    </div>

                                    <div className="mt-4 flex justify-end border-t border-[#19140008] pt-4 dark:border-[#3E3E3A]/10">
                                        <Link
                                            href={getArticleUrl(art.slug)}
                                            className="group inline-flex items-center gap-1 text-xs font-semibold text-[#f53003] transition-colors hover:text-[#c42400] dark:text-[#FF4433] dark:hover:text-[#ff6655]"
                                        >
                                            <span>Leer Más</span>
                                            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-[#19140015] py-16 text-center dark:border-[#3E3E3A]/40">
                            <p className="text-sm text-[#706f6c] italic dark:text-[#A1A09A]">
                                No se encontraron artículos asociados con este término.
                            </p>
                        </div>
                    )}
                </div>

                {/* Sidebar Column */}
                <div className="lg:col-span-4">
                    <FrontSidebar allTaxonomies={allTaxonomies} recentArticles={recentArticles} />
                </div>
            </div>
        </FrontLayout>
    );
}
