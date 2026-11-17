/**
 * Template Name: Standard Page
 */
import Blocks from '@/components/blocks';
import { MediaImage } from '@/components/media-image';
import { localePath } from '@/lib/locale-path';
import { tagUrl } from '@/lib/tag-url';
import { useTexts } from '@/lib/theme-texts';
import { CmsArticle } from '@/types/models/cms-article';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { PageHero } from '../components/post-card';
import FrontLayout from '../layout';

interface PageProps {
    article: CmsArticle;
    navigation: Pick<CmsArticle, 'id' | 'title' | 'slug'>[];
}

const isImageUrl = (value: string) => /\.(jpe?g|gif|png|webp|avif|svg)(\?|$)/i.test(value) && (value.startsWith('http') || value.startsWith('/'));
const label = (key: string) => key.replace(/_/g, ' ');

/**
 * Custom fields of the page's field group that the template does not place itself: shown
 * after the content so nothing an editor fills in goes missing.
 */
function CustomFields({ meta }: { meta: Record<string, unknown> }) {
    const entries = Object.entries(meta).filter(([key, value]) => key !== '_id' && !key.startsWith('seo_') && value !== null && value !== '');
    if (entries.length === 0) return null;

    return (
        <div className="space-y-8 border-t border-(--theme-line) pt-10">
            {entries.map(([key, value]) => {
                if (typeof value === 'string') {
                    if (value.startsWith('<') && value.endsWith('>')) {
                        return (
                            <section key={key} className="space-y-2">
                                <h3 className="text-xs font-semibold tracking-wider text-(--theme-muted) uppercase">{label(key)}</h3>
                                <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: value }} />
                            </section>
                        );
                    }
                    if (isImageUrl(value)) {
                        return (
                            <figure key={key} className="space-y-2">
                                <MediaImage
                                    src={value}
                                    fallbackAlt={label(key)}
                                    sizes="(max-width: 768px) 100vw, 768px"
                                    className="h-auto max-w-full rounded-2xl"
                                />
                                <figcaption className="text-xs text-(--theme-muted) capitalize">{label(key)}</figcaption>
                            </figure>
                        );
                    }
                    return (
                        <div key={key} className="space-y-1">
                            <h3 className="text-xs font-semibold tracking-wider text-(--theme-muted) uppercase">{label(key)}</h3>
                            <p className="leading-relaxed">{value}</p>
                        </div>
                    );
                }

                if (Array.isArray(value)) {
                    return (
                        <section key={key} className="space-y-3">
                            <h3 className="text-xs font-semibold tracking-wider text-(--theme-muted) uppercase">{label(key)}</h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {(value as Record<string, unknown>[]).map((item, index) => (
                                    <dl
                                        key={(item?._id as string) || index}
                                        className="space-y-1.5 rounded-2xl border border-(--theme-line) bg-(--theme-surface) p-5 text-sm"
                                    >
                                        {Object.entries(item ?? {})
                                            .filter(([subKey]) => subKey !== '_id')
                                            .map(([subKey, subValue]) => (
                                                <div key={subKey}>
                                                    <dt className="inline font-semibold capitalize">{label(subKey)}: </dt>
                                                    <dd className="inline text-(--theme-muted)">{String(subValue)}</dd>
                                                </div>
                                            ))}
                                    </dl>
                                ))}
                            </div>
                        </section>
                    );
                }

                return null;
            })}
        </div>
    );
}

export default function Page({ article, navigation }: PageProps) {
    const { t } = useTexts();
    const tags = article.tags ?? [];
    const childUrl = (item: { url?: string; slug: string }) => item.url ?? localePath('/' + item.slug);

    return (
        <FrontLayout navigation={navigation}>
            <Head title={article.title} />

            <div className="space-y-12">
                <PageHero eyebrow={article.parent?.title} title={article.title} text={article.excerpt}>
                    {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                            {tags.map((tag) => (
                                <Link
                                    key={tag.id}
                                    href={tagUrl(tag.slug)}
                                    className="rounded-full border border-(--theme-line) bg-(--theme-bg) px-3 py-1 text-xs font-semibold text-(--theme-muted) transition-colors hover:border-(--theme-accent) hover:text-(--theme-accent)"
                                >
                                    #{tag.name}
                                </Link>
                            ))}
                        </div>
                    )}
                </PageHero>

                {article.featured_image && (
                    <div className="aspect-video overflow-hidden rounded-[2rem] md:aspect-[21/9]">
                        <MediaImage src={article.featured_image} fallbackAlt={article.title} loading="eager" className="h-full w-full object-cover" />
                    </div>
                )}

                <div className="mx-auto max-w-4xl space-y-12">
                    <Blocks blocks={article.blocks} html={article.content} className="space-y-12" textClassName="*:prose-lg leading-relaxed" />

                    <CustomFields meta={(article.metadata || {}) as Record<string, unknown>} />

                    {article.children?.length ? (
                        <section className="space-y-5 border-t border-(--theme-line) pt-10">
                            <h2 className="text-2xl font-bold tracking-tight">{t('page.children')}</h2>
                            <ul className="grid gap-4 sm:grid-cols-2">
                                {article.children.map((child) => (
                                    <li key={child.id}>
                                        <Link
                                            href={childUrl(child)}
                                            className="group flex items-center justify-between gap-3 rounded-2xl border border-(--theme-line) bg-(--theme-bg) p-5 font-semibold transition-all hover:-translate-y-0.5 hover:border-(--theme-accent)/50"
                                        >
                                            {child.title}
                                            <ArrowRight className="h-4 w-4 text-(--theme-accent) transition-transform group-hover:translate-x-0.5" />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ) : null}
                </div>
            </div>
        </FrontLayout>
    );
}
