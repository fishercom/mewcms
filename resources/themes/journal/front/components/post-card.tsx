import { MediaImage } from '@/components/media-image';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { format } from 'date-fns';
import { BookOpen } from 'lucide-react';

/** The fields of a post the cards need (the shared "recentPosts" or a page of posts) */
export interface CardPost {
    id: number;
    title: string;
    slug: string;
    excerpt?: string | null;
    featured_image?: string | null;
    published_at?: string | null;
    content?: string | null;
    tags?: { id: number; name: string; slug: string }[];
}

export const postUrl = (post: Pick<CardPost, 'slug'>, base = '/blog') => `${base}/${post.slug}`;

export const postDate = (date?: string | null) => (date ? format(new Date(date), 'MMMM d, yyyy') : '');

/** Minutes to read, from the words of the content (or the excerpt) */
export const readingTime = (post: Pick<CardPost, 'content' | 'excerpt'>) => {
    const words = (post.content || post.excerpt || '')
        .replace(/<[^>]+>/g, ' ')
        .split(/\s+/)
        .filter(Boolean).length;
    return Math.max(2, Math.round(words / 220));
};

export function Topic({ post, className }: { post: CardPost; className?: string }) {
    const tag = post.tags?.[0];
    if (!tag) return null;

    return (
        <Link
            href={`/tag/${tag.slug}`}
            className={cn('text-terracotta hover:text-sage-deep text-[0.7rem] font-semibold tracking-[0.2em] uppercase transition-colors', className)}
        >
            {tag.name}
        </Link>
    );
}

function Cover({ post, sizes, className }: { post: CardPost; sizes: string; className?: string }) {
    return (
        <Link href={postUrl(post)} className={cn('journal-zoom bg-sand block overflow-hidden', className)} tabIndex={-1} aria-hidden="true">
            {post.featured_image ? (
                <MediaImage src={post.featured_image} fallbackAlt={post.title} sizes={sizes} className="h-full w-full object-cover" />
            ) : (
                <span className="text-graphite/40 flex h-full w-full items-center justify-center">
                    <BookOpen className="h-10 w-10" />
                </span>
            )}
        </Link>
    );
}

/** Large lead story: image beside the title */
export function FeatureCard({ post }: { post: CardPost }) {
    return (
        <article className="group grid items-center gap-10 lg:grid-cols-12">
            <Cover post={post} sizes="(max-width: 1024px) 100vw, 60vw" className="aspect-[4/3] rounded-[2rem] lg:col-span-7" />
            <div className="space-y-5 lg:col-span-5">
                <Topic post={post} />
                <h2 className="text-ink text-[2.6rem] leading-[1.08] sm:text-[3.3rem]">
                    <Link href={postUrl(post)} className="decoration-terracotta/60 decoration-1 underline-offset-[6px] group-hover:underline">
                        {post.title}
                    </Link>
                </h2>
                {post.excerpt && <p className="font-read text-graphite text-[1.3rem] leading-relaxed">{post.excerpt}</p>}
                <p className="text-graphite text-sm">{postDate(post.published_at)}</p>
            </div>
        </article>
    );
}

/** Standard card: image on top */
export function PostCard({ post, priority = false }: { post: CardPost; priority?: boolean }) {
    return (
        <article className="group flex flex-col">
            <Cover post={post} sizes="(max-width: 768px) 100vw, 33vw" className={cn('aspect-[4/3] rounded-[1.5rem]', priority && 'aspect-[16/11]')} />
            <div className="mt-5 space-y-3">
                <Topic post={post} />
                <h3 className="text-ink text-[1.7rem] leading-[1.15]">
                    <Link href={postUrl(post)} className="decoration-terracotta/60 decoration-1 underline-offset-4 group-hover:underline">
                        {post.title}
                    </Link>
                </h3>
                {post.excerpt && <p className="text-graphite line-clamp-3 leading-relaxed">{post.excerpt}</p>}
                <p className="text-graphite/80 text-[0.8rem]">{postDate(post.published_at)}</p>
            </div>
        </article>
    );
}

/** Compact row: small square image and the title */
export function PostRow({ post, index }: { post: CardPost; index?: number }) {
    return (
        <article className="group border-line flex items-start gap-5 border-t py-6 first:border-t-0 first:pt-0">
            {index !== undefined && <span className="font-display text-terracotta/70 w-8 shrink-0 text-3xl italic">{index + 1}</span>}
            <div className="min-w-0 flex-1 space-y-2">
                <Topic post={post} />
                <h3 className="text-ink text-[1.3rem] leading-snug">
                    <Link href={postUrl(post)} className="decoration-terracotta/60 underline-offset-4 group-hover:underline">
                        {post.title}
                    </Link>
                </h3>
            </div>
            <Cover post={post} sizes="96px" className="h-20 w-20 shrink-0 rounded-2xl" />
        </article>
    );
}
