import ContentRenderer from '@/components/content-renderer';
import { CmsArticle } from '@/types/models/cms-article';
import { CmsPost, CmsPostType } from '@/types/models/cms-post';
import { CmsTaxonomy } from '@/types/models/cms-taxonomy';
import { Head, Link } from '@inertiajs/react';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, Settings, Tag, User } from 'lucide-react';
import FrontSidebar from '../components/sidebar';
import FrontLayout from '../layout';

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
    const categoryTerms =
        post.terms?.filter((term) => ['categorias', 'categories', 'category'].includes(term.taxonomy?.slug?.toLowerCase() || '')) || [];

    const tagTerms = post.terms?.filter((term) => ['tags', 'etiquetas', 'tag'].includes(term.taxonomy?.slug?.toLowerCase() || '')) || [];

    // Filter out standard fields from custom metadata keys to print remaining fields cleanly
    const metadataEntries = Object.entries(post.metadata || {}).filter(
        ([key]) => !['_id'].includes(key) && !key.startsWith('seo_') && post.metadata[key] !== null && post.metadata[key] !== '',
    );

    return (
        <FrontLayout navigation={navigation}>
            <Head title={post.title} />

            {/* Back to archive link */}
            <div className="pt-6">
                <Link
                    href={parentUrl}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 transition-colors hover:text-red-600 dark:text-[#A1A09A] dark:hover:text-red-500"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Volver a {parentLabel}</span>
                </Link>
            </div>

            <div className="grid grid-cols-1 gap-8 py-6 lg:grid-cols-12">
                {/* Main Content Article */}
                <article className="space-y-6 lg:col-span-8">
                    <div className="space-y-4">
                        {/* Categories badges */}
                        {categoryTerms.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {categoryTerms.map((term) => (
                                    <Link
                                        key={term.id}
                                        href={`/category/${term.slug}`}
                                        className="text-xs font-semibold tracking-wider text-red-600 uppercase transition-colors hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                    >
                                        {term.name}
                                    </Link>
                                ))}
                            </div>
                        )}

                        <h1 className="text-3xl leading-tight font-extrabold tracking-tight text-zinc-900 capitalize sm:text-5xl dark:text-white">
                            {post.title}
                        </h1>

                        <div className="flex items-center gap-4 border-b border-zinc-100 pb-4 text-xs text-zinc-500 dark:border-zinc-800 dark:text-[#A1A09A]">
                            <div className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>Publicado el:</span>
                                <time dateTime={post.published_at}>{format(new Date(post.published_at), 'dd/MM/yyyy HH:mm')}</time>
                            </div>
                            <div className="flex items-center gap-1">
                                <User className="h-3.5 w-3.5" />
                                <span>Por {post.user?.name || 'Autor'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Featured Image */}
                    {post.featured_image && (
                        <div className="aspect-[16/9] w-full overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 shadow-xs dark:border-zinc-800">
                            <img src={post.featured_image} alt={post.title} className="h-full w-full object-cover" />
                        </div>
                    )}

                    {/* Post Excerpt (Lead Paragraph) */}
                    {post.excerpt && (
                        <p className="border-l-4 border-red-600 py-1 pl-4 text-base leading-relaxed font-medium text-zinc-600 italic dark:text-[#c5c4c0]">
                            {post.excerpt}
                        </p>
                    )}

                    {/* Content body */}
                    <div className="pt-2">
                        {post.content ? (
                            <ContentRenderer
                                html={post.content}
                                className="prose-red prose-sm sm:prose-base leading-relaxed text-zinc-800 dark:text-[#EDEDEC]"
                            />
                        ) : (
                            <p className="py-6 text-center text-xs text-zinc-400 italic">Sin contenido disponible.</p>
                        )}
                    </div>

                    {/* Dynamic Custom Metadata fields */}
                    {metadataEntries.length > 0 && (
                        <div className="space-y-4 border-t border-zinc-100 pt-6 dark:border-zinc-800">
                            <h4 className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                                <Settings className="h-3.5 w-3.5" />
                                <span>Detalles Adicionales</span>
                            </h4>
                            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {metadataEntries.map(([key, val]) => (
                                    <div
                                        key={key}
                                        className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-xs dark:border-zinc-800 dark:bg-[#161615]/30"
                                    >
                                        <dt className="mb-1 font-semibold text-zinc-700 capitalize dark:text-zinc-300">{key.replace(/_/g, ' ')}</dt>
                                        <dd className="break-words text-zinc-500 dark:text-[#c5c4c0]">
                                            {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    )}

                    {/* Tags section */}
                    {tagTerms.length > 0 && (
                        <div className="border-t border-zinc-100 pt-6 dark:border-zinc-800">
                            <h4 className="mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                                <Tag className="h-3.5 w-3.5 text-red-600 dark:text-red-500" />
                                <span>Etiquetas</span>
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {tagTerms.map((term) => (
                                    <Link
                                        key={term.id}
                                        href={`/tag/${term.slug}`}
                                        className="inline-flex items-center rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-600 transition-colors hover:bg-red-50/20 hover:text-red-600 dark:border-zinc-800 dark:bg-[#161615]/40 dark:text-zinc-400 dark:hover:text-red-400"
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
                    <FrontSidebar allTaxonomies={allTaxonomies} recentArticles={recentArticles} />
                </div>
            </div>
        </FrontLayout>
    );
}
