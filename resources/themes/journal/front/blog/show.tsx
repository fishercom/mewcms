import Blocks from '@/components/blocks';
import { MediaImage } from '@/components/media-image';
import { tagUrl } from '@/lib/tag-url';
import { CmsPost, CmsPostType } from '@/types/models/cms-post';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowUpRight, Clock } from 'lucide-react';
import { PostCard, postDate, readingTime, type CardPost } from '../components/post-card';
import JournalLayout from '../layout';

interface Props {
    post: CmsPost;
    cpt: CmsPostType | null;
    recentPosts?: CardPost[];
}

export default function Show({ post, cpt, recentPosts = [] }: Props) {
    const settings = usePage<{ layout_settings?: Record<string, string> }>().props.layout_settings ?? {};
    const parentUrl = cpt ? `/${cpt.slug}` : '/blog';
    const tags = post.tags ?? [];
    const meta = (post.metadata || {}) as Record<string, string | undefined>;
    const related = recentPosts.filter((item) => item.id !== post.id).slice(0, 3);

    return (
        <JournalLayout>
            <Head title={post.title} />

            <article>
                <header className="mx-auto max-w-3xl px-5 pt-14 text-center sm:px-8 sm:pt-20">
                    <Link href={parentUrl} className="text-graphite hover:text-sage-deep inline-flex items-center gap-1.5 text-sm transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                        All articles
                    </Link>
                    {tags[0] && (
                        <p className="mt-8">
                            <Link href={tagUrl(tags[0].slug)} className="text-terracotta text-[0.72rem] font-semibold tracking-[0.3em] uppercase">
                                {tags[0].name}
                            </Link>
                        </p>
                    )}
                    <h1 className="text-ink mt-4 text-[2.5rem] leading-[1.06] sm:text-[3.6rem]">{post.title}</h1>
                    {post.excerpt && (
                        <p className="font-read text-graphite mx-auto mt-6 max-w-2xl text-[1.35rem] leading-relaxed italic">{post.excerpt}</p>
                    )}
                    <p className="text-graphite mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm">
                        <span>By {meta.author || post.user?.name || 'The editors'}</span>
                        <span aria-hidden="true">·</span>
                        <time dateTime={post.published_at}>{postDate(post.published_at)}</time>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" /> {readingTime(post)} min read
                        </span>
                    </p>
                </header>

                {post.featured_image && (
                    <figure className="mx-auto mt-12 max-w-6xl px-5 sm:px-8">
                        <div className="overflow-hidden rounded-[2rem]">
                            <MediaImage
                                src={post.featured_image}
                                fallbackAlt={post.title}
                                loading="eager"
                                sizes="(max-width: 1200px) 100vw, 1150px"
                                className="aspect-[16/9] w-full object-cover"
                            />
                        </div>
                        {meta.image_credit && (
                            <figcaption className="text-graphite mt-3 text-center text-xs">
                                {meta.image_credit_url ? (
                                    <a
                                        href={meta.image_credit_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:text-sage-deep underline-offset-2 hover:underline"
                                    >
                                        {meta.image_credit}
                                    </a>
                                ) : (
                                    meta.image_credit
                                )}
                            </figcaption>
                        )}
                    </figure>
                )}

                <div className="mx-auto max-w-[44rem] px-5 pt-14 sm:px-8">
                    <Blocks blocks={post.blocks} html={post.content} className="space-y-8" textClassName="journal-prose prose max-w-none" />

                    {tags.length > 0 && (
                        <ul className="border-line mt-14 flex flex-wrap gap-2 border-t pt-8">
                            {tags.map((tag) => (
                                <li key={tag.id}>
                                    <Link
                                        href={tagUrl(tag.slug)}
                                        className="border-line bg-sheet text-ink/80 hover:border-sage hover:text-sage-deep inline-flex rounded-full border px-4 py-1.5 text-sm transition-colors"
                                    >
                                        {tag.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}

                    {settings.layout_cta_url && (
                        <aside className="bg-sage-soft/60 mt-12 flex flex-col items-start gap-4 rounded-[1.5rem] p-8 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="font-display text-ink text-2xl">{settings.layout_shop_name || 'Visit the boutique'}</p>
                                {settings.layout_shop_text && <p className="text-graphite mt-1">{settings.layout_shop_text}</p>}
                            </div>
                            <a
                                href={settings.layout_cta_url}
                                className="bg-sage-deep text-paper hover:bg-ink inline-flex shrink-0 items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors"
                            >
                                Visit the shop <ArrowUpRight className="h-4 w-4" />
                            </a>
                        </aside>
                    )}
                </div>
            </article>

            {related.length > 0 && (
                <section className="mx-auto mt-24 max-w-7xl px-5 sm:px-8">
                    <div className="border-ink/80 mb-10 border-b pb-3">
                        <h2 className="font-ui text-ink text-[0.75rem] font-semibold tracking-[0.28em] uppercase">Keep reading</h2>
                    </div>
                    <div className="grid gap-x-8 gap-y-12 md:grid-cols-3">
                        {related.map((item) => (
                            <PostCard key={item.id} post={item} />
                        ))}
                    </div>
                </section>
            )}
        </JournalLayout>
    );
}
