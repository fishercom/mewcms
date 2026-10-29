import { Head, Link } from '@inertiajs/react';
import { ArrowUpRight } from 'lucide-react';
import { DisplayTitle, Eyebrow } from './components/brand';
import VelvetLayout from './layout';

interface TaggedItem {
    id: string;
    type: string;
    title: string;
    url: string;
    excerpt: string;
    date: string | null;
}

export default function TagPage({ tag, items = [] }: { tag: { id: number; name: string; slug: string }; items: TaggedItem[] }) {
    return (
        <VelvetLayout>
            <Head title={tag.name} />
            <section className="mx-auto max-w-3xl px-5 pt-16 pb-24 sm:px-8 sm:pt-24">
                <Eyebrow>Tagged</Eyebrow>
                <DisplayTitle as="h1" text={tag.name} className="text-ink mt-6 text-5xl sm:text-6xl" />
                {items.length > 0 ? (
                    <ul className="mt-12 divide-y divide-[#e2d7c5] border-y border-[#e2d7c5]">
                        {items.map((item) => (
                            <li key={item.id}>
                                <Link href={item.url} className="group flex items-start justify-between gap-6 py-7">
                                    <span>
                                        <span className="font-display text-ink group-hover:text-forest block text-3xl transition-colors">
                                            {item.title}
                                        </span>
                                        {item.excerpt && <span className="text-stone mt-2 block leading-relaxed">{item.excerpt}</span>}
                                    </span>
                                    <ArrowUpRight className="text-brass mt-2 h-5 w-5 shrink-0" />
                                </Link>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-stone mt-10 text-lg">Nothing here yet.</p>
                )}
            </section>
        </VelvetLayout>
    );
}
