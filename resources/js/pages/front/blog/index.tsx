import { Pagination } from '@/types';
import { CmsArticle } from '@/types/models/cms-article';
import { CmsPost, CmsPostType } from '@/types/models/cms-post';
import { CmsTaxonomy } from '@/types/models/cms-taxonomy';
import { Head, Link } from '@inertiajs/react';
import { format } from 'date-fns';
import { ArrowRight, BookOpen, Calendar, Search, User } from 'lucide-react';
import { useState } from 'react';
import FrontSidebar from '../components/sidebar';
import FrontLayout from '../layout';

interface Props {
    posts: Pagination<CmsPost>;
    cpt: CmsPostType | null;
    navigation: Pick<CmsArticle, 'id' | 'title' | 'slug'>[];
    allTaxonomies?: CmsTaxonomy[];
    recentArticles?: Pick<CmsArticle, 'id' | 'title' | 'slug' | 'created_at'>[];
}

export default function Index({ posts, cpt, navigation, allTaxonomies = [], recentArticles = [] }: Props) {
    const [search, setSearch] = useState('');

    const pageTitle = cpt ? cpt.name : 'Blog / Entradas';
    const pageDesc = cpt
        ? cpt.description || `Explora todos los artículos de ${cpt.name.toLowerCase()}.`
        : 'Mantente al día con nuestras últimas publicaciones.';

    const filteredPosts = posts.data.filter(
        (post) =>
            post.title.toLowerCase().includes(search.toLowerCase()) || (post.excerpt && post.excerpt.toLowerCase().includes(search.toLowerCase())),
    );

    return (
        <FrontLayout navigation={navigation}>
            <Head title={pageTitle} />

            {/* Header section with gradient */}
            <div className="border-b border-[#19140010] py-12 dark:border-[#3E3E3A]/20">
                <div className="max-w-3xl">
                    <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 capitalize sm:text-6xl dark:text-white">{pageTitle}</h1>
                    <p className="mt-4 text-base text-zinc-500 dark:text-[#A1A09A]">{pageDesc}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8 py-8 lg:grid-cols-12">
                {/* Posts Grid Column */}
                <div className="space-y-8 lg:col-span-8">
                    {/* Search catalog */}
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Search className="h-4 w-4 text-zinc-400" />
                        </div>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={`Buscar en ${pageTitle.toLowerCase()}...`}
                            className="block w-full rounded-xl border border-zinc-200 bg-white py-2.5 pr-3 pl-10 text-sm text-zinc-800 placeholder-zinc-400 transition-all focus:border-transparent focus:ring-2 focus:ring-red-500 focus:outline-none dark:border-zinc-800 dark:bg-transparent dark:text-zinc-200"
                        />
                    </div>

                    {filteredPosts.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {filteredPosts.map((post) => {
                                const detailUrl = cpt ? `/${cpt.slug}/${post.slug}` : `/blog/${post.slug}`;

                                return (
                                    <article
                                        key={post.id}
                                        className="group flex flex-col overflow-hidden rounded-2xl border border-[#19140010] bg-white shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-[#3E3E3A]/40 dark:bg-[#161615]/20"
                                    >
                                        {/* Post Thumbnail */}
                                        <Link href={detailUrl} className="relative block aspect-[16/10] overflow-hidden bg-zinc-100">
                                            {post.featured_image ? (
                                                <img
                                                    src={post.featured_image}
                                                    alt={post.title}
                                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-zinc-300 dark:text-zinc-700">
                                                    <BookOpen className="h-12 w-12" />
                                                </div>
                                            )}
                                        </Link>

                                        {/* Post Description */}
                                        <div className="flex flex-1 flex-col justify-between space-y-4 p-5">
                                            <div className="space-y-2">
                                                {/* Category tag badges */}
                                                {post.terms && post.terms.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {post.terms.slice(0, 2).map((term) => (
                                                            <span
                                                                key={term.id}
                                                                className="text-[10px] font-semibold tracking-wider text-red-600 uppercase dark:text-red-400"
                                                            >
                                                                {term.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                <h3 className="text-lg leading-snug font-bold text-zinc-900 capitalize transition-colors group-hover:text-red-600 dark:text-white dark:group-hover:text-red-500">
                                                    <Link href={detailUrl}>{post.title}</Link>
                                                </h3>

                                                <p className="line-clamp-3 text-xs leading-relaxed text-zinc-500 dark:text-[#A1A09A]">
                                                    {post.excerpt || 'Sin extracto disponible.'}
                                                </p>
                                            </div>

                                            {/* Footer metadata */}
                                            <div className="flex items-center justify-between border-t border-zinc-100 pt-4 text-[11px] text-zinc-400 dark:border-zinc-800">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        <span>{format(new Date(post.published_at), 'dd/MM/yyyy')}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <User className="h-3 w-3" />
                                                        <span>{post.user?.name || 'Autor'}</span>
                                                    </div>
                                                </div>
                                                <Link
                                                    href={detailUrl}
                                                    className="inline-flex items-center gap-0.5 font-bold text-red-600 hover:underline dark:text-red-500"
                                                >
                                                    <span>Ver</span>
                                                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                                                </Link>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-zinc-200 py-16 text-center text-zinc-400 dark:border-zinc-800">
                            <BookOpen className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
                            <p className="text-sm font-medium">No se encontraron artículos.</p>
                        </div>
                    )}

                    {/* Pagination */}
                    {posts.last_page > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-4">
                            {posts.links.map((link, idx) => {
                                if (link.url === null) return null;
                                return (
                                    <Link
                                        key={idx}
                                        href={link.url}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`rounded-lg border px-3 py-1.5 text-xs transition-all ${
                                            link.active
                                                ? 'border-red-600 bg-red-600 text-white'
                                                : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800/40'
                                        }`}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Sidebar Column */}
                <div className="lg:col-span-4">
                    <FrontSidebar allTaxonomies={allTaxonomies} recentArticles={recentArticles} />
                </div>
            </div>
        </FrontLayout>
    );
}
