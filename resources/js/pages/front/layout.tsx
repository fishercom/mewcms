import { CmsArticle } from '@/types/models/cms-article';
import { CmsMenu } from '@/types/models/cms-menu';
import { Head, Link, usePage } from '@inertiajs/react';
import { ChevronDown, Facebook, Instagram, Linkedin, Twitter, Youtube } from 'lucide-react';
import React from 'react';

interface LayoutProps {
    children: React.ReactNode;
    navigation: Pick<CmsArticle, 'id' | 'title' | 'slug'>[];
}

export default function FrontLayout({ children, navigation }: LayoutProps) {
    const { menus = [], layout_settings = {} } = usePage<{
        menus: CmsMenu[];
        layout_settings?: Record<string, string>;
    }>().props;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pageProps = usePage().props as any;
    const activeItem = pageProps.article || pageProps.post || null;
    const seo = activeItem?.metadata || {};

    const seoTitle = seo.seo_title || activeItem?.title || '';
    const seoDescription = seo.seo_description || activeItem?.excerpt || '';
    const seoKeywords = seo.seo_keywords || '';
    const seoOgImage = seo.seo_og_image || activeItem?.featured_image || '';
    const headerMenu = menus.find((m) => m.slug === 'main' || m.slug === 'header' || m.slug === 'navigation' || m.slug === 'site-principal');
    const menuItems = headerMenu?.items || [];

    const footerMenu = menus.find((m) => m.slug === 'footer');
    const footerItems = footerMenu?.items || [];

    // Helper to format underscores back to slashes for URLs
    const getUrl = (slug: string) => {
        if (!slug || slug === 'home') return '/';
        return '/' + slug.replace(/_/g, '/');
    };

    const renderNavLinks = () => {
        if (menuItems.length > 0) {
            const parents = menuItems.filter((i) => i.parent_id === null);
            const getChildrenOf = (parentId: number) => menuItems.filter((i) => i.parent_id === parentId);

            return parents.map((item) => {
                const children = getChildrenOf(item.id);
                const hasChildren = children.length > 0;

                if (hasChildren) {
                    return (
                        <div key={item.id} className="group relative py-2">
                            <button className="flex cursor-pointer items-center gap-1 border-0 bg-transparent text-sm font-medium capitalize transition-colors hover:text-[#f53003] dark:hover:text-[#FF4433]">
                                <span>{item.title}</span>
                                <ChevronDown className="h-3.5 w-3.5 opacity-60 transition-transform duration-300 group-hover:rotate-180" />
                            </button>
                            <div className="pointer-events-none absolute left-0 z-50 mt-2 w-48 translate-y-1 transform rounded-xl border border-[#19140015] bg-[#FDFDFC] p-2 opacity-0 shadow-lg transition-all duration-300 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 dark:border-[#3E3E3A]/45 dark:bg-[#161615]">
                                {children.map((child) => (
                                    <Link
                                        key={child.id}
                                        href={child.resolved_url || '#'}
                                        target={child.target}
                                        className="block rounded-lg px-3 py-2 text-xs text-[#706f6c] capitalize transition-all hover:bg-gray-50 hover:text-[#f53003] dark:text-[#c5c4c0] dark:hover:bg-gray-800/30 dark:hover:text-[#FF4433]"
                                    >
                                        {child.title}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    );
                }

                return (
                    <Link
                        key={item.id}
                        href={item.resolved_url || '#'}
                        target={item.target}
                        className="text-sm font-medium capitalize transition-colors hover:text-[#f53003] dark:hover:text-[#FF4433]"
                    >
                        {item.title}
                    </Link>
                );
            });
        }

        return (
            <>
                <Link href="/" className="text-sm font-medium transition-colors hover:text-[#f53003] dark:hover:text-[#FF4433]">
                    Inicio
                </Link>
                {navigation
                    .filter((item) => item.slug !== 'home')
                    .map((item) => (
                        <Link
                            key={item.id}
                            href={getUrl(item.slug)}
                            className="text-sm font-medium capitalize transition-colors hover:text-[#f53003] dark:hover:text-[#FF4433]"
                        >
                            {item.title}
                        </Link>
                    ))}
            </>
        );
    };

    return (
        <div className="min-h-screen bg-[#FDFDFC] text-[#1b1b18] transition-colors duration-200 dark:bg-[#0a0a0a] dark:text-[#EDEDEC]">
            <Head>
                {seoTitle && <title>{seoTitle}</title>}
                {seoDescription && <meta name="description" content={seoDescription} />}
                {seoKeywords && <meta name="keywords" content={seoKeywords} />}
                {seoTitle && <meta property="og:title" content={seoTitle} />}
                {seoDescription && <meta property="og:description" content={seoDescription} />}
                {seoOgImage && <meta property="og:image" content={seoOgImage} />}
                <meta property="og:type" content="website" />
            </Head>
            {/* Navigation Header */}
            <header className="sticky top-0 z-40 w-full border-b border-[#19140015] bg-[#FDFDFC]/80 backdrop-blur-md dark:border-[#3E3E3A]/40 dark:bg-[#0a0a0a]/80">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <Link href="/" className="text-primary text-xl font-bold tracking-tight hover:opacity-85">
                            {layout_settings?.layout_header_logo ? (
                                <img src={layout_settings.layout_header_logo} alt="Logo" className="h-8 max-w-[200px] object-contain" />
                            ) : (
                                'MewCMS'
                            )}
                        </Link>
                    </div>

                    {/* Navigation Links */}
                    <nav className="hidden items-center gap-6 md:flex">{renderNavLinks()}</nav>

                    {/* Admin Access & Right Actions */}
                    <div className="flex items-center gap-4">
                        <Link
                            href="/admin"
                            className="inline-flex h-9 items-center justify-center rounded-md border border-[#19140035] px-4 text-sm font-medium transition-colors hover:border-[#1915014a] dark:border-[#3E3E3A] dark:hover:border-[#62605b]"
                        >
                            Admin Dashboard
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">{children}</div>
            </main>

            {/* Footer */}
            <footer className="mt-16 border-t border-[#19140010] bg-[#FDFDFC] py-8 transition-colors dark:border-[#3E3E3A]/20 dark:bg-[#0a0a0a]">
                <div className="mx-auto max-w-7xl space-y-4 px-4 text-center text-xs text-[#706f6c] sm:px-6 lg:px-8 dark:text-[#A1A09A]">
                    {layout_settings?.layout_footer_logo && (
                        <div className="mb-4 flex justify-center">
                            <img src={layout_settings.layout_footer_logo} alt="Footer Logo" className="h-8 max-w-[200px] object-contain" />
                        </div>
                    )}

                    {footerItems.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 font-medium">
                            {footerItems.map((item) => (
                                <Link
                                    key={item.id}
                                    href={item.resolved_url || '#'}
                                    target={item.target}
                                    className="transition-colors hover:text-[#f53003] dark:hover:text-[#FF4433]"
                                >
                                    {item.title}
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* Social Media Links */}
                    <div className="flex justify-center gap-4 py-1.5 text-[#706f6c] dark:text-[#A1A09A]">
                        {layout_settings?.layout_facebook && (
                            <a
                                href={layout_settings.layout_facebook}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="transition-colors hover:text-blue-600"
                                title="Facebook"
                            >
                                <Facebook className="h-4.5 w-4.5" />
                            </a>
                        )}
                        {layout_settings?.layout_instagram && (
                            <a
                                href={layout_settings.layout_instagram}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="transition-colors hover:text-pink-600"
                                title="Instagram"
                            >
                                <Instagram className="h-4.5 w-4.5" />
                            </a>
                        )}
                        {layout_settings?.layout_twitter && (
                            <a
                                href={layout_settings.layout_twitter}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="transition-colors hover:text-sky-500"
                                title="Twitter/X"
                            >
                                <Twitter className="h-4.5 w-4.5" />
                            </a>
                        )}
                        {layout_settings?.layout_linkedin && (
                            <a
                                href={layout_settings.layout_linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="transition-colors hover:text-blue-700"
                                title="LinkedIn"
                            >
                                <Linkedin className="h-4.5 w-4.5" />
                            </a>
                        )}
                        {layout_settings?.layout_youtube && (
                            <a
                                href={layout_settings.layout_youtube}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="transition-colors hover:text-red-600"
                                title="YouTube"
                            >
                                <Youtube className="h-4.5 w-4.5" />
                            </a>
                        )}
                    </div>

                    <p>{layout_settings?.layout_copyright || `© ${new Date().getFullYear()} MewCMS. Powered by Laravel, Inertia, and React.`}</p>
                </div>
            </footer>

            {/* Custom injected styles block */}
            {layout_settings?.layout_custom_css && <style dangerouslySetInnerHTML={{ __html: layout_settings.layout_custom_css }} />}
        </div>
    );
}
