import { MediaImage } from '@/components/media-image';
import { tagUrl } from '@/lib/tag-url';
import { useTexts } from '@/lib/theme-texts';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { ArrowRight, BookOpen } from 'lucide-react';
import type { ReactNode } from 'react';

/** The fields of a post or page a card shows (a page of posts, the shared "recentPosts", search results) */
export interface CardItem {
    id: number | string;
    title: string;
    url: string;
    excerpt?: string | null;
    featured_image?: string | null;
    published_at?: string | null;
    author?: string | null;
    label?: string | null;
    tags?: { id?: number; name: string; slug: string }[];
}

/**
 * A post as a card: picture, first tag, title, excerpt and date. Used by the blog, the
 * home page and the tag pages, so every list of posts looks alike.
 */
export default function PostCard({ item, className, large = false }: { item: CardItem; className?: string; large?: boolean }) {
    const { t, date } = useTexts();
    const tag = item.tags?.[0];

    return (
        <article
            className={cn(
                'group relative flex flex-col overflow-hidden',
                large && 'lg:flex-row',
                'rounded-3xl border border-(--theme-line) bg-(--theme-bg) transition-all duration-300 hover:-translate-y-1 hover:border-(--theme-accent)/40 hover:shadow-(--theme-accent)/50 hover:shadow-[0_18px_40px_-24px]',
                className,
            )}
        >
            <div
                className={cn(
                    'relative overflow-hidden bg-(--theme-surface)',
                    large ? 'aspect-[16/9] lg:aspect-auto lg:min-h-[22rem] lg:w-3/5 lg:shrink-0' : 'aspect-[16/10]',
                )}
            >
                {item.featured_image ? (
                    <MediaImage
                        src={item.featured_image}
                        fallbackAlt={item.title}
                        sizes={large ? '(max-width: 1024px) 100vw, 60vw' : '(max-width: 768px) 100vw, 33vw'}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-(--theme-accent-soft) to-transparent text-(--theme-accent)/40">
                        <BookOpen className="h-10 w-10" />
                    </div>
                )}
            </div>

            <div className={cn('flex flex-1 flex-col gap-3', large ? 'p-7 lg:justify-center lg:p-10' : 'p-6')}>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    {item.label && <span className="font-semibold text-(--theme-accent)">{item.label}</span>}
                    {tag && !item.label && (
                        <Link href={tagUrl(tag.slug)} className="relative z-10 font-semibold text-(--theme-accent) hover:underline">
                            {tag.name}
                        </Link>
                    )}
                    {item.published_at && (
                        <time dateTime={item.published_at} className="text-(--theme-muted)">
                            {date(item.published_at, { dateStyle: 'medium' })}
                        </time>
                    )}
                </div>

                <h3 className={cn('leading-snug font-bold tracking-tight text-balance', large ? 'text-2xl sm:text-3xl' : 'text-lg')}>
                    <Link href={item.url} className="after:absolute after:inset-0 focus-visible:outline-none">
                        {item.title}
                    </Link>
                </h3>

                {item.excerpt && <p className="line-clamp-3 text-sm leading-relaxed text-(--theme-muted)">{item.excerpt}</p>}

                <span className={cn('mt-auto inline-flex items-center gap-1 pt-2 text-sm font-semibold text-(--theme-accent)', large && 'lg:mt-2')}>
                    {t('blog.read')}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
            </div>
        </article>
    );
}

/** The heading over a section: small accent label, title and an optional line of text */
export function SectionHeading({ eyebrow, title, text, className }: { eyebrow?: string; title: string; text?: string; className?: string }) {
    return (
        <div className={cn('max-w-2xl space-y-3', className)}>
            {eyebrow && <p className="text-xs font-semibold tracking-[0.18em] text-(--theme-accent) uppercase">{eyebrow}</p>}
            <h2 className="text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">{title}</h2>
            {text && <p className="text-base leading-relaxed text-(--theme-muted)">{text}</p>}
        </div>
    );
}

/** The header of an inner page: label, big title and lead text, on a soft accent wash */
export function PageHero({ eyebrow, title, text, children }: { eyebrow?: string; title: string; text?: string | null; children?: ReactNode }) {
    return (
        <header className="relative isolate overflow-hidden rounded-[2rem] border border-(--theme-line) bg-(--theme-surface) px-6 py-14 sm:px-12 sm:py-20">
            <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 bg-[radial-gradient(48rem_22rem_at_90%_-20%,var(--theme-accent-soft),transparent_70%),radial-gradient(30rem_16rem_at_0%_120%,var(--theme-accent-soft),transparent_70%)]"
            />
            <div className="max-w-3xl space-y-4">
                {eyebrow && <p className="text-xs font-semibold tracking-[0.18em] text-(--theme-accent) uppercase">{eyebrow}</p>}
                <h1 className="text-4xl font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">{title}</h1>
                {text && <p className="text-lg leading-relaxed text-(--theme-muted)">{text}</p>}
                {children}
            </div>
        </header>
    );
}
