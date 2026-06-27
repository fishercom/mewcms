import React, { useState } from 'react';
import FrontLayout from '../layout';
import { Head, Link } from '@inertiajs/react';
import { CmsPost, CmsPostType } from '@/types/models/cms-post';
import { CmsArticle } from '@/types/models/cms-article';
import { CmsTaxonomy } from '@/types/models/cms-taxonomy';
import { Pagination } from '@/types';
import { format } from 'date-fns';
import { Calendar, User, ArrowRight, Search, BookOpen } from 'lucide-react';
import FrontSidebar from '../components/sidebar';

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
    const pageDesc = cpt ? cpt.description || `Explora todos los artículos de ${cpt.name.toLowerCase()}.` : 'Mantente al día con nuestras últimas publicaciones.';

    const filteredPosts = posts.data.filter(post => 
        post.title.toLowerCase().includes(search.toLowerCase()) ||
        (post.excerpt && post.excerpt.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <FrontLayout navigation={navigation}>
            <Head title={pageTitle} />

            {/* Header section with gradient */}
            <div className="py-12 border-b border-[#19140010] dark:border-[#3E3E3A]/20">
                <div className="max-w-3xl">
                    <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-zinc-900 dark:text-white capitalize">
                        {pageTitle}
                    </h1>
                    <p className="mt-4 text-base text-zinc-500 dark:text-[#A1A09A]">
                        {pageDesc}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-8">
                {/* Posts Grid Column */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Search catalog */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-zinc-400" />
                        </div>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={`Buscar en ${pageTitle.toLowerCase()}...`}
                            className="block w-full pl-10 pr-3 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-transparent text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                        />
                    </div>

                    {filteredPosts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filteredPosts.map((post) => {
                                const detailUrl = cpt 
                                    ? `/${cpt.slug}/${post.slug}` 
                                    : `/blog/${post.slug}`;
                                    
                                return (
                                    <article 
                                        key={post.id} 
                                        className="flex flex-col bg-white dark:bg-[#161615]/20 rounded-2xl border border-[#19140010] dark:border-[#3E3E3A]/40 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 group hover:-translate-y-0.5"
                                    >
                                        {/* Post Thumbnail */}
                                        <Link href={detailUrl} className="block aspect-[16/10] overflow-hidden bg-zinc-100 relative">
                                            {post.featured_image ? (
                                                <img
                                                    src={post.featured_image}
                                                    alt={post.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-zinc-300 dark:text-zinc-700">
                                                    <BookOpen className="h-12 w-12" />
                                                </div>
                                            )}
                                        </Link>

                                        {/* Post Description */}
                                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                            <div className="space-y-2">
                                                {/* Category tag badges */}
                                                {post.terms && post.terms.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {post.terms.slice(0, 2).map((term) => (
                                                            <span key={term.id} className="text-[10px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
                                                                {term.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                
                                                <h3 className="text-lg font-bold leading-snug text-zinc-900 dark:text-white capitalize group-hover:text-red-600 dark:group-hover:text-red-500 transition-colors">
                                                    <Link href={detailUrl}>
                                                        {post.title}
                                                    </Link>
                                                </h3>
                                                
                                                <p className="text-xs text-zinc-500 dark:text-[#A1A09A] line-clamp-3 leading-relaxed">
                                                    {post.excerpt || 'Sin extracto disponible.'}
                                                </p>
                                            </div>

                                            {/* Footer metadata */}
                                            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
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
                                                <Link href={detailUrl} className="inline-flex items-center gap-0.5 text-red-600 dark:text-red-500 font-bold hover:underline">
                                                    <span>Ver</span>
                                                    <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                                                </Link>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-16 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-400">
                            <BookOpen className="h-10 w-10 mx-auto text-zinc-300 mb-3" />
                            <p className="text-sm font-medium">No se encontraron artículos.</p>
                        </div>
                    )}

                    {/* Pagination */}
                    {posts.last_page > 1 && (
                        <div className="pt-4 flex items-center justify-center gap-2">
                            {posts.links.map((link, idx) => {
                                if (link.url === null) return null;
                                return (
                                    <Link
                                        key={idx}
                                        href={link.url}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                                            link.active
                                                ? 'bg-red-600 text-white border-red-600'
                                                : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400'
                                        }`}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Sidebar Column */}
                <div className="lg:col-span-4">
                    <FrontSidebar
                        allTaxonomies={allTaxonomies}
                        recentArticles={recentArticles}
                    />
                </div>
            </div>
        </FrontLayout>
    );
}
