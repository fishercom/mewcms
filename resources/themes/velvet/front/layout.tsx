import { isExternalLink, SocialIcon, socialLinkName, type SocialLink } from '@/components/social-icon';
import { cn } from '@/lib/utils';
import { CmsArticle } from '@/types/models/cms-article';
import { CmsMenu } from '@/types/models/cms-menu';
import { Head, Link, usePage } from '@inertiajs/react';
import { ChevronDown, Clock, Mail, MapPin, Menu, Phone, X } from 'lucide-react';
import React, { useState } from 'react';
import { VelvetBrand } from './components/brand';

interface LayoutProps {
    children: React.ReactNode;
    navigation?: Pick<CmsArticle, 'id' | 'title' | 'slug' | 'url'>[];
    /** The page starts with a full-bleed image: the header floats over it */
    overlay?: boolean;
}

type MenuItem = NonNullable<CmsMenu['items']>[number];

/** A menu link: other sites (the journal) open as normal links, pages of this site through Inertia */
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

export default function VelvetLayout({ children, overlay = false }: LayoutProps) {
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pageProps = usePage().props as any;
    const activeItem = pageProps.article || pageProps.post || null;
    const seo = activeItem?.metadata || {};
    const seoTitle = seo.seo_title || activeItem?.title || '';
    const seoDescription = seo.seo_description || activeItem?.excerpt || site?.description || '';
    const seoOgImage = seo.seo_og_image || activeItem?.featured_image || '';

    // The wordmark is the site's title (Admin → Sites)
    const brandName = site?.title || name;
    const items = menus.find((m) => m.slug === 'main')?.items ?? [];
    const parents = items.filter((i) => i.parent_id === null);
    const childrenOf = (id: number) => items.filter((i) => i.parent_id === id);
    const footerItems = menus.find((m) => m.slug === 'footer')?.items ?? [];

    const settings = layout_settings as Record<string, string>;
    const announcement = settings.layout_announcement;
    const contact = [
        { icon: MapPin, text: settings.layout_address },
        { icon: Clock, text: settings.layout_hours },
        { icon: Phone, text: settings.layout_phone, href: settings.layout_phone ? `tel:${settings.layout_phone.replace(/[^+\d]/g, '')}` : '' },
        { icon: Mail, text: settings.layout_email, href: settings.layout_email ? `mailto:${settings.layout_email}` : '' },
    ].filter((c) => c.text);

    const linkTone = overlay ? 'text-ivory/90 hover:text-white' : 'text-ink/80 hover:text-forest';

    return (
        <div className="front-theme min-h-screen">
            <Head>
                {seoTitle && <title>{seoTitle}</title>}
                {seoDescription && <meta name="description" content={seoDescription} />}
                {seoTitle && <meta property="og:title" content={seoTitle} />}
                {seoDescription && <meta property="og:description" content={seoDescription} />}
                {seoOgImage && <meta property="og:image" content={seoOgImage} />}
                <meta property="og:type" content="website" />
            </Head>

            {announcement && (
                <div className="bg-forest-deep text-ivory/85 px-4 py-2.5 text-center text-[0.7rem] font-medium tracking-[0.22em] uppercase">
                    {announcement}
                </div>
            )}

            <header
                className={cn(
                    'z-40 w-full',
                    overlay ? 'absolute inset-x-0 top-auto' : 'bg-ivory/95 sticky top-0 border-b border-[#e2d7c5] backdrop-blur',
                )}
            >
                <div className="mx-auto flex h-24 max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
                    <Link href="/" aria-label={`${brandName} — home`} className="shrink-0">
                        {settings.layout_header_logo ? (
                            <img src={settings.layout_header_logo} alt={brandName} className="h-10 max-w-[220px] object-contain" />
                        ) : (
                            <VelvetBrand name={brandName} tagline="Pet Boutique" light={overlay} />
                        )}
                    </Link>

                    <nav className="hidden items-center gap-9 lg:flex" aria-label="Main">
                        {parents.map((item) => {
                            const children = childrenOf(item.id);
                            if (children.length === 0) {
                                return (
                                    <NavLink
                                        key={item.id}
                                        item={item}
                                        className={cn('text-[0.82rem] font-medium tracking-[0.12em] uppercase transition-colors', linkTone)}
                                    />
                                );
                            }

                            return (
                                <div key={item.id} className="group relative py-3">
                                    <button
                                        className={cn(
                                            'flex items-center gap-1.5 text-[0.82rem] font-medium tracking-[0.12em] uppercase transition-colors',
                                            linkTone,
                                        )}
                                    >
                                        {item.title}
                                        <ChevronDown className="h-3.5 w-3.5 opacity-60 transition-transform group-hover:rotate-180" />
                                    </button>
                                    <div className="bg-paper pointer-events-none absolute top-full left-1/2 z-50 w-56 -translate-x-1/2 translate-y-2 rounded-2xl border border-[#e2d7c5] p-2 opacity-0 shadow-[0_20px_50px_-20px_rgba(30,49,41,0.35)] transition-all duration-300 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
                                        {children.map((child) => (
                                            <NavLink
                                                key={child.id}
                                                item={child}
                                                className="text-ink/80 hover:bg-cream hover:text-forest block rounded-xl px-4 py-2.5 text-sm transition-colors"
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </nav>

                    <div className="flex items-center gap-3">
                        {settings.layout_cta_label && settings.layout_cta_url && (
                            <a
                                href={settings.layout_cta_url}
                                className={cn(
                                    'hidden rounded-full px-6 py-3 text-[0.72rem] font-semibold tracking-[0.18em] uppercase transition-colors sm:inline-flex',
                                    overlay ? 'bg-ivory text-forest-deep hover:bg-white' : 'bg-forest text-ivory hover:bg-forest-deep',
                                )}
                            >
                                {settings.layout_cta_label}
                            </a>
                        )}
                        <button
                            type="button"
                            onClick={() => setOpen(true)}
                            className={cn(
                                'inline-flex h-11 w-11 items-center justify-center rounded-full border lg:hidden',
                                overlay ? 'border-ivory/40 text-ivory' : 'text-ink border-[#e2d7c5]',
                            )}
                            aria-label="Open menu"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile menu */}
            <div
                className={cn(
                    'bg-forest-deep/40 fixed inset-0 z-50 backdrop-blur-sm transition-opacity lg:hidden',
                    open ? 'opacity-100' : 'pointer-events-none opacity-0',
                )}
                onClick={() => setOpen(false)}
                aria-hidden={!open}
            >
                <div
                    className={cn(
                        'bg-ivory ml-auto flex h-full w-[min(22rem,88vw)] flex-col p-7 transition-transform duration-300',
                        open ? 'translate-x-0' : 'translate-x-full',
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between">
                        <VelvetBrand name={brandName} />
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="text-ink inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#e2d7c5]"
                            aria-label="Close menu"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <nav className="mt-10 flex flex-col" aria-label="Mobile">
                        {items.map((item) => (
                            <NavLink
                                key={item.id}
                                item={item}
                                onClick={() => setOpen(false)}
                                className={cn(
                                    'font-display text-ink hover:text-forest border-b border-[#e2d7c5] py-3.5 transition-colors',
                                    item.parent_id ? 'pl-5 text-xl' : 'text-[1.7rem]',
                                )}
                            />
                        ))}
                    </nav>
                    {settings.layout_cta_label && settings.layout_cta_url && (
                        <a
                            href={settings.layout_cta_url}
                            className="bg-forest text-ivory mt-auto rounded-full px-6 py-4 text-center text-xs font-semibold tracking-[0.18em] uppercase"
                        >
                            {settings.layout_cta_label}
                        </a>
                    )}
                </div>
            </div>

            <main>{children}</main>

            <footer className="bg-forest-deep text-ivory/75 relative overflow-hidden">
                <div className="mx-auto grid max-w-7xl gap-14 px-5 pt-20 pb-14 sm:px-8 md:grid-cols-12">
                    <div className="space-y-6 md:col-span-5">
                        {settings.layout_footer_logo ? (
                            <img src={settings.layout_footer_logo} alt={brandName} className="h-10 max-w-[220px] object-contain" />
                        ) : (
                            <VelvetBrand name={brandName} tagline="Pet Boutique" light />
                        )}
                        {site?.description && <p className="font-display text-ivory/85 max-w-sm text-2xl leading-snug italic">{site.description}</p>}
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
                                                className="border-ivory/20 text-ivory/80 hover:border-brass-light hover:text-brass-light inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors"
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
                            <h2 className="text-brass-light font-body mb-5 text-[0.7rem] font-medium tracking-[0.3em] uppercase">Explore</h2>
                            <ul className="space-y-3">
                                {footerItems.map((item) => (
                                    <li key={item.id}>
                                        <NavLink item={item} className="hover:text-ivory text-[0.95rem] transition-colors" />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {contact.length > 0 && (
                        <div className="md:col-span-4">
                            <h2 className="text-brass-light font-body mb-5 text-[0.7rem] font-medium tracking-[0.3em] uppercase">
                                Visit the boutique
                            </h2>
                            <ul className="space-y-4">
                                {contact.map(({ icon: Icon, text, href }) => (
                                    <li key={text} className="flex gap-3 text-[0.95rem] leading-relaxed">
                                        <Icon className="text-brass-light mt-1 h-4 w-4 shrink-0" strokeWidth={1.6} aria-hidden="true" />
                                        {href ? (
                                            <a href={href} className="hover:text-ivory transition-colors">
                                                {text}
                                            </a>
                                        ) : (
                                            <span className="whitespace-pre-line">{text}</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="border-ivory/10 border-t">
                    {/* Sanitized on the server (ContentSanitizer::inline): only simple links and inline formatting */}
                    <p
                        className="text-ivory/50 [&_a:hover]:text-ivory mx-auto max-w-7xl px-5 py-6 text-xs tracking-wide sm:px-8 [&_a]:underline [&_a]:underline-offset-2"
                        dangerouslySetInnerHTML={{ __html: settings.layout_copyright || `© ${new Date().getFullYear()} ${brandName}.` }}
                    />
                </div>

                <span
                    className="font-display text-ivory/[0.035] pointer-events-none absolute -right-6 -bottom-16 text-[16rem] leading-none italic select-none"
                    aria-hidden="true"
                >
                    Paw
                </span>
            </footer>

            {settings.layout_custom_css && <style dangerouslySetInnerHTML={{ __html: settings.layout_custom_css }} />}
        </div>
    );
}
