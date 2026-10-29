import Blocks from '@/components/blocks';
import { MediaImage } from '@/components/media-image';
import { CmsPost, CmsPostType } from '@/types/models/cms-post';
import { Head, Link } from '@inertiajs/react';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { DisplayTitle, Eyebrow } from '../components/brand';
import VelvetLayout from '../layout';

export default function Show({ post, cpt }: { post: CmsPost; cpt: CmsPostType | null }) {
    return (
        <VelvetLayout>
            <Head title={post.title} />
            <article className="mx-auto max-w-3xl px-5 pt-16 pb-24 sm:px-8 sm:pt-24">
                <Link
                    href={cpt ? `/${cpt.slug}` : '/blog'}
                    className="text-stone hover:text-forest inline-flex items-center gap-2 text-sm transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" /> All stories
                </Link>
                <Eyebrow className="mt-10">{format(new Date(post.published_at), 'MMMM d, yyyy')}</Eyebrow>
                <DisplayTitle as="h1" text={post.title} className="text-ink mt-6 text-5xl sm:text-6xl" />
                {post.excerpt && <p className="text-stone mt-6 text-xl leading-relaxed font-light">{post.excerpt}</p>}
                {post.featured_image && (
                    <MediaImage
                        src={post.featured_image}
                        fallbackAlt={post.title}
                        loading="eager"
                        className="mt-12 aspect-[16/10] w-full rounded-[2rem] object-cover"
                    />
                )}
                <div className="mt-12">
                    <Blocks blocks={post.blocks} html={post.content} textClassName="velvet-prose prose max-w-none" />
                </div>
            </article>
        </VelvetLayout>
    );
}
