import { CmsArticle } from '@/types/models/cms-article';
import { Head, Link } from '@inertiajs/react';
import { format } from 'date-fns';
import { ArrowRight, Calendar, Tag } from 'lucide-react';
import FrontSidebar, { PopularTag } from './components/sidebar';
import FrontLayout from './layout';

/** A published page or post tagged with the tag, prepared by the server. */
interface TaggedItem {
    id: string;
    type: string;
    title: string;
    url: string;
    excerpt: string;
    date: string | null;
}

interface TagPageProps {
    tag: { id: number; name: string; slug: string };
    items: TaggedItem[];
    navigation: Pick<CmsArticle, 'id' | 'title' | 'slug'>[];
    popularTags?: PopularTag[];
    recentArticles?: Pick<CmsArticle, 'id' | 'title' | 'slug' | 'created_at'>[];
}

export default function TagPage({ tag, items = [], navigation, popularTags = [], recentArticles = [] }: TagPageProps) {
    return (
        <FrontLayout navigation={navigation}>
            <Head title={`#${tag.name}`} />

            <div className="grid grid-cols-1 gap-8 py-6 lg:grid-cols-12">
                <div className="space-y-8 lg:col-span-8">
                    <div className="rounded-2xl border border-[#19140010] bg-gradient-to-tr from-[#fff2f2] to-[#fffaf0] p-6 shadow-sm sm:p-8 dark:border-[#3E3E3A]/20 dark:from-[#1D0002] dark:to-[#1a0f00]">
                        <div className="mb-2 flex items-center gap-3 text-sm font-semibold text-[#f53003] dark:text-[#FF4433]">
                            <Tag className="h-5 w-5" />
                            <span>Etiqueta</span>
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-[#1b1b18] sm:text-4xl dark:text-[#EDEDEC]">#{tag.name}</h1>
                    </div>

                    {items.length > 0 ? (
                        <div className="space-y-6">
                            {items.map((item) => (
                                <article
                                    key={item.id}
                                    className="flex flex-col justify-between rounded-2xl border border-[#19140012] bg-[#FDFDFC] p-6 shadow-sm transition-all duration-300 hover:border-[#f53003]/30 hover:shadow-md dark:border-[#3E3E3A]/20 dark:bg-[#161615] dark:hover:border-[#FF4433]/30"
                                >
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#706f6c] dark:text-[#A1A09A]">
                                            <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-semibold dark:bg-[#282827]">{item.type}</span>
                                            {item.date && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    <time dateTime={item.date}>{format(new Date(item.date), 'dd/MM/yyyy')}</time>
                                                </span>
                                            )}
                                        </div>

                                        <Link href={item.url} className="group block">
                                            <h2 className="text-xl leading-tight font-bold tracking-tight text-[#1b1b18] transition-colors group-hover:text-[#f53003] dark:text-[#EDEDEC] dark:group-hover:text-[#FF4433]">
                                                {item.title}
                                            </h2>
                                        </Link>

                                        {item.excerpt && <p className="text-sm leading-relaxed text-[#706f6c] dark:text-[#c5c4c0]">{item.excerpt}</p>}
                                    </div>

                                    <div className="mt-4 flex justify-end border-t border-[#19140008] pt-4 dark:border-[#3E3E3A]/10">
                                        <Link
                                            href={item.url}
                                            className="group inline-flex items-center gap-1 text-xs font-semibold text-[#f53003] transition-colors hover:text-[#c42400] dark:text-[#FF4433] dark:hover:text-[#ff6655]"
                                        >
                                            <span>Leer más</span>
                                            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-[#19140015] py-16 text-center dark:border-[#3E3E3A]/40">
                            <p className="text-sm text-[#706f6c] italic dark:text-[#A1A09A]">Todavía no hay contenido publicado con esta etiqueta.</p>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-4">
                    <FrontSidebar popularTags={popularTags} recentArticles={recentArticles} />
                </div>
            </div>
        </FrontLayout>
    );
}
