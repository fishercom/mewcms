import { localePath } from '@/lib/locale-path';
import { tagUrl } from '@/lib/tag-url';
import { useTexts } from '@/lib/theme-texts';
import { cn } from '@/lib/utils';
import { Pagination } from '@/types';
import { CmsArticle } from '@/types/models/cms-article';
import { CmsPost, CmsPostType } from '@/types/models/cms-post';
import { Head, Link } from '@inertiajs/react';
import { BookOpen, Search } from 'lucide-react';
import { useState } from 'react';
import PostCard from '../components/post-card';
import { PopularTag } from '../components/sidebar';
import FrontLayout from '../layout';

interface Props {
    posts: Pagination<CmsPost>;
    cpt: CmsPostType | null;
    navigation: Pick<CmsArticle, 'id' | 'title' | 'slug'>[];
    popularTags?: PopularTag[];
}

export default function Index({ posts, cpt, navigation, popularTags = [] }: Props) {
    const [search, setSearch] = useState('');
    const { t } = useTexts();

    const pageTitle = cpt ? cpt.name : t('blog.title');
    const pageDesc = cpt ? cpt.description || t('blog.type_description', { type: cpt.name.toLowerCase() }) : t('blog.description');
    const query = search.trim().toLowerCase();

    const items = posts.data
        .filter((post) => !query || post.title.toLowerCase().includes(query) || (post.excerpt ?? '').toLowerCase().includes(query))
        .map((post) => ({
            id: post.id,
            title: post.title,
            url: localePath(cpt ? `/${cpt.slug}/${post.slug}` : `/blog/${post.slug}`),
            excerpt: post.excerpt,
            featured_image: post.featured_image,
            published_at: post.published_at,
            tags: post.tags,
        }));

    // The newest post leads the first page, bigger
    const [lead, ...rest] = posts.current_page === 1 && !query ? items : [undefined, ...items];

    return (
        <FrontLayout navigation={navigation}>
            <Head title={pageTitle} />

            <div className="space-y-12">
                <header className="flex flex-col gap-8 border-b border-(--theme-line) pb-10 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl space-y-3">
                        <p className="text-xs font-semibold tracking-[0.18em] text-(--theme-accent) uppercase">{t('blog.eyebrow')}</p>
                        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">{pageTitle}</h1>
                        <p className="text-lg text-(--theme-muted)">{pageDesc}</p>
                    </div>
                    <label className="relative block w-full lg:max-w-xs">
                        <span className="sr-only">{t('search.title')}</span>
                        <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-(--theme-muted)" />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t('blog.search_placeholder', { name: pageTitle.toLowerCase() })}
                            className="block w-full rounded-full border border-(--theme-line) bg-(--theme-bg) py-2.5 pr-4 pl-10 text-sm text-(--theme-ink) placeholder:text-(--theme-muted) focus:border-(--theme-accent) focus:ring-4 focus:ring-(--theme-accent)/15 focus:outline-none"
                        />
                    </label>
                </header>

                {popularTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {popularTags.map((tag) => (
                            <Link
                                key={tag.id}
                                href={tagUrl(tag.slug)}
                                className="rounded-full border border-(--theme-line) px-3.5 py-1.5 text-sm text-(--theme-muted) transition-colors hover:border-(--theme-accent) hover:text-(--theme-accent)"
                            >
                                {tag.name}
                                <span className="ml-1.5 text-xs opacity-60">{tag.count}</span>
                            </Link>
                        ))}
                    </div>
                )}

                {items.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {lead && <PostCard item={lead} large className="md:col-span-2 lg:col-span-3" />}
                        {rest.map((item) => item && <PostCard key={item.id} item={item} />)}
                    </div>
                ) : (
                    <div className="rounded-3xl border border-dashed border-(--theme-line) py-20 text-center text-(--theme-muted)">
                        <BookOpen className="mx-auto mb-3 h-10 w-10 opacity-50" />
                        <p className="text-sm font-medium">{t('blog.empty')}</p>
                    </div>
                )}

                {posts.last_page > 1 && (
                    <nav aria-label={t('pagination.label')} className="flex flex-wrap items-center justify-center gap-2 pt-4">
                        {posts.links.map((link, idx) =>
                            link.url === null ? null : (
                                <Link
                                    key={idx}
                                    href={link.url}
                                    preserveScroll={false}
                                    aria-current={link.active ? 'page' : undefined}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className={cn(
                                        'min-w-10 rounded-full border px-3.5 py-2 text-center text-sm font-medium transition-colors',
                                        link.active
                                            ? 'border-(--theme-accent) bg-(--theme-accent) text-(--theme-on-accent)'
                                            : 'border-(--theme-line) text-(--theme-muted) hover:border-(--theme-accent) hover:text-(--theme-accent)',
                                    )}
                                />
                            ),
                        )}
                    </nav>
                )}
            </div>
        </FrontLayout>
    );
}
