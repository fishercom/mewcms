/**
 * Template Name: Standard Page
 */
import ContentRenderer from '@/components/content-renderer';
import { CmsArticle } from '@/types/models/cms-article';
import { Head, Link } from '@inertiajs/react';
import FrontLayout from '../layout';

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
    const categoryTerms =
        article.terms?.filter((term) => ['categorias', 'categories', 'category'].includes(term.taxonomy?.slug?.toLowerCase() || '')) || [];

    const tagTerms = article.terms?.filter((term) => ['tags', 'etiquetas', 'tag'].includes(term.taxonomy?.slug?.toLowerCase() || '')) || [];

    return (
        <FrontLayout navigation={navigation}>
            <Head title={article.title} />

            <div className="mx-auto max-w-3xl space-y-8 py-6">
                {/* Page Header */}
                <div className="space-y-2 border-b border-[#19140015] pb-6 dark:border-[#3E3E3A]/40">
                    <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{article.title}</h1>

                    {(categoryTerms.length > 0 || tagTerms.length > 0) && (
                        <div className="flex flex-wrap gap-2 pt-2">
                            {categoryTerms.map((term) => (
                                <Link
                                    key={term.id}
                                    href={`/category/${term.slug}`}
                                    className="rounded bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 capitalize transition-colors hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:hover:bg-amber-950/60"
                                >
                                    {term.name}
                                </Link>
                            ))}
                            {tagTerms.map((term) => (
                                <Link
                                    key={term.id}
                                    href={`/tag/${term.slug}`}
                                    className="rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 capitalize transition-colors hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950/60"
                                >
                                    #{term.name}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Main default page content (WordPress-style) */}
                {article.featured_image && (
                    <div className="aspect-video w-full overflow-hidden rounded-xl border border-zinc-200 shadow-xs md:aspect-[21/9] dark:border-zinc-800">
                        <img src={article.featured_image} alt={article.title} className="h-full w-full object-cover" />
                    </div>
                )}

                {article.excerpt && (
                    <p className="text-zinc-650 border-l-2 border-red-500 py-1 pl-4 text-sm leading-relaxed font-medium italic dark:border-red-600 dark:text-[#A1A09A]">
                        {article.excerpt}
                    </p>
                )}

                {article.content && <ContentRenderer html={article.content} className="text-sm leading-relaxed" />}

                {/* Custom Metadata Render */}
                <div className="space-y-6">
                    {Object.entries(meta)
                        .filter(([key]) => key !== '_id' && !key.startsWith('seo_'))
                        .map(([key, val]) => {
                            const readableKey = key.replace(/_/g, ' ');

                            // Render text blocks
                            if (typeof val === 'string') {
                                // Simple HTML detector
                                const isHtml = val.startsWith('<') && val.endsWith('>');
                                if (isHtml) {
                                    return (
                                        <div key={key} className="space-y-2">
                                            <h3 className="text-xs font-semibold tracking-wider text-[#706f6c] uppercase dark:text-[#A1A09A]">
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
                                            <h3 className="text-xs font-semibold tracking-wider text-[#706f6c] uppercase dark:text-[#A1A09A]">
                                                {readableKey}
                                            </h3>
                                            <div className="overflow-hidden rounded-lg border border-[#19140010] dark:border-[#3E3E3A]/20">
                                                <img src={val} alt={readableKey} className="h-auto max-w-full object-cover" />
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={key} className="space-y-1">
                                        <h3 className="text-xs font-semibold tracking-wider text-[#706f6c] uppercase dark:text-[#A1A09A]">
                                            {readableKey}
                                        </h3>
                                        <p className="text-sm leading-relaxed text-[#1b1b18] dark:text-[#EDEDEC]">{val}</p>
                                    </div>
                                );
                            }

                            // Render Repeaters
                            if (Array.isArray(val)) {
                                const list = val as Record<string, unknown>[];
                                return (
                                    <div key={key} className="space-y-3 pt-4">
                                        <h3 className="border-b pb-1 text-xs font-semibold tracking-wider text-[#706f6c] uppercase dark:text-[#A1A09A]">
                                            {readableKey}
                                        </h3>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            {list.map((item, idx) => (
                                                <div
                                                    key={(item._id as string) || idx}
                                                    className="space-y-2 rounded-lg border border-[#19140015] bg-[#FDFDFC] p-4 text-xs dark:border-[#3E3E3A]/40 dark:bg-[#161615]"
                                                >
                                                    {Object.entries(item)
                                                        .filter(([k]) => k !== '_id')
                                                        .map(([subK, subVal]) => (
                                                            <div key={subK}>
                                                                <span className="font-semibold text-[#706f6c] capitalize dark:text-[#A1A09A]">
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
                    <div className="space-y-4 border-t border-[#19140015] pt-8 dark:border-[#3E3E3A]/40">
                        <h2 className="text-lg font-bold">Páginas Hijas</h2>
                        <ul className="grid gap-4 sm:grid-cols-2">
                            {article.children.map((child) => (
                                <li key={child.id}>
                                    <Link
                                        href={getUrl(child.slug)}
                                        className="block rounded-lg border border-[#19140015] bg-white p-4 shadow-sm transition-all hover:border-[#f53003]/50 dark:border-[#3E3E3A]/40 dark:bg-[#161615] dark:hover:border-[#FF4433]/50"
                                    >
                                        <h4 className="text-sm font-semibold capitalize">{child.title}</h4>
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
