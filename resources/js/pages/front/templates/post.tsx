import React from 'react';
import FrontLayout from '../layout';
import { Head } from '@inertiajs/react';
import { CmsArticle } from '@/types/models/cms-article';
import { format } from 'date-fns';

interface PostProps {
    article: CmsArticle;
    navigation: Pick<CmsArticle, 'id' | 'title' | 'slug'>[];
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

export default function Post({ article, navigation }: PostProps) {
    const meta = (article.metadata || {}) as PostMetadata;

    // Try to locate common blog post fields
    const bodyContent = (meta.body || meta.content || meta.descripcion || '') as string;
    const featuredImage = (meta.image || meta.imagen || meta.featured_image || '') as string;

    return (
        <FrontLayout navigation={navigation}>
            <Head title={article.title} />

            <article className="max-w-2xl mx-auto py-8 space-y-8">
                {/* Meta details */}
                <div className="space-y-4 text-center">
                    <h1 className="text-3xl font-extrabold sm:text-5xl tracking-tight leading-tight">
                        {article.title}
                    </h1>
                    <div className="flex items-center justify-center gap-2 text-xs text-[#706f6c] dark:text-[#A1A09A]">
                        <span>Publicado el:</span>
                        <time dateTime={article.created_at.toString()}>
                            {format(new Date(article.created_at), 'dd/MM/yyyy')}
                        </time>
                    </div>
                </div>

                {/* Featured Image */}
                {featuredImage && (
                    <div className="aspect-[16/9] w-full overflow-hidden rounded-xl border border-[#19140010] dark:border-[#3E3E3A]/20">
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
        </FrontLayout>
    );
}
