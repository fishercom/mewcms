import { tagUrl } from '@/lib/tag-url';
import { CmsArticle } from '@/types/models/cms-article';
import { Link } from '@inertiajs/react';
import { format } from 'date-fns';
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

export default function FrontSidebar({ popularTags = [], recentArticles = [] }: SidebarProps) {
    // Helper to format URLs
    const getArticleUrl = (item: { url?: string; slug: string }) => item.url ?? (!item.slug || item.slug === 'home' ? '/' : '/' + item.slug);

    return (
        <aside className="space-y-8 lg:sticky lg:top-24">
            {/* Recent Articles Widget */}
            {recentArticles.length > 0 && (
                <div className="rounded-2xl border border-[#19140015] bg-[#FDFDFC] p-6 shadow-sm transition-shadow duration-300 hover:shadow-md dark:border-[#3E3E3A]/40 dark:bg-[#161615]">
                    <h3 className="mb-4 flex items-center gap-2 border-b border-[#19140015] pb-3 text-sm font-semibold text-[#1b1b18] dark:border-[#3E3E3A]/40 dark:text-[#EDEDEC]">
                        <FileText className="h-4 w-4 text-(--theme-accent)" />
                        <span>Artículos Recientes</span>
                    </h3>
                    <ul className="space-y-4">
                        {recentArticles.map((art) => (
                            <li key={art.id} className="group">
                                <Link href={getArticleUrl(art)} className="block space-y-1">
                                    <h4 className="line-clamp-2 text-sm leading-snug font-medium text-[#1b1b18] capitalize transition-colors group-hover:text-(--theme-accent) dark:text-[#EDEDEC]">
                                        {art.title}
                                    </h4>
                                    <div className="flex items-center gap-1.5 text-xs text-[#706f6c] dark:text-[#A1A09A]">
                                        <Calendar className="h-3 w-3" />
                                        <time dateTime={art.created_at.toString()}>{format(new Date(art.created_at), 'dd/MM/yyyy')}</time>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Tag Cloud Widget */}
            {popularTags.length > 0 && (
                <div className="rounded-2xl border border-[#19140015] bg-[#FDFDFC] p-6 shadow-sm transition-shadow duration-300 hover:shadow-md dark:border-[#3E3E3A]/40 dark:bg-[#161615]">
                    <h3 className="mb-4 flex items-center gap-2 border-b border-[#19140015] pb-3 text-sm font-semibold text-[#1b1b18] dark:border-[#3E3E3A]/40 dark:text-[#EDEDEC]">
                        <Tag className="h-4 w-4 text-(--theme-accent)" />
                        <span>Etiquetas</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {popularTags.map((tag) => (
                            <Link
                                key={tag.id}
                                href={tagUrl(tag.slug)}
                                className="inline-flex items-center gap-1 rounded-lg border border-[#19140010] bg-gray-50 px-2.5 py-1.5 text-xs text-[#706f6c] transition-all duration-200 hover:bg-[#fff2f2] hover:text-(--theme-accent) dark:border-[#3E3E3A]/50 dark:bg-[#222] dark:text-[#c5c4c0] dark:hover:bg-[#1D0002]"
                            >
                                <span>#{tag.name}</span>
                                <span className="text-[10px] text-[#a1a09a] dark:text-[#706f6c]">({tag.count})</span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </aside>
    );
}
