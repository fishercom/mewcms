/**
 * Template Name: Standard Page
 */
import Blocks from '@/components/blocks';
import { MediaImage } from '@/components/media-image';
import { CmsArticle } from '@/types/models/cms-article';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { PostRow, type CardPost } from '../components/post-card';
import JournalLayout from '../layout';

interface PageProps {
    article: CmsArticle;
    recentPosts?: CardPost[];
}

export default function Page({ article, recentPosts = [] }: PageProps) {
    const m = (article.metadata || {}) as Record<string, string | undefined>;

    return (
        <JournalLayout>
            <Head title={article.title} />

            <header className="mx-auto max-w-3xl px-5 pt-16 text-center sm:px-8 sm:pt-20">
                <p className="text-terracotta text-[0.72rem] font-semibold tracking-[0.3em] uppercase">{m.eyebrow || 'The journal'}</p>
                <h1 className="text-ink mt-4 text-[2.8rem] leading-[1.05] sm:text-[3.8rem]">{m.subtitle || article.title}</h1>
                {article.excerpt && (
                    <p className="font-read text-graphite mx-auto mt-6 max-w-2xl text-[1.3rem] leading-relaxed italic">{article.excerpt}</p>
                )}
            </header>

            {article.featured_image && (
                <div className="mx-auto mt-12 max-w-5xl px-5 sm:px-8">
                    <MediaImage
                        src={article.featured_image}
                        fallbackAlt={article.title}
                        loading="eager"
                        sizes="(max-width: 1100px) 100vw, 1000px"
                        className="aspect-[21/10] w-full rounded-[2rem] object-cover"
                    />
                </div>
            )}

            <div className="mx-auto grid max-w-6xl gap-16 px-5 pt-14 sm:px-8 lg:grid-cols-12">
                <div className="lg:col-span-8">
                    <Blocks blocks={article.blocks} html={article.content} className="space-y-8" textClassName="journal-prose prose max-w-none" />

                    {article.children?.length ? (
                        <ul className="border-line mt-12 divide-y divide-[var(--color-line)] border-y">
                            {article.children.map((child) => (
                                <li key={child.id}>
                                    <Link
                                        href={child.url ?? '/' + child.slug}
                                        className="group text-ink hover:text-sage-deep flex items-center justify-between py-5 transition-colors"
                                    >
                                        <span className="font-display text-2xl">{child.title}</span>
                                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : null}
                </div>

                {recentPosts.length > 0 && (
                    <aside className="lg:col-span-4">
                        <div className="border-ink/80 mb-8 border-b pb-3">
                            <h2 className="font-ui text-ink text-[0.75rem] font-semibold tracking-[0.28em] uppercase">Latest articles</h2>
                        </div>
                        {recentPosts.slice(0, 4).map((post) => (
                            <PostRow key={post.id} post={post} />
                        ))}
                    </aside>
                )}
            </div>
        </JournalLayout>
    );
}
