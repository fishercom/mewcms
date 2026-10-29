import { Head, Link, router } from '@inertiajs/react';
import { ArrowUpRight, Search } from 'lucide-react';
import React, { useState } from 'react';
import { DisplayTitle, Eyebrow } from './components/brand';
import VelvetLayout from './layout';

interface SearchResult {
    id: number;
    title: string;
    excerpt: string;
    url: string;
    type: string;
    date: string;
}

export default function SearchPage({ results, query }: { results: SearchResult[]; query: string }) {
    const [text, setText] = useState(query);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/search', { q: text });
    };

    return (
        <VelvetLayout>
            <Head title={query ? `Search: ${query}` : 'Search'} />
            <section className="mx-auto max-w-3xl px-5 pt-16 pb-24 sm:px-8 sm:pt-24">
                <Eyebrow>Search</Eyebrow>
                <DisplayTitle as="h1" text="Find something *lovely*" className="text-ink mt-6 text-5xl sm:text-6xl" />
                <form
                    onSubmit={submit}
                    className="bg-paper focus-within:border-brass mt-10 flex items-center gap-3 rounded-full border border-[#e2d7c5] py-2 pr-2 pl-6 transition-colors"
                >
                    <Search className="text-stone h-5 w-5 shrink-0" />
                    <input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Grooming, beds, cat toys…"
                        aria-label="Search terms"
                        className="placeholder:text-stone/60 h-11 w-full bg-transparent outline-none"
                    />
                    <button
                        type="submit"
                        className="bg-forest text-ivory hover:bg-forest-deep shrink-0 rounded-full px-6 py-3 text-xs font-semibold tracking-[0.18em] uppercase transition-colors"
                    >
                        Search
                    </button>
                </form>
                {query && (
                    <p className="text-stone mt-6">
                        {results.length} {results.length === 1 ? 'result' : 'results'} for “{query}”
                    </p>
                )}
                {results.length > 0 && (
                    <ul className="mt-10 divide-y divide-[#e2d7c5] border-y border-[#e2d7c5]">
                        {results.map((result, index) => (
                            <li key={`${result.type}-${result.id}-${index}`}>
                                <Link href={result.url} className="group flex items-start justify-between gap-6 py-7">
                                    <span>
                                        <span className="font-display text-ink group-hover:text-forest block text-3xl transition-colors">
                                            {result.title}
                                        </span>
                                        {result.excerpt && (
                                            <span className="text-stone mt-2 line-clamp-2 block leading-relaxed">{result.excerpt}</span>
                                        )}
                                    </span>
                                    <ArrowUpRight className="text-brass mt-2 h-5 w-5 shrink-0" />
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </VelvetLayout>
    );
}
