import React from 'react';
import FrontLayout from '../layout';
import { Head, Link } from '@inertiajs/react';
import { CmsArticle } from '@/types/models/cms-article';

interface PageProps {
    article: CmsArticle;
    navigation: Pick<CmsArticle, 'id' | 'title' | 'slug'>[];
    allTaxonomies?: import('@/types/models/cms-taxonomy').CmsTaxonomy[];
    recentArticles?: Pick<CmsArticle, 'id' | 'title' | 'slug' | 'created_at'>[];
}

interface PageMetadata {
    [key: string]: unknown;
}

export default function Page({ article, navigation }: PageProps) {
    const meta = (article.metadata || {}) as PageMetadata;

    // Helpers to format URL
    const getUrl = (slug: string) => {
        return '/' + slug.replace(/_/g, '/');
    };

    // Separate categories and tags
    const categoryTerms = article.terms?.filter(
        (term) => ['categorias', 'categories', 'category'].includes(term.taxonomy?.slug?.toLowerCase() || '')
    ) || [];

    const tagTerms = article.terms?.filter(
        (term) => ['tags', 'etiquetas', 'tag'].includes(term.taxonomy?.slug?.toLowerCase() || '')
    ) || [];

    return (
        <FrontLayout navigation={navigation}>
            <Head title={article.title} />

            <div className="max-w-3xl mx-auto py-6 space-y-8">
                {/* Page Header */}
                <div className="border-b border-[#19140015] dark:border-[#3E3E3A]/40 pb-6 space-y-2">
                    <h1 className="text-3xl font-extrabold sm:text-4xl tracking-tight">
                        {article.title}
                    </h1>
                    
                    {(categoryTerms.length > 0 || tagTerms.length > 0) && (
                        <div className="flex flex-wrap gap-2 pt-2">
                            {categoryTerms.map((term) => (
                                <Link
                                    key={term.id}
                                    href={`/category/${term.slug}`}
                                    className="text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-2 py-1 rounded capitalize hover:bg-amber-100 dark:hover:bg-amber-950/60 transition-colors"
                                >
                                    {term.name}
                                </Link>
                            ))}
                            {tagTerms.map((term) => (
                                <Link
                                    key={term.id}
                                    href={`/tag/${term.slug}`}
                                    className="text-xs font-semibold bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 px-2 py-1 rounded capitalize hover:bg-red-100 dark:hover:bg-red-950/60 transition-colors"
                                >
                                    #{term.name}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Custom Metadata Render */}
                <div className="space-y-6">
                    {Object.entries(meta)
                        .filter(([key]) => key !== '_id')
                        .map(([key, val]) => {
                            const readableKey = key.replace(/_/g, ' ');

                            // Render text blocks
                            if (typeof val === 'string') {
                                // Simple HTML detector
                                const isHtml = val.startsWith('<') && val.endsWith('>');
                                if (isHtml) {
                                    return (
                                        <div key={key} className="space-y-2">
                                            <h3 className="text-xs uppercase tracking-wider text-[#706f6c] dark:text-[#A1A09A] font-semibold">
                                                {readableKey}
                                            </h3>
                                            <div
                                                className="prose dark:prose-invert max-w-none text-sm leading-relaxed"
                                                dangerouslySetInnerHTML={{ __html: val }}
                                            />
                                        </div>
                                    );
                                }

                                // Image URL check
                                const isImage = /\.(jpeg|jpg|gif|png|webp)/i.test(val);
                                if (isImage && (val.startsWith('http') || val.startsWith('/'))) {
                                    return (
                                        <div key={key} className="space-y-2">
                                            <h3 className="text-xs uppercase tracking-wider text-[#706f6c] dark:text-[#A1A09A] font-semibold">
                                                {readableKey}
                                            </h3>
                                            <div className="overflow-hidden rounded-lg border border-[#19140010] dark:border-[#3E3E3A]/20">
                                                <img src={val} alt={readableKey} className="max-w-full h-auto object-cover" />
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={key} className="space-y-1">
                                        <h3 className="text-xs uppercase tracking-wider text-[#706f6c] dark:text-[#A1A09A] font-semibold">
                                            {readableKey}
                                        </h3>
                                        <p className="text-sm leading-relaxed text-[#1b1b18] dark:text-[#EDEDEC]">
                                            {val}
                                        </p>
                                    </div>
                                );
                            }

                            // Render Repeaters
                            if (Array.isArray(val)) {
                                const list = val as Record<string, unknown>[];
                                return (
                                    <div key={key} className="space-y-3 pt-4">
                                        <h3 className="text-xs uppercase tracking-wider text-[#706f6c] dark:text-[#A1A09A] font-semibold border-b pb-1">
                                            {readableKey}
                                        </h3>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            {list.map((item, idx) => (
                                                <div key={(item._id as string) || idx} className="rounded-lg border border-[#19140015] bg-[#FDFDFC] dark:border-[#3E3E3A]/40 dark:bg-[#161615] p-4 text-xs space-y-2">
                                                    {Object.entries(item)
                                                        .filter(([k]) => k !== '_id')
                                                        .map(([subK, subVal]) => (
                                                            <div key={subK}>
                                                                <span className="font-semibold capitalize text-[#706f6c] dark:text-[#A1A09A]">
                                                                    {subK.replace(/_/g, ' ')}:
                                                                </span>{' '}
                                                                <span>{String(subVal)}</span>
                                                            </div>
                                                        ))}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            }

                            return null;
                        })}
                </div>

                {/* Subpages / Child Articles List */}
                {article.children?.length ? (
                    <div className="border-t border-[#19140015] dark:border-[#3E3E3A]/40 pt-8 space-y-4">
                        <h2 className="text-lg font-bold">Páginas Hijas</h2>
                        <ul className="grid gap-4 sm:grid-cols-2">
                            {article.children.map((child) => (
                                <li key={child.id}>
                                    <Link
                                        href={getUrl(child.slug)}
                                        className="block p-4 rounded-lg border border-[#19140015] bg-white hover:border-[#f53003]/50 dark:border-[#3E3E3A]/40 dark:bg-[#161615] dark:hover:border-[#FF4433]/50 transition-all shadow-sm"
                                    >
                                        <h4 className="font-semibold text-sm capitalize">{child.title}</h4>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : null}
            </div>
        </FrontLayout>
    );
}
