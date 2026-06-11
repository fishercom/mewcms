/**
 * Template Name: Home Page
 * Unique: true
 */
import React from 'react';
import FrontLayout from '../layout';
import { Head } from '@inertiajs/react';
import { CmsArticle } from '@/types/models/cms-article';

interface HomeProps {
    article: CmsArticle;
    navigation: Pick<CmsArticle, 'id' | 'title' | 'slug'>[];
}

interface HomeMetadata {
    hero_title?: string;
    hero_subtitle?: string;
    hero_description?: string;
    [key: string]: unknown;
}

export default function Home({ article, navigation }: HomeProps) {
    const meta = (article.metadata || {}) as HomeMetadata;

    // Dynamically retrieve hero content from custom fields or fallback
    const heroTitle = meta.hero_title || article.title;
    const heroSubtitle = meta.hero_subtitle || 'Welcome to our dynamic website powered by MewCMS.';
    const heroDescription = meta.hero_description || 'You can manage all page sections, custom fields, and repeaters directly from the administrator dashboard.';

    return (
        <FrontLayout navigation={navigation}>
            <Head title={article.title} />

            <div className="space-y-16 py-8">
                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-tr from-[#fff2f2] to-[#fffaf0] dark:from-[#1D0002] dark:to-[#1a0f00] px-6 py-24 sm:px-12 sm:py-32 lg:px-16 shadow-[inset_0px_0px_0px_1px_rgba(26,26,0,0.05)] dark:shadow-[inset_0px_0px_0px_1px_#fffaed15]">
                    <div className="mx-auto max-w-2xl text-center space-y-6">
                        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl bg-gradient-to-r from-red-600 to-amber-600 bg-clip-text text-transparent dark:from-red-400 dark:to-amber-400">
                            {heroTitle}
                        </h1>
                        <p className="text-lg font-medium text-[#706f6c] dark:text-[#c5c4c0]">
                            {heroSubtitle}
                        </p>
                        <p className="text-sm text-[#706f6c] dark:text-[#a1a09a] max-w-xl mx-auto leading-relaxed">
                            {heroDescription}
                        </p>
                    </div>
                </div>

                {/* Custom Content blocks if metadata contains other fields */}
                {Object.keys(meta).length > 3 && (
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {Object.entries(meta)
                            .filter(([key]) => !['hero_title', 'hero_subtitle', 'hero_description', '_id'].includes(key))
                            .map(([key, val]) => {
                                if (typeof val !== 'object' && val) {
                                    return (
                                        <div key={key} className="rounded-xl border border-[#19140015] bg-white p-6 shadow-sm dark:border-[#3E3E3A]/40 dark:bg-[#161615]">
                                            <h3 className="text-sm font-semibold capitalize text-[#f53003] dark:text-[#FF4433] mb-2">
                                                {key.replace(/_/g, ' ')}
                                            </h3>
                                            <p className="text-sm text-[#706f6c] dark:text-[#c5c4c0] break-words">
                                                {String(val)}
                                            </p>
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