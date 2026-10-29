import { Head, Link, router } from '@inertiajs/react';
import { ArrowRight, Search } from 'lucide-react';
import React, { useState } from 'react';
import JournalLayout from './layout';

interface SearchResult {
    id: number;
    title: string;
    excerpt: string;
    url: string;
    type: string;
    date: string;
}

interface Props {
    results: SearchResult[];
    query: string;
}

export default function SearchPage({ results, query }: Props) {
    const [text, setText] = useState(query);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/search', { q: text });
    };

    return (
        <JournalLayout>
            <Head title={query ? `Search: ${query}` : 'Search'} />

            <section className="mx-auto max-w-3xl px-5 pt-16 pb-10 sm:px-8">
                <h1 className="text-ink text-center text-[2.8rem] leading-[1.05] sm:text-[3.6rem]">Search the journal</h1>
                <form
                    onSubmit={submit}
                    className="border-line bg-sheet focus-within:border-sage mt-10 flex items-center gap-3 rounded-full border py-2 pr-2 pl-6 transition-colors"
                >
                    <Search className="text-graphite h-5 w-5 shrink-0" />
                    <input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Try “puppy”, “grooming” or “senior cats”"
                        aria-label="Search terms"
                        className="placeholder:text-graphite/70 h-11 w-full bg-transparent outline-none"
                    />
                    <button
                        type="submit"
                        className="bg-sage-deep text-paper hover:bg-ink shrink-0 rounded-full px-6 py-3 text-sm font-semibold transition-colors"
                    >
                        Search
                    </button>
                </form>
                {query && (
                    <p className="text-graphite mt-6 text-center">
                        {results.length} {results.length === 1 ? 'result' : 'results'} for “{query}”
                    </p>
                )}
            </section>

            {results.length > 0 && (
                <section className="mx-auto max-w-3xl px-5 sm:px-8">
                    <ul className="border-line divide-y divide-[var(--color-line)] border-y">
                        {results.map((result, index) => (
                            <li key={`${result.type}-${result.id}-${index}`}>
                                <Link href={result.url} className="group block py-7">
                                    <h2 className="text-ink group-hover:text-sage-deep text-[1.7rem] leading-tight transition-colors">
                                        {result.title}
                                    </h2>
                                    {result.excerpt && (
                                        <p className="font-read text-graphite mt-2 line-clamp-2 text-[1.1rem] leading-relaxed">{result.excerpt}</p>
                                    )}
                                    <span className="text-sage-deep mt-3 inline-flex items-center gap-1 text-sm font-semibold">
                                        Read <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </JournalLayout>
    );
}
