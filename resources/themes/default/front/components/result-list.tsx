import { tagUrl } from '@/lib/tag-url';
import { useTexts } from '@/lib/theme-texts';
import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { type PopularTag } from './sidebar';

/** A page or post found by the search or listed under a tag, prepared by the server */
export interface ResultItem {
    id: string | number;
    type: string;
    title: string;
    url: string;
    excerpt?: string | null;
    date?: string | null;
}

/** Results as a list of rows: what it is, its date, title and a line of its text */
export default function ResultList({ items, formatDates = true }: { items: ResultItem[]; formatDates?: boolean }) {
    const { date } = useTexts();

    return (
        <ul className="divide-y divide-(--theme-line) border-y border-(--theme-line)">
            {items.map((item, index) => (
                <li key={`${item.type}-${item.id}-${index}`}>
                    <Link href={item.url} className="group flex items-start justify-between gap-6 py-6">
                        <div className="min-w-0 space-y-2">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                                <span className="rounded-full bg-(--theme-accent-soft) px-2.5 py-0.5 font-semibold text-(--theme-accent)">
                                    {item.type}
                                </span>
                                {item.date && (
                                    <span className="text-(--theme-muted)">{formatDates ? date(item.date, { dateStyle: 'medium' }) : item.date}</span>
                                )}
                            </div>
                            <h2 className="text-xl font-bold tracking-tight transition-colors group-hover:text-(--theme-accent)">{item.title}</h2>
                            {item.excerpt && <p className="line-clamp-2 text-sm leading-relaxed text-(--theme-muted)">{item.excerpt}</p>}
                        </div>
                        <ArrowRight className="mt-8 h-5 w-5 shrink-0 text-(--theme-muted) transition-all group-hover:translate-x-1 group-hover:text-(--theme-accent)" />
                    </Link>
                </li>
            ))}
        </ul>
    );
}

/** Tags as pills, with how much each one holds */
export function TagCloud({ tags, title }: { tags: PopularTag[]; title?: string }) {
    if (tags.length === 0) return null;

    return (
        <section className="space-y-4">
            {title && <h2 className="text-xs font-semibold tracking-wider text-(--theme-muted) uppercase">{title}</h2>}
            <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                    <Link
                        key={tag.id}
                        href={tagUrl(tag.slug)}
                        className="rounded-full border border-(--theme-line) px-3.5 py-1.5 text-sm text-(--theme-muted) transition-colors hover:border-(--theme-accent) hover:text-(--theme-accent)"
                    >
                        #{tag.name}
                        <span className="ml-1.5 text-xs opacity-60">{tag.count}</span>
                    </Link>
                ))}
            </div>
        </section>
    );
}
