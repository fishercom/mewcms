import React from 'react';
import FrontLayout from '../layout';
import { Head, Link } from '@inertiajs/react';
import { CmsPost, CmsPostType } from '@/types/models/cms-post';
import { CmsArticle } from '@/types/models/cms-article';
import { CmsTaxonomy } from '@/types/models/cms-taxonomy';
import { format } from 'date-fns';
import FrontSidebar from '../components/sidebar';
import { Calendar, User, ArrowLeft, Tag, BookOpen, Settings } from 'lucide-react';

interface Props {
    post: CmsPost;
    cpt: CmsPostType | null;
    navigation: Pick<CmsArticle, 'id' | 'title' | 'slug'>[];
    allTaxonomies?: CmsTaxonomy[];
    recentArticles?: Pick<CmsArticle, 'id' | 'title' | 'slug' | 'created_at'>[];
}

export default function Show({ post, cpt, navigation, allTaxonomies = [], recentArticles = [] }: Props) {
    const parentLabel = cpt ? cpt.name : 'Blog';
    const parentUrl = cpt ? `/${cpt.slug}` : '/blog';

    // Separate categories and tags
    const categoryTerms = post.terms?.filter(
        (term) => ['categorias', 'categories', 'category'].includes(term.taxonomy?.slug?.toLowerCase() || '')
    ) || [];

    const tagTerms = post.terms?.filter(
        (term) => ['tags', 'etiquetas', 'tag'].includes(term.taxonomy?.slug?.toLowerCase() || '')
    ) || [];

    // Filter out standard fields from custom metadata keys to print remaining fields cleanly
    const metadataEntries = Object.entries(post.metadata || {}).filter(
        ([key]) => !['_id'].includes(key) && post.metadata[key] !== null && post.metadata[key] !== ''
    );

    return (
        <FrontLayout navigation={navigation}>
            <Head title={post.title} />

            {/* Back to archive link */}
            <div className="pt-6">
                <Link
                    href={parentUrl}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-red-600 dark:text-[#A1A09A] dark:hover:text-red-500 transition-colors"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Volver a {parentLabel}</span>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-6">
                {/* Main Content Article */}
                <article className="lg:col-span-8 space-y-6">
                    <div className="space-y-4">
                        {/* Categories badges */}
                        {categoryTerms.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {categoryTerms.map((term) => (
                                    <Link
                                        key={term.id}
                                        href={`/category/${term.slug}`}
                                        className="text-xs font-semibold uppercase tracking-wider text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                    >
                                        {term.name}
                                    </Link>
                                ))}
                            </div>
                        )}
                        
                        <h1 className="text-3xl font-extrabold sm:text-5xl tracking-tight leading-tight text-zinc-900 dark:text-white capitalize">
                            {post.title}
                        </h1>

                        <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-[#A1A09A] border-b pb-4 border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>Publicado el:</span>
                                <time dateTime={post.published_at}>
                                    {format(new Date(post.published_at), 'dd/MM/yyyy HH:mm')}
                                </time>
                            </div>
                            <div className="flex items-center gap-1">
                                <User className="h-3.5 w-3.5" />
                                <span>Por {post.user?.name || 'Autor'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Featured Image */}
                    {post.featured_image && (
                        <div className="aspect-[16/9] w-full overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs bg-zinc-50">
                            <img
                                src={post.featured_image}
                                alt={post.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    {/* Post Excerpt (Lead Paragraph) */}
                    {post.excerpt && (
                        <p className="text-base text-zinc-600 dark:text-[#c5c4c0] font-medium leading-relaxed italic border-l-4 border-red-600 pl-4 py-1">
                            {post.excerpt}
                        </p>
                    )}

                    {/* Content body */}
                    <div className="pt-2">
                        {post.content ? (
                            <div
                                className="prose dark:prose-invert max-w-none leading-relaxed text-zinc-800 dark:text-[#EDEDEC] prose-red prose-sm sm:prose-base"
                                dangerouslySetInnerHTML={{ __html: post.content }}
                            />
                        ) : (
                            <p className="italic text-center text-xs text-zinc-400 py-6">
                                Sin contenido disponible.
                             </p>
                        )}
                    </div>

                    {/* Dynamic Custom Metadata fields */}
                    {metadataEntries.length > 0 && (
                        <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
                            <h4 className="text-xs uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-1.5">
                                <Settings className="h-3.5 w-3.5" />
                                <span>Detalles Adicionales</span>
                            </h4>
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {metadataEntries.map(([key, val]) => (
                                    <div key={key} className="rounded-xl bg-zinc-50 dark:bg-[#161615]/30 p-4 border border-zinc-200 dark:border-zinc-800 text-xs">
                                        <dt className="font-semibold text-zinc-700 dark:text-zinc-300 capitalize mb-1">
                                            {key.replace(/_/g, ' ')}
                                        </dt>
                                        <dd className="text-zinc-500 dark:text-[#c5c4c0] break-words">
                                            {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    )}

                    {/* Tags section */}
                    {tagTerms.length > 0 && (
                        <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
                            <h4 className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-3">
                                <Tag className="h-3.5 w-3.5 text-red-600 dark:text-red-500" />
                                <span>Etiquetas</span>
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {tagTerms.map((term) => (
                                    <Link
                                        key={term.id}
                                        href={`/tag/${term.slug}`}
                                        className="inline-flex items-center text-xs bg-zinc-50 hover:bg-red-50/20 text-zinc-600 hover:text-red-600 dark:bg-[#161615]/40 dark:text-zinc-400 dark:hover:text-red-400 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 transition-colors"
                                    >
                                        #{term.name}
                                    </Link>
                                ))}
                            </div>
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
