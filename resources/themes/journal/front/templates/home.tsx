/**
 * Template Name: Journal Home
 * Unique: true
 */
import Blocks from '@/components/blocks';
import { MediaImage } from '@/components/media-image';
import { isExternalLink } from '@/components/social-icon';
import { CmsArticle } from '@/types/models/cms-article';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { FeatureCard, PostCard, PostRow, type CardPost } from '../components/post-card';
import JournalLayout from '../layout';

interface Topic {
    title?: string;
    text?: string;
    url?: string;
}

interface HomeMetadata {
    intro_eyebrow?: string;
    intro_title?: string;
    intro_text?: string;
    topics_title?: string;
    topics?: Topic[];
    promo_eyebrow?: string;
    promo_title?: string;
    promo_text?: string;
    promo_image?: string;
    promo_button_label?: string;
    promo_button_url?: string;
}

interface HomeProps {
    article: CmsArticle;
    recentPosts?: CardPost[];
    popularTags?: { id: number; name: string; slug: string; count: number }[];
}

const list = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

/** Small uppercase heading with a rule, used above each band */
function Rule({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
    return (
        <div className="border-ink/80 mb-10 flex items-end justify-between gap-6 border-b pb-3">
            <h2 className="font-ui text-ink text-[0.75rem] font-semibold tracking-[0.28em] uppercase">{children}</h2>
            {action}
        </div>
    );
}

export default function Home({ article, recentPosts = [], popularTags = [] }: HomeProps) {
    const m = (article.metadata || {}) as HomeMetadata;
    const topics = list<Topic>(m.topics);
    const [lead, ...rest] = recentPosts;
    const grid = rest.slice(0, 3);
    const more = rest.slice(3);

    return (
        <JournalLayout>
            <Head title={article.title} />

            {/* Intro */}
            {(m.intro_title || m.intro_text) && (
                <section className="mx-auto max-w-3xl px-5 pt-16 pb-6 text-center sm:px-8 sm:pt-20">
                    {m.intro_eyebrow && <p className="text-terracotta text-[0.72rem] font-semibold tracking-[0.3em] uppercase">{m.intro_eyebrow}</p>}
                    {m.intro_title && <h1 className="text-ink mt-5 text-[2.6rem] leading-[1.08] sm:text-[3.6rem]">{m.intro_title}</h1>}
                    {m.intro_text && <p className="font-read text-graphite mx-auto mt-6 max-w-2xl text-[1.3rem] leading-relaxed">{m.intro_text}</p>}
                </section>
            )}

            {/* Lead story */}
            {lead && (
                <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
                    <FeatureCard post={lead} />
                </section>
            )}

            {/* Latest + more stories */}
            {grid.length > 0 && (
                <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
                    <div className="grid gap-14 lg:grid-cols-12">
                        <div className="lg:col-span-8">
                            <Rule
                                action={
                                    <Link
                                        href="/blog"
                                        className="text-sage-deep hover:text-terracotta inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
                                    >
                                        All articles <ArrowRight className="h-4 w-4" />
                                    </Link>
                                }
                            >
                                Latest
                            </Rule>
                            <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2">
                                {grid.map((post, index) => (
                                    <div key={post.id} className={index === 0 ? 'sm:col-span-2' : ''}>
                                        <PostCard post={post} priority={index === 0} />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <aside className="lg:col-span-4">
                            {more.length > 0 && (
                                <>
                                    <Rule>Worth a read</Rule>
                                    <div>
                                        {more.map((post, index) => (
                                            <PostRow key={post.id} post={post} index={index} />
                                        ))}
                                    </div>
                                </>
                            )}
                            {popularTags.length > 0 && (
                                <div className="mt-12">
                                    <Rule>Topics</Rule>
                                    <ul className="flex flex-wrap gap-2">
                                        {popularTags.map((tag) => (
                                            <li key={tag.id}>
                                                <Link
                                                    href={`/tag/${tag.slug}`}
                                                    className="border-line bg-sheet text-ink/80 hover:border-sage hover:text-sage-deep inline-flex rounded-full border px-4 py-2 text-sm transition-colors"
                                                >
                                                    {tag.name}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </aside>
                    </div>
                </section>
            )}

            {/* Topic guides */}
            {topics.length > 0 && (
                <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
                    <Rule>{m.topics_title || 'Guides by topic'}</Rule>
                    <div className="border-line grid gap-px overflow-hidden rounded-[1.75rem] border bg-[var(--color-line)] sm:grid-cols-2 lg:grid-cols-4">
                        {topics.map((topic, index) => (
                            <Link
                                key={index}
                                href={topic.url || '/blog'}
                                className="group bg-sheet hover:bg-sage-soft/50 flex flex-col p-8 transition-colors"
                            >
                                <span className="font-display text-terracotta/80 text-4xl italic">{String(index + 1).padStart(2, '0')}</span>
                                <h3 className="text-ink mt-6 text-[1.6rem] leading-tight">{topic.title}</h3>
                                {topic.text && <p className="text-graphite mt-3 leading-relaxed">{topic.text}</p>}
                                <span className="text-sage-deep mt-auto inline-flex items-center gap-1 pt-6 text-sm font-semibold">
                                    Read the guides <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                </span>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Editor content */}
            {Boolean(article.blocks?.length || article.content) && (
                <section className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
                    <Blocks blocks={article.blocks} html={article.content} textClassName="journal-prose prose max-w-none" />
                </section>
            )}

            {/* From the shop */}
            {m.promo_title && (
                <section className="mx-auto max-w-7xl px-5 pt-10 sm:px-8">
                    <div className="bg-sage-deep text-paper grid overflow-hidden rounded-[2rem] lg:grid-cols-2">
                        {m.promo_image && (
                            <div className="journal-zoom relative min-h-[18rem] overflow-hidden">
                                <MediaImage
                                    src={m.promo_image}
                                    fallbackAlt=""
                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                    className="absolute inset-0 h-full w-full object-cover"
                                />
                            </div>
                        )}
                        <div className="space-y-6 p-10 sm:p-14">
                            {m.promo_eyebrow && (
                                <p className="text-sage-soft text-[0.72rem] font-semibold tracking-[0.3em] uppercase">{m.promo_eyebrow}</p>
                            )}
                            <h2 className="text-paper text-[2.4rem] leading-[1.1] sm:text-[2.9rem]">{m.promo_title}</h2>
                            {m.promo_text && <p className="font-read text-paper/80 text-[1.2rem] leading-relaxed">{m.promo_text}</p>}
                            {m.promo_button_label && m.promo_button_url && (
                                <a
                                    href={m.promo_button_url}
                                    className="bg-paper text-sage-deep hover:bg-sand inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold transition-colors"
                                >
                                    {m.promo_button_label}
                                    {isExternalLink(m.promo_button_url) ? <ArrowUpRight className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                                </a>
                            )}
                        </div>
                    </div>
                </section>
            )}
        </JournalLayout>
    );
}
