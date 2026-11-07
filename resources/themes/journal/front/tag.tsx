import { useTexts } from '@/lib/theme-texts';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { PostDate } from './components/post-card';
import JournalLayout from './layout';

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
    popularTags?: { id: number; name: string; slug: string; count: number }[];
}

export default function TagPage({ tag, items = [], popularTags = [] }: TagPageProps) {
    const { t, choice } = useTexts();

    return (
        <JournalLayout>
            <Head title={tag.name} />

            <section className="mx-auto max-w-3xl px-5 pt-16 pb-10 text-center sm:px-8">
                <p className="text-terracotta text-[0.72rem] font-semibold tracking-[0.3em] uppercase">{t('tag.eyebrow')}</p>
                <h1 className="text-ink mt-4 text-[2.8rem] leading-[1.05] sm:text-[3.8rem]">{tag.name}</h1>
                <p className="text-graphite mt-4">{choice('tag.count', items.length)}</p>
            </section>

            <section className="mx-auto max-w-3xl px-5 sm:px-8">
                {items.length > 0 ? (
                    <ul className="border-line divide-y divide-[var(--color-line)] border-y">
                        {items.map((item) => (
                            <li key={item.id}>
                                <Link href={item.url} className="group block py-8">
                                    {item.date && (
                                        <p className="text-graphite text-sm">
                                            <PostDate date={item.date} />
                                        </p>
                                    )}
                                    <h2 className="text-ink group-hover:text-sage-deep mt-2 text-[1.9rem] leading-tight transition-colors">
                                        {item.title}
                                    </h2>
                                    {item.excerpt && <p className="font-read text-graphite mt-3 text-[1.15rem] leading-relaxed">{item.excerpt}</p>}
                                    <span className="text-sage-deep mt-4 inline-flex items-center gap-1 text-sm font-semibold">
                                        {t('blog.read')} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="font-read text-graphite py-16 text-center text-xl">{t('tag.empty')}</p>
                )}

                {popularTags.length > 1 && (
                    <div className="mt-14 text-center">
                        <p className="text-graphite mb-4 text-sm">{t('tag.more')}</p>
                        <ul className="flex flex-wrap justify-center gap-2">
                            {popularTags
                                .filter((other) => other.slug !== tag.slug)
                                .map((other) => (
                                    <li key={other.id}>
                                        <Link
                                            href={`/tag/${other.slug}`}
                                            className="border-line bg-sheet text-ink/80 hover:border-sage hover:text-sage-deep inline-flex rounded-full border px-4 py-1.5 text-sm transition-colors"
                                        >
                                            {other.name}
                                        </Link>
                                    </li>
                                ))}
                        </ul>
                    </div>
                )}
            </section>
        </JournalLayout>
    );
}
