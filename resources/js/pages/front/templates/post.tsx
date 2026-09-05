/**
 * Template Name: Blog Post Detail
 */
import ContentRenderer from '@/components/content-renderer';
import { CmsArticle } from '@/types/models/cms-article';
import { Head, Link } from '@inertiajs/react';
import { format } from 'date-fns';
import { Calendar, Tag } from 'lucide-react';
import FrontSidebar from '../components/sidebar';
import FrontLayout from '../layout';

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
    const categoryTerms =
        article.terms?.filter((term) => ['categorias', 'categories', 'category'].includes(term.taxonomy?.slug?.toLowerCase() || '')) || [];

    const tagTerms = article.terms?.filter((term) => ['tags', 'etiquetas', 'tag'].includes(term.taxonomy?.slug?.toLowerCase() || '')) || [];

    return (
        <FrontLayout navigation={navigation}>
            <Head title={article.title} />

            <div className="grid grid-cols-1 gap-8 py-6 lg:grid-cols-12">
                {/* Main Article Content */}
                <article className="space-y-8 lg:col-span-8">
                    {/* Meta details */}
                    <div className="space-y-4 text-center">
                        {categoryTerms.length > 0 && (
                            <div className="flex flex-wrap justify-center gap-2">
                                {categoryTerms.map((term) => (
                                    <Link
                                        key={term.id}
                                        href={`/category/${term.slug}`}
                                        className="text-xs font-semibold tracking-wider text-[#f53003] uppercase transition-colors hover:text-[#c42400] dark:text-[#FF4433] dark:hover:text-[#ff6655]"
                                    >
                                        {term.name}
                                    </Link>
                                ))}
                            </div>
                        )}
                        <h1 className="text-3xl leading-tight font-extrabold tracking-tight capitalize sm:text-5xl">{article.title}</h1>
                        <div className="flex items-center justify-center gap-1.5 text-xs text-[#706f6c] dark:text-[#A1A09A]">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>Publicado el:</span>
                            <time dateTime={article.created_at.toString()}>{format(new Date(article.created_at), 'dd/MM/yyyy')}</time>
                        </div>
                    </div>

                    {/* Featured Image */}
                    {featuredImage && (
                        <div className="aspect-[16/9] w-full overflow-hidden rounded-xl border border-[#19140010] shadow-sm dark:border-[#3E3E3A]/25">
                            <img src={featuredImage} alt={article.title} className="h-full w-full object-cover" />
                        </div>
                    )}

                    {/* Main Article Body */}
                    <div className="border-t border-[#19140010] pt-4 dark:border-[#3E3E3A]/20">
                        {bodyContent ? (
                            bodyContent.startsWith('<') && bodyContent.endsWith('>') ? (
                                <ContentRenderer html={bodyContent} className="leading-relaxed text-[#1b1b18] dark:text-[#EDEDEC]" />
                            ) : (
                                <p className="text-sm leading-relaxed whitespace-pre-line text-[#1b1b18] dark:text-[#EDEDEC]">{bodyContent}</p>
                            )
                        ) : (
                            <p className="text-center text-xs text-[#706f6c] italic dark:text-[#A1A09A]">Sin contenido disponible.</p>
                        )}
                    </div>

                    {/* Tags Section */}
                    {tagTerms.length > 0 && (
                        <div className="border-t border-[#19140010] pt-6 dark:border-[#3E3E3A]/20">
                            <h4 className="mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-wider text-[#706f6c] uppercase dark:text-[#A1A09A]">
                                <Tag className="h-3.5 w-3.5 text-[#f53003] dark:text-[#FF4433]" />
                                <span>Etiquetas</span>
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {tagTerms.map((term) => (
                                    <Link
                                        key={term.id}
                                        href={`/tag/${term.slug}`}
                                        className="inline-flex items-center rounded-lg border border-[#19140010] bg-gray-50 px-3 py-1.5 text-xs text-[#706f6c] transition-colors hover:bg-[#fff2f2] hover:text-[#f53003] dark:border-[#3E3E3A]/50 dark:bg-[#222] dark:text-[#c5c4c0] dark:hover:bg-[#1D0002] dark:hover:text-[#FF4433]"
                                    >
                                        #{term.name}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Additional custom metadata listing */}
                    {Object.entries(meta).filter(
                        ([key]) =>
                            !['body', 'content', 'descripcion', 'image', 'imagen', 'featured_image', '_id'].includes(key) && !key.startsWith('seo_'),
                    ).length > 0 && (
                        <div className="space-y-4 border-t border-[#19140010] pt-8 dark:border-[#3E3E3A]/20">
                            <h4 className="text-xs font-semibold tracking-wider text-[#706f6c] uppercase dark:text-[#A1A09A]">Detalles del Post</h4>
                            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                                {Object.entries(meta)
                                    .filter(
                                        ([key]) =>
                                            !['body', 'content', 'descripcion', 'image', 'imagen', 'featured_image', '_id'].includes(key) &&
                                            !key.startsWith('seo_'),
                                    )
                                    .map(([key, val]) => (
                                        <div key={key} className="rounded-lg bg-gray-50 p-3 text-xs dark:bg-[#161615]">
                                            <dt className="text-primary mb-1 font-semibold capitalize">{key.replace(/_/g, ' ')}</dt>
                                            <dd className="break-words text-[#706f6c] dark:text-[#c5c4c0]">{String(val)}</dd>
                                        </div>
                                    ))}
                            </dl>
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
