/**
 * Template Name: Blog Post Detail
 */
import React from 'react';
import FrontLayout from '../layout';
import { Head, Link } from '@inertiajs/react';
import { CmsArticle } from '@/types/models/cms-article';
import { format } from 'date-fns';
import FrontSidebar from '../components/sidebar';
import { Calendar, Tag } from 'lucide-react';

interface PostProps {
    article: CmsArticle;
    navigation: Pick<CmsArticle, 'id' | 'title' | 'slug'>[];
    allTaxonomies?: import('@/types/models/cms-taxonomy').CmsTaxonomy[];
    recentArticles?: Pick<CmsArticle, 'id' | 'title' | 'slug' | 'created_at'>[];
}

interface PostMetadata {
    body?: string;
    content?: string;
    descripcion?: string;
    image?: string;
    imagen?: string;
    featured_image?: string;
    [key: string]: unknown;
}

export default function Post({ article, navigation, allTaxonomies = [], recentArticles = [] }: PostProps) {
    const meta = (article.metadata || {}) as PostMetadata;

    // Try to locate common blog post fields
    const bodyContent = (meta.body || meta.content || meta.descripcion || '') as string;
    const featuredImage = (meta.image || meta.imagen || meta.featured_image || '') as string;

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

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-6">
                {/* Main Article Content */}
                <article className="lg:col-span-8 space-y-8">
                    {/* Meta details */}
                    <div className="space-y-4 text-center">
                        {categoryTerms.length > 0 && (
                            <div className="flex flex-wrap justify-center gap-2">
                                {categoryTerms.map((term) => (
                                    <Link
                                        key={term.id}
                                        href={`/category/${term.slug}`}
                                        className="text-xs font-semibold uppercase tracking-wider text-[#f53003] hover:text-[#c42400] dark:text-[#FF4433] dark:hover:text-[#ff6655] transition-colors"
                                    >
                                        {term.name}
                                    </Link>
                                ))}
                            </div>
                        )}
                        <h1 className="text-3xl font-extrabold sm:text-5xl tracking-tight leading-tight capitalize">
                            {article.title}
                        </h1>
                        <div className="flex items-center justify-center gap-1.5 text-xs text-[#706f6c] dark:text-[#A1A09A]">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>Publicado el:</span>
                            <time dateTime={article.created_at.toString()}>
                                {format(new Date(article.created_at), 'dd/MM/yyyy')}
                            </time>
                        </div>
                    </div>

                    {/* Featured Image */}
                    {featuredImage && (
                        <div className="aspect-[16/9] w-full overflow-hidden rounded-xl border border-[#19140010] dark:border-[#3E3E3A]/25 shadow-sm">
                            <img
                                src={featuredImage}
                                alt={article.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    {/* Main Article Body */}
                    <div className="pt-4 border-t border-[#19140010] dark:border-[#3E3E3A]/20">
                        {bodyContent ? (
                            bodyContent.startsWith('<') && bodyContent.endsWith('>') ? (
                                <div
                                    className="prose dark:prose-invert max-w-none leading-relaxed text-[#1b1b18] dark:text-[#EDEDEC]"
                                    dangerouslySetInnerHTML={{ __html: bodyContent }}
                                />
                            ) : (
                                <p className="whitespace-pre-line leading-relaxed text-sm text-[#1b1b18] dark:text-[#EDEDEC]">
                                    {bodyContent}
                                </p>
                            )
                        ) : (
                            <p className="italic text-center text-xs text-[#706f6c] dark:text-[#A1A09A]">
                                Sin contenido disponible.
                            </p>
                        )}
                    </div>

                    {/* Tags Section */}
                    {tagTerms.length > 0 && (
                        <div className="pt-6 border-t border-[#19140010] dark:border-[#3E3E3A]/20">
                            <h4 className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-[#706f6c] dark:text-[#A1A09A] font-semibold mb-3">
                                <Tag className="h-3.5 w-3.5 text-[#f53003] dark:text-[#FF4433]" />
                                <span>Etiquetas</span>
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {tagTerms.map((term) => (
                                    <Link
                                        key={term.id}
                                        href={`/tag/${term.slug}`}
                                        className="inline-flex items-center text-xs bg-gray-50 hover:bg-[#fff2f2] text-[#706f6c] hover:text-[#f53003] dark:bg-[#222] dark:hover:bg-[#1D0002] dark:text-[#c5c4c0] dark:hover:text-[#FF4433] px-3 py-1.5 rounded-lg border border-[#19140010] dark:border-[#3E3E3A]/50 transition-colors"
                                    >
                                        #{term.name}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Additional custom metadata listing */}
                    {Object.entries(meta).length > 2 && (
                        <div className="pt-8 border-t border-[#19140010] dark:border-[#3E3E3A]/20 space-y-4">
                            <h4 className="text-xs uppercase tracking-wider text-[#706f6c] dark:text-[#A1A09A] font-semibold">
                                Detalles del Post
                            </h4>
                            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                                {Object.entries(meta)
                                    .filter(([key]) => !['body', 'content', 'descripcion', 'image', 'imagen', 'featured_image', '_id'].includes(key))
                                    .map(([key, val]) => (
                                        <div key={key} className="rounded-lg bg-gray-50 dark:bg-[#161615] p-3 text-xs">
                                            <dt className="font-semibold text-primary capitalize mb-1">
                                                {key.replace(/_/g, ' ')}
                                            </dt>
                                            <dd className="text-[#706f6c] dark:text-[#c5c4c0] break-words">
                                                {String(val)}
                                            </dd>
                                        </div>
                                    ))}
                            </dl>
                        </div>
                    )}
                </article>

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
