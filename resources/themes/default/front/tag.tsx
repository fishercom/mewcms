import { useTexts } from '@/lib/theme-texts';
import { CmsArticle } from '@/types/models/cms-article';
import { Head } from '@inertiajs/react';
import { PageHero } from './components/post-card';
import ResultList, { TagCloud } from './components/result-list';
import { PopularTag } from './components/sidebar';
import FrontLayout from './layout';

/** A published page or post tagged with the tag, prepared by the server. */
interface TaggedItem {
    id: string;
    type: string;
    title: string;
    url: string;
    excerpt: string;
    date: string | null;
}

interface TagPageProps {
    tag: { id: number; name: string; slug: string };
    items: TaggedItem[];
    navigation: Pick<CmsArticle, 'id' | 'title' | 'slug'>[];
    popularTags?: PopularTag[];
}

export default function TagPage({ tag, items = [], navigation, popularTags = [] }: TagPageProps) {
    const { t, choice } = useTexts();
    const others = popularTags.filter((other) => other.slug !== tag.slug);

    return (
        <FrontLayout navigation={navigation}>
            <Head title={`#${tag.name}`} />

            <div className="space-y-12">
                <PageHero eyebrow={t('tag.eyebrow')} title={`#${tag.name}`} text={choice('tag.count', items.length)} />

                <div className="mx-auto max-w-4xl space-y-12">
                    {items.length > 0 ? (
                        <ResultList items={items} />
                    ) : (
                        <p className="rounded-3xl border border-dashed border-(--theme-line) py-16 text-center text-sm text-(--theme-muted)">
                            {t('tag.empty')}
                        </p>
                    )}

                    <TagCloud tags={others} title={t('tag.more')} />
                </div>
            </div>
        </FrontLayout>
    );
}
