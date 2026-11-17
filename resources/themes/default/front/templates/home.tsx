/**
 * Template Name: Home Page
 * Unique: true
 */
import Blocks from '@/components/blocks';
import FrontSlider from '@/components/front-slider';
import { localePath } from '@/lib/locale-path';
import { useTexts } from '@/lib/theme-texts';
import { CmsArticle } from '@/types/models/cms-article';
import { CmsSlider } from '@/types/models/cms-slider';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import PostCard, { type CardItem, SectionHeading } from '../components/post-card';
import FrontLayout from '../layout';

interface HomeProps {
    article: CmsArticle;
    navigation: Pick<CmsArticle, 'id' | 'title' | 'slug'>[];
    slider?: CmsSlider | null;
    recentPosts?: CardItem[];
}

/**
 * The home page is made of blocks (banner, features, figures, call to action...), written
 * in the page editor. A slider is shown on top when the page has one and does not already
 * open with a banner block, and the latest posts close the page.
 */
export default function Home({ article, navigation, slider, recentPosts = [] }: HomeProps) {
    const { t } = useTexts();
    const blocks = Array.isArray(article.blocks) ? article.blocks : null;
    const opensWithBanner = blocks?.[0]?.type === 'hero' || blocks?.[0]?.type === 'slider';
    const showSlider = !!slider?.slides?.length && !opensWithBanner;
    const latest = recentPosts.slice(0, 3);
    const hasContent = (blocks && blocks.length > 0) || !!article.content?.trim();

    return (
        <FrontLayout navigation={navigation}>
            <Head title={article.title} />

            <div className="space-y-16 sm:space-y-24">
                {showSlider && slider && <FrontSlider slider={slider} />}

                {hasContent ? (
                    <Blocks
                        blocks={blocks}
                        html={article.content}
                        className="space-y-16 sm:space-y-24"
                        textClassName="*:prose-lg mx-auto max-w-3xl!"
                    />
                ) : (
                    !showSlider && (
                        <section className="py-10 text-center">
                            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">{article.title}</h1>
                            {article.excerpt && <p className="mx-auto mt-4 max-w-2xl text-lg text-(--theme-muted)">{article.excerpt}</p>}
                        </section>
                    )
                )}

                {latest.length > 0 && (
                    <section className="space-y-10">
                        <div className="flex flex-wrap items-end justify-between gap-4">
                            <SectionHeading eyebrow={t('blog.eyebrow')} title={t('blog.latest')} />
                            <Link
                                href={localePath('/blog')}
                                className="inline-flex items-center gap-1.5 rounded-full border border-(--theme-line) px-4 py-2 text-sm font-semibold transition-colors hover:border-(--theme-accent) hover:text-(--theme-accent)"
                            >
                                {t('blog.all_stories')}
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {latest.map((post) => (
                                <PostCard key={post.id} item={post} />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </FrontLayout>
    );
}
