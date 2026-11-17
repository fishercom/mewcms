import { type BlockData } from '@/blocks/types';
import Blocks from '@/components/blocks';
import { MediaImage } from '@/components/media-image';
import { tagUrl } from '@/lib/tag-url';
import { useTexts } from '@/lib/theme-texts';
import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import PostCard, { type CardItem } from './post-card';

interface ArticleViewProps {
    title: string;
    excerpt?: string | null;
    image?: string | null;
    date?: string | null;
    author?: string | null;
    blocks?: BlockData[] | null;
    html?: string | null;
    tags?: { id: number; name: string; slug: string }[];
    /** Custom fields to list under the text */
    details?: [string, unknown][];
    back?: { label: string; url: string };
    related?: CardItem[];
}

/** Minutes to read, from the words of the text */
const readingTime = (html?: string | null) =>
    Math.max(
        1,
        Math.round(
            (html ?? '')
                .replace(/<[^>]+>/g, ' ')
                .split(/\s+/)
                .filter(Boolean).length / 220,
        ),
    );

/**
 * A post (or a page built as one) laid out for reading: a centred header, a wide picture,
 * one comfortable column of text, then its tags and posts to read next.
 */
export default function ArticleView({
    title,
    excerpt,
    image,
    date,
    author,
    blocks,
    html,
    tags = [],
    details = [],
    back,
    related = [],
}: ArticleViewProps) {
    const { t, date: formatDate } = useTexts();

    return (
        <article className="space-y-12">
            <header className="mx-auto max-w-3xl space-y-6 text-center">
                {back && (
                    <Link
                        href={back.url}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-(--theme-muted) transition-colors hover:text-(--theme-accent)"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        {t('blog.back_to', { name: back.label })}
                    </Link>
                )}
                {tags[0] && (
                    <p>
                        <Link
                            href={tagUrl(tags[0].slug)}
                            className="rounded-full bg-(--theme-accent-soft) px-3 py-1 text-xs font-semibold tracking-wide text-(--theme-accent) uppercase"
                        >
                            {tags[0].name}
                        </Link>
                    </p>
                )}
                <h1 className="text-4xl leading-[1.1] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">{title}</h1>
                {excerpt && <p className="text-lg leading-relaxed text-pretty text-(--theme-muted) sm:text-xl">{excerpt}</p>}
                <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-(--theme-muted)">
                    {author && <span className="font-semibold text-(--theme-ink)">{t('blog.by', { author })}</span>}
                    {author && date && <span aria-hidden="true">·</span>}
                    {date && <time dateTime={date}>{formatDate(date, { dateStyle: 'long' })}</time>}
                    {html && (
                        <>
                            <span aria-hidden="true">·</span>
                            <span>{t('blog.reading_time', { minutes: readingTime(html) })}</span>
                        </>
                    )}
                </div>
            </header>

            {image && (
                <div className="mx-auto aspect-[16/9] max-w-5xl overflow-hidden rounded-[2rem] bg-(--theme-surface)">
                    <MediaImage
                        src={image}
                        fallbackAlt={title}
                        loading="eager"
                        sizes="(max-width: 1024px) 100vw, 1024px"
                        className="h-full w-full object-cover"
                    />
                </div>
            )}

            <div className="mx-auto max-w-3xl space-y-10">
                {html || blocks?.length ? (
                    <Blocks blocks={blocks} html={html} className="space-y-10" textClassName="*:prose-lg leading-relaxed" />
                ) : (
                    <p className="text-center text-sm text-(--theme-muted) italic">{t('blog.no_content')}</p>
                )}

                {details.length > 0 && (
                    <section className="space-y-3 border-t border-(--theme-line) pt-8">
                        <h2 className="text-xs font-semibold tracking-wider text-(--theme-muted) uppercase">{t('blog.details')}</h2>
                        <dl className="grid gap-3 sm:grid-cols-2">
                            {details.map(([key, value]) => (
                                <div key={key} className="rounded-2xl border border-(--theme-line) bg-(--theme-surface) p-4 text-sm">
                                    <dt className="mb-1 font-semibold capitalize">{key.replace(/_/g, ' ')}</dt>
                                    <dd className="break-words text-(--theme-muted)">
                                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </section>
                )}

                {tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 border-t border-(--theme-line) pt-8">
                        <span className="mr-1 text-xs font-semibold tracking-wider text-(--theme-muted) uppercase">{t('tag.list_title')}</span>
                        {tags.map((term) => (
                            <Link
                                key={term.id}
                                href={tagUrl(term.slug)}
                                className="rounded-full border border-(--theme-line) px-3 py-1 text-sm text-(--theme-muted) transition-colors hover:border-(--theme-accent) hover:text-(--theme-accent)"
                            >
                                #{term.name}
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {related.length > 0 && (
                <section className="space-y-6 border-t border-(--theme-line) pt-12">
                    <h2 className="text-2xl font-extrabold tracking-tight">{t('blog.related')}</h2>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {related.slice(0, 3).map((item) => (
                            <PostCard key={item.id} item={item} />
                        ))}
                    </div>
                </section>
            )}
        </article>
    );
}
