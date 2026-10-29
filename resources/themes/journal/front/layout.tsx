import { isExternalLink, SocialIcon, socialLinkName, type SocialLink } from '@/components/social-icon';
import { cn } from '@/lib/utils';
import { CmsArticle } from '@/types/models/cms-article';
import { CmsMenu } from '@/types/models/cms-menu';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowUpRight, Leaf, Menu, Search, X } from 'lucide-react';
import React, { useState } from 'react';

interface LayoutProps {
    children: React.ReactNode;
    navigation?: Pick<CmsArticle, 'id' | 'title' | 'slug' | 'url'>[];
}

type MenuItem = NonNullable<CmsMenu['items']>[number];

/** A menu link: the shop (another site) opens as a normal link, pages of this site through Inertia */
function NavLink({ item, className, onClick }: { item: MenuItem; className?: string; onClick?: () => void }) {
    const href = item.resolved_url || '#';
    if (isExternalLink(href)) {
        return (
            <a href={href} target={item.target || undefined} className={className} onClick={onClick}>
                {item.title}
            </a>
        );
    }

    return (
        <Link href={href} target={item.target} className={className} onClick={onClick}>
            {item.title}
        </Link>
    );
}

/** Masthead wordmark: a leaf and the site name in Fraunces */
export function JournalBrand({ name, tagline }: { name: string; tagline?: string }) {
    return (
        <span className="inline-flex flex-col items-center leading-none">
            <span className="font-display text-ink flex items-center gap-2.5 text-[2rem] tracking-tight sm:text-[2.6rem]">
                <Leaf className="text-sage h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.4} aria-hidden="true" />
                {name}
            </span>
            {tagline && <span className="text-graphite mt-2 text-[0.62rem] font-semibold tracking-[0.34em] uppercase">{tagline}</span>}
        </span>
    );
}

export default function JournalLayout({ children }: LayoutProps) {
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
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pageProps = usePage().props as any;
    const activeItem = pageProps.article || pageProps.post || null;
    const seo = activeItem?.metadata || {};
    const seoTitle = seo.seo_title || activeItem?.title || '';
    const seoDescription = seo.seo_description || activeItem?.excerpt || site?.description || '';
    const seoOgImage = seo.seo_og_image || activeItem?.featured_image || '';

    const brandName = site?.title || name;
    const settings = layout_settings as Record<string, string>;
    const items = (menus.find((m) => m.slug === 'main')?.items ?? []).filter((i) => i.parent_id === null);
    const footerItems = menus.find((m) => m.slug === 'footer')?.items ?? [];
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    const submitSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.get('/search', { q: query.trim() });
        }
    };

    return (
        <div className="front-theme min-h-screen">
            <Head>
                {seoTitle && <title>{seoTitle}</title>}
                {seoDescription && <meta name="description" content={seoDescription} />}
                {seoTitle && <meta property="og:title" content={seoTitle} />}
                {seoDescription && <meta property="og:description" content={seoDescription} />}
                {seoOgImage && <meta property="og:image" content={seoOgImage} />}
                <meta property="og:type" content={pageProps.post ? 'article' : 'website'} />
            </Head>

            {/* Top strip: date and the link back to the shop */}
            <div className="border-line text-graphite border-b">
                <div className="mx-auto flex h-10 max-w-7xl items-center justify-between gap-4 px-5 text-[0.72rem] tracking-wide sm:px-8">
                    <span className="hidden sm:inline">{today}</span>
                    {settings.layout_announcement && <span className="truncate">{settings.layout_announcement}</span>}
                    {settings.layout_cta_label && settings.layout_cta_url && (
                        <a
                            href={settings.layout_cta_url}
                            className="text-sage-deep hover:text-terracotta inline-flex shrink-0 items-center gap-1 font-semibold transition-colors"
                        >
                            {settings.layout_cta_label}
                            <ArrowUpRight className="h-3.5 w-3.5" />
                        </a>
                    )}
                </div>
            </div>

            {/* Masthead */}
            <header className="border-ink/80 border-b">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-7 sm:px-8 sm:py-9">
                    <button
                        type="button"
                        onClick={() => setOpen(true)}
                        className="border-line text-ink hover:border-sage inline-flex h-11 w-11 items-center justify-center rounded-full border transition-colors md:invisible"
                        aria-label="Open menu"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <Link href="/" aria-label={`${brandName} — home`} className="text-center">
                        {settings.layout_header_logo ? (
                            <img src={settings.layout_header_logo} alt={brandName} className="h-12 max-w-[260px] object-contain" />
                        ) : (
                            <JournalBrand name={brandName} tagline={settings.layout_tagline} />
                        )}
                    </Link>
                    <Link
                        href="/search"
                        className="border-line text-ink hover:border-sage inline-flex h-11 w-11 items-center justify-center rounded-full border transition-colors"
                        aria-label="Search"
                    >
                        <Search className="h-[18px] w-[18px]" />
                    </Link>
                </div>
                <nav className="border-line hidden border-t md:block" aria-label="Main">
                    <ul className="mx-auto flex max-w-7xl items-center justify-center gap-10 px-8">
                        {items.map((item) => (
                            <li key={item.id}>
                                <NavLink
                                    item={item}
                                    className="text-ink/75 hover:text-terracotta block py-4 text-[0.78rem] font-semibold tracking-[0.18em] uppercase transition-colors"
                                />
                            </li>
                        ))}
                    </ul>
                </nav>
            </header>

            {/* Mobile menu */}
            <div
                className={cn(
                    'bg-ink/30 fixed inset-0 z-50 backdrop-blur-sm transition-opacity md:hidden',
                    open ? 'opacity-100' : 'pointer-events-none opacity-0',
                )}
                onClick={() => setOpen(false)}
                aria-hidden={!open}
            >
                <div
                    className={cn(
                        'bg-paper flex h-full w-[min(22rem,88vw)] flex-col p-7 transition-transform duration-300',
                        open ? 'translate-x-0' : '-translate-x-full',
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between">
                        <span className="font-display text-ink text-2xl">{brandName}</span>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="border-line text-ink inline-flex h-10 w-10 items-center justify-center rounded-full border"
                            aria-label="Close menu"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <form onSubmit={submitSearch} className="mt-8">
                        <label className="border-line bg-sheet flex items-center gap-2 rounded-full border px-4">
                            <Search className="text-graphite h-4 w-4" />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search the journal"
                                className="placeholder:text-graphite/70 h-11 w-full bg-transparent text-sm outline-none"
                            />
                        </label>
                    </form>
                    <nav className="mt-6 flex flex-col" aria-label="Mobile">
                        {items.map((item) => (
                            <NavLink
                                key={item.id}
                                item={item}
                                onClick={() => setOpen(false)}
                                className="font-display text-ink hover:text-terracotta border-line border-b py-3.5 text-[1.6rem] transition-colors"
                            />
                        ))}
                    </nav>
                </div>
            </div>

            <main>{children}</main>

            <footer className="bg-sheet border-ink/80 mt-24 border-t">
                <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 md:grid-cols-12">
                    <div className="space-y-5 md:col-span-6">
                        <span className="font-display text-ink flex items-center gap-2.5 text-3xl">
                            <Leaf className="text-sage h-6 w-6" strokeWidth={1.4} aria-hidden="true" />
                            {brandName}
                        </span>
                        {site?.description && <p className="font-read text-graphite max-w-md text-lg leading-relaxed italic">{site.description}</p>}
                        {social_links.length > 0 && (
                            <ul className="flex flex-wrap gap-2">
                                {social_links.map((link, index) => {
                                    const external = isExternalLink(link.url);
                                    return (
                                        <li key={index}>
                                            <a
                                                href={link.url}
                                                target={external ? '_blank' : undefined}
                                                rel={external ? 'noopener noreferrer' : undefined}
                                                aria-label={socialLinkName(link)}
                                                title={socialLinkName(link)}
                                                className="border-line text-graphite hover:border-sage hover:text-sage-deep inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors"
                                            >
                                                <SocialIcon network={link.network} className="h-4 w-4" />
                                            </a>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                    {footerItems.length > 0 && (
                        <div className="md:col-span-3">
                            <h2 className="font-ui text-terracotta mb-5 text-[0.7rem] font-semibold tracking-[0.28em] uppercase">The journal</h2>
                            <ul className="space-y-3">
                                {footerItems.map((item) => (
                                    <li key={item.id}>
                                        <NavLink item={item} className="text-ink/80 hover:text-sage-deep transition-colors" />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {settings.layout_cta_url && (
                        <div className="md:col-span-3">
                            <h2 className="font-ui text-terracotta mb-5 text-[0.7rem] font-semibold tracking-[0.28em] uppercase">
                                From the makers of
                            </h2>
                            <a href={settings.layout_cta_url} className="group block">
                                <span className="font-display text-ink group-hover:text-sage-deep text-2xl transition-colors">
                                    {settings.layout_shop_name || 'The boutique'}
                                </span>
                                <span className="text-graphite mt-2 block text-sm leading-relaxed">{settings.layout_shop_text}</span>
                                <span className="text-sage-deep mt-3 inline-flex items-center gap-1 text-sm font-semibold">
                                    Visit the shop <ArrowUpRight className="h-4 w-4" />
                                </span>
                            </a>
                        </div>
                    )}
                </div>
                <div className="border-line border-t">
                    {/* Sanitized on the server (ContentSanitizer::inline): only simple links and inline formatting */}
                    <p
                        className="text-graphite [&_a:hover]:text-sage-deep mx-auto max-w-7xl px-5 py-6 text-xs sm:px-8 [&_a]:underline [&_a]:underline-offset-2"
                        dangerouslySetInnerHTML={{ __html: settings.layout_copyright || `© ${new Date().getFullYear()} ${brandName}.` }}
                    />
                </div>
            </footer>

            {settings.layout_custom_css && <style dangerouslySetInnerHTML={{ __html: settings.layout_custom_css }} />}
        </div>
    );
}
