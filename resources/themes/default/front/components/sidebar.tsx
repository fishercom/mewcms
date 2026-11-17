import { localePath } from '@/lib/locale-path';
import { tagUrl } from '@/lib/tag-url';
import { useTexts } from '@/lib/theme-texts';
import { CmsArticle } from '@/types/models/cms-article';
import { Link } from '@inertiajs/react';
import { Calendar, FileText, Tag } from 'lucide-react';

/** A tag with how many published pages and posts use it. */
export interface PopularTag {
    id: number;
    name: string;
    slug: string;
    count: number;
}

interface SidebarProps {
    popularTags?: PopularTag[];
    recentArticles?: Pick<CmsArticle, 'id' | 'title' | 'slug' | 'url' | 'created_at'>[];
}

/** Recent pages and popular tags, for themes that build on the default pages with a sidebar */
export default function FrontSidebar({ popularTags = [], recentArticles = [] }: SidebarProps) {
    const { t, date } = useTexts();
    // Helper to format URLs
    const getArticleUrl = (item: { url?: string; slug: string }) =>
        item.url ?? localePath(!item.slug || item.slug === 'home' ? '/' : '/' + item.slug);

    return (
        <aside className="space-y-8 lg:sticky lg:top-24">
            {/* Recent Articles Widget */}
            {recentArticles.length > 0 && (
                <div className="rounded-3xl border border-(--theme-line) bg-(--theme-surface) p-6">
                    <h3 className="mb-4 flex items-center gap-2 border-b border-(--theme-line) pb-3 text-sm font-semibold">
                        <FileText className="h-4 w-4 text-(--theme-accent)" />
                        <span>{t('sidebar.recent')}</span>
                    </h3>
                    <ul className="space-y-4">
                        {recentArticles.map((art) => (
                            <li key={art.id} className="group">
                                <Link href={getArticleUrl(art)} className="block space-y-1">
                                    <h4 className="line-clamp-2 text-sm leading-snug font-medium transition-colors group-hover:text-(--theme-accent)">
                                        {art.title}
                                    </h4>
                                    <div className="flex items-center gap-1.5 text-xs text-(--theme-muted)">
                                        <Calendar className="h-3 w-3" />
                                        <time dateTime={art.created_at.toString()}>{date(art.created_at)}</time>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Tag Cloud Widget */}
            {popularTags.length > 0 && (
                <div className="rounded-3xl border border-(--theme-line) bg-(--theme-surface) p-6">
                    <h3 className="mb-4 flex items-center gap-2 border-b border-(--theme-line) pb-3 text-sm font-semibold">
                        <Tag className="h-4 w-4 text-(--theme-accent)" />
                        <span>{t('tag.list_title')}</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {popularTags.map((tag) => (
                            <Link
                                key={tag.id}
                                href={tagUrl(tag.slug)}
                                className="inline-flex items-center gap-1 rounded-full border border-(--theme-line) bg-(--theme-bg) px-3 py-1.5 text-xs text-(--theme-muted) transition-colors hover:border-(--theme-accent) hover:text-(--theme-accent)"
                            >
                                <span>#{tag.name}</span>
                                <span className="text-[10px] opacity-60">({tag.count})</span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </aside>
    );
}
