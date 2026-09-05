import { CmsArticle } from '@/types/models/cms-article';
import { CmsTaxonomy } from '@/types/models/cms-taxonomy';
import { Link } from '@inertiajs/react';
import { format } from 'date-fns';
import { Calendar, FileText, FolderOpen, Tag } from 'lucide-react';

interface SidebarProps {
    allTaxonomies?: CmsTaxonomy[];
    recentArticles?: Pick<CmsArticle, 'id' | 'title' | 'slug' | 'created_at'>[];
}

export default function FrontSidebar({ allTaxonomies = [], recentArticles = [] }: SidebarProps) {
    // Helper to format URLs
    const getArticleUrl = (slug: string) => {
        if (!slug || slug === 'home') return '/';
        return '/' + slug.replace(/_/g, '/');
    };

    const getTermUrl = (taxonomySlug: string, termSlug: string) => {
        const cleanTaxSlug = taxonomySlug.toLowerCase();
        if (cleanTaxSlug === 'categorias' || cleanTaxSlug === 'categories' || cleanTaxSlug === 'category') {
            return `/category/${termSlug}`;
        }
        if (cleanTaxSlug === 'tags' || cleanTaxSlug === 'etiquetas' || cleanTaxSlug === 'tag') {
            return `/tag/${termSlug}`;
        }
        return `/category/${termSlug}`; // Default fallback
    };

    // Classify taxonomies into Categories vs Tags
    const categories = allTaxonomies.filter((tax) => ['categorias', 'categories', 'category'].includes(tax.slug.toLowerCase()));

    const tagsTaxonomy = allTaxonomies.filter((tax) => ['tags', 'etiquetas', 'tag'].includes(tax.slug.toLowerCase()));

    // Any other taxonomies that aren't strictly Category or Tag groups
    const otherTaxonomies = allTaxonomies.filter(
        (tax) => !['categorias', 'categories', 'category', 'tags', 'etiquetas', 'tag'].includes(tax.slug.toLowerCase()),
    );

    return (
        <aside className="space-y-8 lg:sticky lg:top-24">
            {/* Recent Articles Widget */}
            {recentArticles.length > 0 && (
                <div className="rounded-2xl border border-[#19140015] bg-[#FDFDFC] p-6 shadow-sm transition-shadow duration-300 hover:shadow-md dark:border-[#3E3E3A]/40 dark:bg-[#161615]">
                    <h3 className="mb-4 flex items-center gap-2 border-b border-[#19140015] pb-3 text-sm font-semibold text-[#1b1b18] dark:border-[#3E3E3A]/40 dark:text-[#EDEDEC]">
                        <FileText className="h-4 w-4 text-[#f53003] dark:text-[#FF4433]" />
                        <span>Artículos Recientes</span>
                    </h3>
                    <ul className="space-y-4">
                        {recentArticles.map((art) => (
                            <li key={art.id} className="group">
                                <Link href={getArticleUrl(art.slug)} className="block space-y-1">
                                    <h4 className="line-clamp-2 text-sm leading-snug font-medium text-[#1b1b18] capitalize transition-colors group-hover:text-[#f53003] dark:text-[#EDEDEC] dark:group-hover:text-[#FF4433]">
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

            {/* Categories Widget */}
            {categories.map((taxonomy) => {
                const terms = taxonomy.terms || [];
                if (terms.length === 0) return null;
                return (
                    <div
                        key={taxonomy.id}
                        className="rounded-2xl border border-[#19140015] bg-[#FDFDFC] p-6 shadow-sm transition-shadow duration-300 hover:shadow-md dark:border-[#3E3E3A]/40 dark:bg-[#161615]"
                    >
                        <h3 className="mb-4 flex items-center gap-2 border-b border-[#19140015] pb-3 text-sm font-semibold text-[#1b1b18] dark:border-[#3E3E3A]/40 dark:text-[#EDEDEC]">
                            <FolderOpen className="h-4 w-4 text-[#f53003] dark:text-[#FF4433]" />
                            <span>{taxonomy.name}</span>
                        </h3>
                        <ul className="space-y-2.5">
                            {terms.map((term) => {
                                const count = (term as unknown as { articles_count?: number }).articles_count ?? 0;
                                return (
                                    <li key={term.id}>
                                        <Link
                                            href={getTermUrl(taxonomy.slug, term.slug)}
                                            className="group flex items-center justify-between py-1 text-sm text-[#706f6c] transition-colors hover:text-[#f53003] dark:text-[#c5c4c0] dark:hover:text-[#FF4433]"
                                        >
                                            <span className="capitalize transition-transform duration-200 group-hover:translate-x-0.5">
                                                {term.name}
                                            </span>
                                            <span className="rounded-full border border-[#19140008] bg-gray-100 px-2 py-0.5 text-xs font-medium text-[#706f6c] dark:border-transparent dark:bg-[#282827] dark:text-[#A1A09A]">
                                                {count}
                                            </span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                );
            })}

            {/* Tag Cloud Widget */}
            {tagsTaxonomy.map((taxonomy) => {
                const terms = taxonomy.terms || [];
                if (terms.length === 0) return null;
                return (
                    <div
                        key={taxonomy.id}
                        className="rounded-2xl border border-[#19140015] bg-[#FDFDFC] p-6 shadow-sm transition-shadow duration-300 hover:shadow-md dark:border-[#3E3E3A]/40 dark:bg-[#161615]"
                    >
                        <h3 className="mb-4 flex items-center gap-2 border-b border-[#19140015] pb-3 text-sm font-semibold text-[#1b1b18] dark:border-[#3E3E3A]/40 dark:text-[#EDEDEC]">
                            <Tag className="h-4 w-4 text-[#f53003] dark:text-[#FF4433]" />
                            <span>{taxonomy.name}</span>
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {terms.map((term) => {
                                const count = (term as unknown as { articles_count?: number }).articles_count ?? 0;
                                return (
                                    <Link
                                        key={term.id}
                                        href={getTermUrl(taxonomy.slug, term.slug)}
                                        className="inline-flex items-center gap-1 rounded-lg border border-[#19140010] bg-gray-50 px-2.5 py-1.5 text-xs text-[#706f6c] transition-all duration-200 hover:bg-[#fff2f2] hover:text-[#f53003] dark:border-[#3E3E3A]/50 dark:bg-[#222] dark:text-[#c5c4c0] dark:hover:bg-[#1D0002] dark:hover:text-[#FF4433]"
                                    >
                                        <span>#{term.name}</span>
                                        <span className="text-[10px] text-[#a1a09a] dark:text-[#706f6c]">({count})</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            {/* Custom Taxonomies Widget */}
            {otherTaxonomies.map((taxonomy) => {
                const terms = taxonomy.terms || [];
                if (terms.length === 0) return null;
                return (
                    <div
                        key={taxonomy.id}
                        className="rounded-2xl border border-[#19140015] bg-[#FDFDFC] p-6 shadow-sm transition-shadow duration-300 hover:shadow-md dark:border-[#3E3E3A]/40 dark:bg-[#161615]"
                    >
                        <h3 className="mb-4 flex items-center gap-2 border-b border-[#19140015] pb-3 text-sm font-semibold text-[#1b1b18] dark:border-[#3E3E3A]/40 dark:text-[#EDEDEC]">
                            <FolderOpen className="h-4 w-4 text-[#f53003] dark:text-[#FF4433]" />
                            <span>{taxonomy.name}</span>
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {terms.map((term) => (
                                <Link
                                    key={term.id}
                                    href={getTermUrl(taxonomy.slug, term.slug)}
                                    className="inline-flex items-center rounded-md border border-[#19140010] bg-gray-50 px-2.5 py-1 text-xs text-[#706f6c] transition-colors hover:bg-[#fff2f2] hover:text-[#f53003] dark:border-[#3E3E3A]/50 dark:bg-[#222] dark:text-[#c5c4c0] dark:hover:bg-[#1D0002] dark:hover:text-[#FF4433]"
                                >
                                    {term.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                );
            })}
        </aside>
    );
}
