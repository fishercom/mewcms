import { MediaImage } from '@/components/media-image';
import { Pagination } from '@/types';
import { CmsPost, CmsPostType } from '@/types/models/cms-post';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowUpRight } from 'lucide-react';
import { DisplayTitle, Eyebrow } from '../components/brand';
import VelvetLayout from '../layout';

/** The boutique keeps its stories in the journal (another site); this lists any posts of its own */
export default function Index({ posts, cpt }: { posts: Pagination<CmsPost>; cpt: CmsPostType | null }) {
    const settings = usePage<{ layout_settings?: Record<string, string> }>().props.layout_settings ?? {};
    const base = cpt ? `/${cpt.slug}` : '/blog';
    const title = cpt?.name || 'Notes from the boutique';

    return (
        <VelvetLayout>
            <Head title={title} />
            <section className="mx-auto max-w-7xl px-5 pt-16 pb-24 sm:px-8 sm:pt-24">
                <Eyebrow>Stories</Eyebrow>
                <DisplayTitle as="h1" text={title} className="text-ink mt-6 text-5xl sm:text-6xl" />
                {posts.data.length > 0 ? (
                    <div className="mt-14 grid gap-x-8 gap-y-14 md:grid-cols-3">
                        {posts.data.map((post) => (
                            <Link key={post.id} href={`${base}/${post.slug}`} className="group velvet-zoom block">
                                <div className="bg-cream aspect-[4/3] overflow-hidden rounded-[1.5rem]">
                                    {post.featured_image && (
                                        <MediaImage
                                            src={post.featured_image}
                                            fallbackAlt={post.title}
                                            sizes="(max-width: 768px) 100vw, 33vw"
                                            className="h-full w-full object-cover"
                                        />
                                    )}
                                </div>
                                <h2 className="font-display text-ink group-hover:text-forest mt-5 text-3xl leading-tight transition-colors">
                                    {post.title}
                                </h2>
                                {post.excerpt && <p className="text-stone mt-2 leading-relaxed">{post.excerpt}</p>}
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="mt-12 max-w-xl space-y-6">
                        <p className="text-stone text-lg leading-relaxed font-light">
                            Our care guides, recipes and training notes live in the journal.
                        </p>
                        {settings.layout_journal_url && (
                            <a
                                href={settings.layout_journal_url}
                                className="text-forest border-brass inline-flex items-center gap-2 border-b pb-1 text-xs font-semibold tracking-[0.2em] uppercase"
                            >
                                Read the journal <ArrowUpRight className="h-4 w-4" />
                            </a>
                        )}
                    </div>
                )}
            </section>
        </VelvetLayout>
    );
}
