import { Pagination } from '@/types';
import { CmsPost, CmsPostType } from '@/types/models/cms-post';
import { Head, Link } from '@inertiajs/react';
import { BookOpen } from 'lucide-react';
import { FeatureCard, PostCard } from '../components/post-card';
import JournalLayout from '../layout';

interface Props {
    posts: Pagination<CmsPost>;
    cpt: CmsPostType | null;
    popularTags?: { id: number; name: string; slug: string; count: number }[];
}

export default function Index({ posts, cpt, popularTags = [] }: Props) {
    const title = cpt ? cpt.name : 'All articles';
    const description =
        cpt?.description || 'Practical, vet-informed guides to feeding, grooming, training and simply living well with the animals we love.';
    // The newest article leads the first page only
    const [lead, ...others] = posts.current_page === 1 ? posts.data : [undefined, ...posts.data];

    return (
        <JournalLayout>
            <Head title={title} />

            <section className="mx-auto max-w-3xl px-5 pt-16 pb-10 text-center sm:px-8">
                <p className="text-terracotta text-[0.72rem] font-semibold tracking-[0.3em] uppercase">The archive</p>
                <h1 className="text-ink mt-4 text-[2.8rem] leading-[1.05] sm:text-[3.8rem]">{title}</h1>
                <p className="font-read text-graphite mx-auto mt-5 max-w-2xl text-[1.25rem] leading-relaxed">{description}</p>
                {popularTags.length > 0 && (
                    <ul className="mt-8 flex flex-wrap justify-center gap-2">
                        {popularTags.map((tag) => (
                            <li key={tag.id}>
                                <Link
                                    href={`/tag/${tag.slug}`}
                                    className="border-line bg-sheet text-ink/80 hover:border-sage hover:text-sage-deep inline-flex rounded-full border px-4 py-1.5 text-sm transition-colors"
                                >
                                    {tag.name}
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {posts.data.length === 0 ? (
                <div className="border-line text-graphite mx-auto max-w-xl rounded-[1.75rem] border border-dashed px-6 py-20 text-center">
                    <BookOpen className="mx-auto mb-4 h-9 w-9 opacity-50" />
                    <p className="font-read text-xl">New articles are on their way.</p>
                </div>
            ) : (
                <>
                    {lead && (
                        <section className="border-line mx-auto max-w-7xl border-t px-5 py-14 sm:px-8">
                            <FeatureCard post={lead} />
                        </section>
                    )}
                    {others.length > 0 && (
                        <section className="border-line mx-auto max-w-7xl border-t px-5 py-14 sm:px-8">
                            <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
                                {others.map((post) => post && <PostCard key={post.id} post={post} />)}
                            </div>
                        </section>
                    )}
                </>
            )}

            {posts.last_page > 1 && (
                <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-2 px-5 pt-4 sm:px-8" aria-label="Pages">
                    {posts.links.map((link, index) =>
                        link.url === null ? null : (
                            <Link
                                key={index}
                                href={link.url}
                                preserveScroll={false}
                                className={`inline-flex h-11 min-w-11 items-center justify-center rounded-full border px-4 text-sm transition-colors ${
                                    link.active
                                        ? 'border-sage-deep bg-sage-deep text-paper'
                                        : 'border-line text-ink/80 hover:border-sage hover:text-sage-deep'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ),
                    )}
                </nav>
            )}
        </JournalLayout>
    );
}
