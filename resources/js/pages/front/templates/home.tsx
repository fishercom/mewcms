/**
 * Template Name: Home Page
 * Unique: true
 */
import FrontSlider from '@/components/front-slider';
import { CmsArticle } from '@/types/models/cms-article';
import { CmsSlider } from '@/types/models/cms-slider';
import { Head } from '@inertiajs/react';
import FrontLayout from '../layout';

interface HomeProps {
    article: CmsArticle;
    navigation: Pick<CmsArticle, 'id' | 'title' | 'slug'>[];
    slider?: CmsSlider;
}

interface HomeMetadata {
    hero_title?: string;
    hero_subtitle?: string;
    hero_description?: string;
    [key: string]: unknown;
}

export default function Home({ article, navigation, slider }: HomeProps) {
    const meta = (article.metadata || {}) as HomeMetadata;

    // Dynamically retrieve hero content from custom fields or fallback
    const heroTitle = meta.hero_title || article.title;
    const heroSubtitle = meta.hero_subtitle || 'Welcome to our dynamic website powered by MewCMS.';
    const heroDescription =
        meta.hero_description || 'You can manage all page sections, custom fields, and repeaters directly from the administrator dashboard.';

    return (
        <FrontLayout navigation={navigation}>
            <Head title={article.title} />

            <div className="space-y-16 py-8">
                {/* Hero / Slider Section */}
                {slider && slider.slides && slider.slides.length > 0 ? (
                    <FrontSlider slider={slider} />
                ) : (
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-tr from-[#fff2f2] to-[#fffaf0] px-6 py-24 shadow-[inset_0px_0px_0px_1px_rgba(26,26,0,0.05)] sm:px-12 sm:py-32 lg:px-16 dark:from-[#1D0002] dark:to-[#1a0f00] dark:shadow-[inset_0px_0px_0px_1px_#fffaed15]">
                        <div className="mx-auto max-w-2xl space-y-6 text-center">
                            <h1 className="bg-gradient-to-r from-red-600 to-amber-600 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-6xl dark:from-red-400 dark:to-amber-400">
                                {heroTitle}
                            </h1>
                            <p className="text-lg font-medium text-[#706f6c] dark:text-[#c5c4c0]">{heroSubtitle}</p>
                            <p className="mx-auto max-w-xl text-sm leading-relaxed text-[#706f6c] dark:text-[#a1a09a]">{heroDescription}</p>
                        </div>
                    </div>
                )}

                {/* Custom Content blocks if metadata contains other fields */}
                {Object.keys(meta).length > 3 && (
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {Object.entries(meta)
                            .filter(([key]) => !['hero_title', 'hero_subtitle', 'hero_description', '_id'].includes(key) && !key.startsWith('seo_'))
                            .map(([key, val]) => {
                                if (typeof val !== 'object' && val) {
                                    return (
                                        <div
                                            key={key}
                                            className="rounded-xl border border-[#19140015] bg-white p-6 shadow-sm dark:border-[#3E3E3A]/40 dark:bg-[#161615]"
                                        >
                                            <h3 className="mb-2 text-sm font-semibold text-[#f53003] capitalize dark:text-[#FF4433]">
                                                {key.replace(/_/g, ' ')}
                                            </h3>
                                            <p className="text-sm break-words text-[#706f6c] dark:text-[#c5c4c0]">{String(val)}</p>
                                        </div>
                                    );
                                }
                                return null;
                            })}
                    </div>
                )}
            </div>
        </FrontLayout>
    );
}
