import { BrandLockup } from '@/components/app-logo';
import { LanguageSwitcher } from '@/components/front-language-switcher';
import { isExternalLink, SocialIcon, socialLinkName, type SocialLink } from '@/components/social-icon';
import { localePath } from '@/lib/locale-path';
import { escapeHtml, useTexts, withYear } from '@/lib/theme-texts';
import { cn } from '@/lib/utils';
import { CmsArticle } from '@/types/models/cms-article';
import { CmsMenu, CmsMenuItem } from '@/types/models/cms-menu';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowUpRight, ChevronDown, Menu, Search, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface LayoutProps {
    children: React.ReactNode;
    navigation: Pick<CmsArticle, 'id' | 'title' | 'slug' | 'url'>[];
}

/** A menu entry with its sub-entries, whatever the source (a menu or the page list) */
interface NavEntry {
    key: string | number;
    title: string;
    href: string;
    target?: string;
    children: NavEntry[];
}

const fromMenu = (items: CmsMenuItem[], parentId: number | null = null): NavEntry[] =>
    items
        .filter((item) => (item.parent_id ?? null) === parentId)
        .map((item) => ({
            key: item.id,
            title: item.title,
            href: item.resolved_url || '#',
            target: item.target,
            children: fromMenu(items, item.id),
        }));

export default function FrontLayout({ children, navigation }: LayoutProps) {
    const {
        menus = [],
        layout_settings = {},
        social_links = [],
        name,
        site,
    } = usePage<{
        menus: CmsMenu[];
        layout_settings?: Record<string, string>;
        social_links?: SocialLink[];
        name: string;
        site?: { title?: string; description?: string | null } | null;
    }>().props;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pageProps = usePage().props as any;
    const { url: currentUrl } = usePage();
    const { t } = useTexts();
    const [menuOpen, setMenuOpen] = useState(false);

    const activeItem = pageProps.article || pageProps.post || null;
    const seo = activeItem?.metadata || {};
    const siteName = site?.title || name;

    const seoTitle = seo.seo_title || activeItem?.title || '';
    // Pages without their own description use the site's (Admin → Sites)
    const seoDescription = seo.seo_description || activeItem?.excerpt || site?.description || '';
    const seoKeywords = seo.seo_keywords || '';
    const seoOgImage = seo.seo_og_image || activeItem?.featured_image || '';

    const headerMenu = menus.find((m) => m.slug === 'main' || m.slug === 'header' || m.slug === 'navigation' || m.slug === 'site-principal');
    const footerMenu = menus.find((m) => m.slug === 'footer');

    // The server sends each page's URL; the slug fallback covers older cached data
    const pageUrl = (item: { url?: string; slug: string }) => item.url ?? localePath(!item.slug || item.slug === 'home' ? '/' : '/' + item.slug);

    const navEntries: NavEntry[] = headerMenu?.items?.length
        ? fromMenu(headerMenu.items)
        : [
              { key: 'home', title: t('nav.home'), href: localePath('/'), children: [] },
              ...navigation
                  .filter((item) => item.slug !== 'home')
                  .map((item) => ({ key: item.id, title: item.title, href: pageUrl(item), children: [] })),
          ];
    const footerEntries = footerMenu?.items?.length ? fromMenu(footerMenu.items) : [];

    const path = currentUrl.split(/[?#]/)[0];
    const isActive = (href: string) => {
        if (!href || href === '#' || isExternalLink(href)) return false;
        const target = href.replace(/^https?:\/\/[^/]+/, '').split(/[?#]/)[0] || '/';
        return target === '/' || target === localePath('/') ? path === target : path === target || path.startsWith(target + '/');
    };

    // Close the mobile menu on every visit and with Escape
    useEffect(() => router.on('navigate', () => setMenuOpen(false)), []);
    useEffect(() => {
        if (!menuOpen) return;
        const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setMenuOpen(false);
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [menuOpen]);

    const logo = (src: string | undefined, className?: string) =>
        src ? <img src={src} alt={siteName} className="h-8 max-w-[200px] object-contain" /> : <BrandLockup className={className} />;

    const linkClass = (active: boolean) =>
        cn(
            'rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
            active ? 'bg-(--theme-accent-soft) text-(--theme-accent)' : 'text-(--theme-muted) hover:text-(--theme-ink)',
        );

    return (
        <div className="front-theme flex min-h-screen flex-col bg-(--theme-bg) text-(--theme-ink) transition-colors duration-200">
            <Head>
                {seoTitle && <title>{seoTitle}</title>}
                {seoDescription && <meta name="description" content={seoDescription} />}
                {seoKeywords && <meta name="keywords" content={seoKeywords} />}
                {seoTitle && <meta property="og:title" content={seoTitle} />}
                {seoDescription && <meta property="og:description" content={seoDescription} />}
                {seoOgImage && <meta property="og:image" content={seoOgImage} />}
                <meta property="og:type" content="website" />
            </Head>

            <header className="sticky top-0 z-40 w-full border-b border-(--theme-line) bg-(--theme-bg)/80 backdrop-blur-xl supports-[backdrop-filter]:bg-(--theme-bg)/70">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                    <Link
                        href={localePath('/')}
                        className="shrink-0 text-(--theme-ink) hover:opacity-85"
                        aria-label={t('nav.home_link', { name: siteName })}
                    >
                        {logo(layout_settings?.layout_header_logo)}
                    </Link>

                    <nav aria-label={t('nav.main')} className="hidden items-center gap-1 lg:flex">
                        {navEntries.map((item) =>
                            item.children.length > 0 ? (
                                <div key={item.key} className="group relative">
                                    <button
                                        type="button"
                                        aria-haspopup="true"
                                        className={cn(
                                            linkClass(item.children.some((child) => isActive(child.href))),
                                            'inline-flex items-center gap-1',
                                        )}
                                    >
                                        {item.title}
                                        <ChevronDown className="h-3.5 w-3.5 opacity-60 transition-transform duration-200 group-focus-within:rotate-180 group-hover:rotate-180" />
                                    </button>
                                    <div className="invisible absolute top-full left-0 z-50 w-56 translate-y-1 pt-2 opacity-0 transition-all duration-200 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                                        <div className="rounded-2xl border border-(--theme-line) bg-(--theme-bg) p-1.5 shadow-xl shadow-black/5">
                                            {item.children.map((child) => (
                                                <Link
                                                    key={child.key}
                                                    href={child.href}
                                                    target={child.target}
                                                    className="block rounded-xl px-3 py-2 text-sm text-(--theme-muted) transition-colors hover:bg-(--theme-surface) hover:text-(--theme-ink)"
                                                >
                                                    {child.title}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <Link
                                    key={item.key}
                                    href={item.href}
                                    target={item.target}
                                    aria-current={isActive(item.href) ? 'page' : undefined}
                                    className={linkClass(isActive(item.href))}
                                >
                                    {item.title}
                                </Link>
                            ),
                        )}
                    </nav>

                    <div className="flex items-center gap-2">
                        <LanguageSwitcher className="hidden sm:flex" linkClassName="hover:text-(--theme-accent)" />
                        <Link
                            href={localePath('/search')}
                            aria-label={t('search.title')}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-(--theme-muted) transition-colors hover:bg-(--theme-surface) hover:text-(--theme-ink)"
                        >
                            <Search className="h-4 w-4" />
                        </Link>
                        <Link
                            href="/admin"
                            className="hidden h-9 items-center gap-1.5 rounded-full bg-(--theme-accent) px-4 text-sm font-semibold text-(--theme-on-accent) shadow-(--theme-accent)/25 shadow-sm transition-colors hover:bg-(--theme-accent-strong) sm:inline-flex"
                        >
                            {t('nav.admin')}
                            <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                        <button
                            type="button"
                            onClick={() => setMenuOpen((open) => !open)}
                            aria-expanded={menuOpen}
                            aria-controls="front-mobile-menu"
                            aria-label={menuOpen ? t('nav.close_menu') : t('nav.open_menu')}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-(--theme-line) text-(--theme-ink) transition-colors hover:bg-(--theme-surface) lg:hidden"
                        >
                            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                {menuOpen && (
                    <nav
                        id="front-mobile-menu"
                        aria-label={t('nav.mobile')}
                        className="animate-in fade-in slide-in-from-top-2 max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-(--theme-line) bg-(--theme-bg) px-4 pt-3 pb-6 duration-200 sm:px-6 lg:hidden"
                    >
                        <ul className="space-y-1">
                            {navEntries.map((item) => (
                                <li key={item.key}>
                                    <Link
                                        href={item.href}
                                        target={item.target}
                                        className={cn(
                                            'block rounded-xl px-3 py-2.5 text-base font-medium',
                                            isActive(item.href) ? 'bg-(--theme-accent-soft) text-(--theme-accent)' : 'hover:bg-(--theme-surface)',
                                        )}
                                    >
                                        {item.title}
                                    </Link>
                                    {item.children.length > 0 && (
                                        <ul className="mt-1 ml-3 space-y-1 border-l border-(--theme-line) pl-3">
                                            {item.children.map((child) => (
                                                <li key={child.key}>
                                                    <Link
                                                        href={child.href}
                                                        target={child.target}
                                                        className="block rounded-lg px-3 py-2 text-sm text-(--theme-muted) hover:bg-(--theme-surface) hover:text-(--theme-ink)"
                                                    >
                                                        {child.title}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </li>
                            ))}
                        </ul>
                        <div className="mt-4 flex items-center justify-between gap-3 border-t border-(--theme-line) pt-4">
                            <LanguageSwitcher linkClassName="hover:text-(--theme-accent)" />
                            <Link
                                href="/admin"
                                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-(--theme-accent) px-5 text-sm font-semibold text-(--theme-on-accent)"
                            >
                                {t('nav.admin')}
                                <ArrowUpRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                    </nav>
                )}
            </header>

            <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">{children}</div>
            </main>

            <footer className="mt-12 border-t border-(--theme-line) bg-(--theme-surface)">
                <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-12 lg:px-8">
                    <div className="space-y-4 md:col-span-5">
                        <Link href={localePath('/')} className="inline-block text-(--theme-ink)" aria-label={t('nav.home_link', { name: siteName })}>
                            {logo(layout_settings?.layout_footer_logo)}
                        </Link>
                        {site?.description && <p className="max-w-sm text-sm leading-relaxed text-(--theme-muted)">{site.description}</p>}
                        {social_links.length > 0 && (
                            <ul className="flex flex-wrap gap-2 pt-1">
                                {social_links.map((link, index) => {
                                    const external = isExternalLink(link.url);
                                    return (
                                        <li key={index}>
                                            <a
                                                href={link.url}
                                                target={external ? '_blank' : undefined}
                                                rel={external ? 'noopener noreferrer' : undefined}
                                                aria-label={t('footer.social_link', { network: socialLinkName(link), name: siteName })}
                                                title={socialLinkName(link)}
                                                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-(--theme-line) bg-(--theme-bg) text-(--theme-muted) transition-colors hover:border-(--theme-accent) hover:text-(--theme-accent) focus-visible:ring-2 focus-visible:ring-(--theme-accent)/40 focus-visible:outline-none"
                                            >
                                                <SocialIcon network={link.network} className="h-4 w-4" />
                                            </a>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                    <div className="grid gap-8 sm:grid-cols-2 md:col-span-7 md:grid-cols-3">
                        <div className="space-y-3">
                            <h2 className="text-xs font-semibold tracking-wider text-(--theme-ink) uppercase">{t('footer.explore')}</h2>
                            <ul className="space-y-2 text-sm">
                                {navEntries.map((item) => (
                                    <li key={item.key}>
                                        <Link
                                            href={item.href}
                                            target={item.target}
                                            className="text-(--theme-muted) transition-colors hover:text-(--theme-accent)"
                                        >
                                            {item.title}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        {footerEntries.length > 0 && (
                            <div className="space-y-3">
                                <h2 className="text-xs font-semibold tracking-wider text-(--theme-ink) uppercase">{t('footer.links')}</h2>
                                <ul className="space-y-2 text-sm">
                                    {footerEntries.map((item) => (
                                        <li key={item.key}>
                                            <Link
                                                href={item.href}
                                                target={item.target}
                                                className="text-(--theme-muted) transition-colors hover:text-(--theme-accent)"
                                            >
                                                {item.title}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <div className="space-y-3">
                            <h2 className="text-xs font-semibold tracking-wider text-(--theme-ink) uppercase">{t('footer.site')}</h2>
                            <ul className="space-y-2 text-sm">
                                <li>
                                    <Link href={localePath('/blog')} className="text-(--theme-muted) transition-colors hover:text-(--theme-accent)">
                                        {t('blog.title')}
                                    </Link>
                                </li>
                                <li>
                                    <Link href={localePath('/search')} className="text-(--theme-muted) transition-colors hover:text-(--theme-accent)">
                                        {t('search.title')}
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/admin" className="text-(--theme-muted) transition-colors hover:text-(--theme-accent)">
                                        {t('nav.admin')}
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="border-t border-(--theme-line)">
                    {/* Sanitized on the server (ContentSanitizer::inline): only simple links and inline formatting */}
                    <p
                        className="mx-auto max-w-7xl px-4 py-6 text-xs text-(--theme-muted) sm:px-6 lg:px-8 [&_a]:underline [&_a]:underline-offset-2 [&_a]:transition-colors [&_a:hover]:text-(--theme-accent)"
                        dangerouslySetInnerHTML={{
                            __html:
                                (layout_settings?.layout_copyright && withYear(layout_settings.layout_copyright)) ||
                                `${escapeHtml(t('footer.copyright', { year: new Date().getFullYear(), name: 'MewCMS' }))} ${escapeHtml(t('footer.powered_by'))} <a href="https://deepsoft.lat" target="_blank" rel="noopener noreferrer">DeepSoft</a>.`,
                        }}
                    />
                </div>
            </footer>

            {/* Custom injected styles block */}
            {layout_settings?.layout_custom_css && <style dangerouslySetInnerHTML={{ __html: layout_settings.layout_custom_css }} />}
        </div>
    );
}
