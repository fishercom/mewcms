/**
 * Template Name: Standard Page
 */
import Blocks from '@/components/blocks';
import { MediaImage } from '@/components/media-image';
import { CmsArticle } from '@/types/models/cms-article';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowUpRight, Clock, Mail, MapPin, Phone } from 'lucide-react';
import { DisplayTitle, Eyebrow } from '../components/brand';
import ContactForm from '../components/contact-form';
import VelvetLayout from '../layout';

interface Product {
    name?: string;
    category?: string;
    text?: string;
    price?: string;
    image?: string;
    badge?: string;
}

interface Service {
    title?: string;
    text?: string;
    image?: string;
    price?: string;
    duration?: string;
    includes?: string;
}

interface PageMetadata {
    eyebrow?: string;
    subtitle?: string;
    products_title?: string;
    products?: Product[];
    services?: Service[];
    form_alias?: string;
    form_title?: string;
    form_text?: string;
    [key: string]: unknown;
}

interface PageProps {
    article: CmsArticle;
    navigation: Pick<CmsArticle, 'id' | 'title' | 'slug'>[];
}

const list = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

export default function Page({ article, navigation }: PageProps) {
    const m = (article.metadata || {}) as PageMetadata;
    const products = list<Product>(m.products);
    const services = list<Service>(m.services);
    const hasBody = Boolean(article.blocks?.length || article.content);
    const settings = usePage<{ layout_settings?: Record<string, string> }>().props.layout_settings ?? {};
    const contact = [
        { icon: MapPin, label: 'Visit', text: settings.layout_address },
        { icon: Clock, label: 'Opening hours', text: settings.layout_hours },
        {
            icon: Phone,
            label: 'Call',
            text: settings.layout_phone,
            href: settings.layout_phone ? `tel:${settings.layout_phone.replace(/[^+\d]/g, '')}` : '',
        },
        { icon: Mail, label: 'Write', text: settings.layout_email, href: settings.layout_email ? `mailto:${settings.layout_email}` : '' },
    ].filter((c) => c.text);

    return (
        <VelvetLayout navigation={navigation}>
            <Head title={article.title} />

            {/* Page header */}
            <section className="mx-auto grid max-w-7xl items-end gap-12 px-5 pt-16 pb-16 sm:px-8 sm:pt-24 lg:grid-cols-12">
                <div className="space-y-7 lg:col-span-7">
                    <Eyebrow>{m.eyebrow || 'Velvet Paw'}</Eyebrow>
                    <DisplayTitle as="h1" text={m.subtitle || article.title} className="text-ink text-[3.2rem] sm:text-[4.6rem]" />
                    {article.excerpt && <p className="text-stone max-w-xl text-xl leading-relaxed font-light">{article.excerpt}</p>}
                </div>
                {article.featured_image && (
                    <div className="lg:col-span-5">
                        <div className="velvet-arch mx-auto aspect-[4/5] max-w-md overflow-hidden shadow-[0_40px_80px_-40px_rgba(30,49,41,0.45)]">
                            <MediaImage
                                src={article.featured_image}
                                fallbackAlt={article.title}
                                loading="eager"
                                sizes="(max-width: 1024px) 100vw, 40vw"
                                className="h-full w-full object-cover"
                            />
                        </div>
                    </div>
                )}
            </section>

            <div className="mx-auto max-w-7xl px-5 sm:px-8">
                <div className="h-px bg-[#e2d7c5]" />
            </div>

            {/* Body */}
            {hasBody && (
                <section className="mx-auto max-w-4xl px-5 py-20 sm:px-8">
                    <Blocks blocks={article.blocks} html={article.content} className="space-y-16" textClassName="velvet-prose prose max-w-none" />
                </section>
            )}

            {/* Catalogue */}
            {products.length > 0 && (
                <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
                    {m.products_title && <DisplayTitle text={m.products_title} className="text-ink mb-12 text-4xl sm:text-5xl" />}
                    <div className="grid gap-x-7 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
                        {products.map((product, index) => (
                            <article key={index} className="group velvet-zoom">
                                <div className="bg-cream relative aspect-square overflow-hidden rounded-[1.75rem]">
                                    {product.image && (
                                        <MediaImage
                                            src={product.image}
                                            fallbackAlt={product.name}
                                            sizes="(max-width: 640px) 100vw, 33vw"
                                            className="h-full w-full object-cover"
                                        />
                                    )}
                                    {product.badge && (
                                        <span className="bg-forest text-ivory absolute top-5 left-5 rounded-full px-4 py-1.5 text-[0.62rem] font-semibold tracking-[0.2em] uppercase">
                                            {product.badge}
                                        </span>
                                    )}
                                </div>
                                <div className="mt-6 px-1">
                                    {product.category && (
                                        <p className="text-brass text-[0.68rem] font-semibold tracking-[0.25em] uppercase">{product.category}</p>
                                    )}
                                    <div className="mt-2 flex items-baseline justify-between gap-4">
                                        <h3 className="font-display text-ink text-[1.75rem] leading-tight">{product.name}</h3>
                                        {product.price && <span className="text-forest shrink-0 font-medium">{product.price}</span>}
                                    </div>
                                    {product.text && <p className="text-stone mt-2 leading-relaxed">{product.text}</p>}
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            )}

            {/* Services */}
            {services.length > 0 && (
                <section className="mx-auto max-w-7xl space-y-24 px-5 pb-28 sm:px-8">
                    {services.map((service, index) => (
                        <article key={index} className="grid items-center gap-12 lg:grid-cols-2">
                            <div className={`velvet-zoom overflow-hidden rounded-[2rem] ${index % 2 ? 'lg:order-2' : ''}`}>
                                {service.image && (
                                    <MediaImage
                                        src={service.image}
                                        fallbackAlt={service.title}
                                        sizes="(max-width: 1024px) 100vw, 50vw"
                                        className="aspect-[5/4] h-full w-full object-cover"
                                    />
                                )}
                            </div>
                            <div className="space-y-6 lg:px-6">
                                <p className="font-display text-brass text-6xl italic">{String(index + 1).padStart(2, '0')}</p>
                                <h2 className="font-display text-ink text-[2.8rem] leading-tight">{service.title}</h2>
                                {service.text && <p className="text-stone text-lg leading-relaxed font-light">{service.text}</p>}
                                {service.includes && (
                                    <ul className="grid gap-2.5 sm:grid-cols-2">
                                        {service.includes
                                            .split('\n')
                                            .filter((line) => line.trim())
                                            .map((line) => (
                                                <li key={line} className="text-ink/80 flex items-start gap-2.5 text-[0.95rem]">
                                                    <span className="bg-brass mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                                                    {line}
                                                </li>
                                            ))}
                                    </ul>
                                )}
                                {(service.price || service.duration) && (
                                    <div className="flex flex-wrap items-center gap-6 border-t border-[#e2d7c5] pt-6">
                                        {service.price && <span className="font-display text-forest text-3xl">{service.price}</span>}
                                        {service.duration && (
                                            <span className="text-stone inline-flex items-center gap-2 text-sm tracking-wide">
                                                <Clock className="h-4 w-4" strokeWidth={1.6} />
                                                {service.duration}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </article>
                    ))}
                </section>
            )}

            {/* Contact form, with the boutique's details beside it */}
            {m.form_alias && (
                <section className="mx-auto max-w-7xl px-5 pb-28 sm:px-8">
                    <div className="grid gap-14 lg:grid-cols-12">
                        <div className="space-y-8 lg:col-span-5">
                            {m.form_title && <DisplayTitle text={m.form_title} className="text-ink text-4xl sm:text-5xl" />}
                            {m.form_text && <p className="text-stone text-lg leading-relaxed font-light">{m.form_text}</p>}
                            <ul className="space-y-6">
                                {contact.map(({ icon: Icon, label, text, href }) => (
                                    <li key={label} className="flex gap-4">
                                        <span className="bg-cream text-forest inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full">
                                            <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} aria-hidden="true" />
                                        </span>
                                        <span>
                                            <span className="text-brass block text-[0.68rem] font-semibold tracking-[0.25em] uppercase">{label}</span>
                                            {href ? (
                                                <a href={href} className="text-ink hover:text-forest mt-1 block transition-colors">
                                                    {text}
                                                </a>
                                            ) : (
                                                <span className="text-ink mt-1 block whitespace-pre-line">{text}</span>
                                            )}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-paper rounded-[2rem] border border-[#e8dece] p-7 sm:p-10 lg:col-span-7">
                            <ContactForm alias={m.form_alias} />
                        </div>
                    </div>
                </section>
            )}

            {/* Sub pages */}
            {article.children?.length ? (
                <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {article.children.map((child) => (
                            <Link
                                key={child.id}
                                href={child.url ?? '/' + child.slug}
                                className="group bg-paper hover:border-brass flex items-center justify-between rounded-[1.5rem] border border-[#e2d7c5] p-7 transition-colors"
                            >
                                <span className="font-display text-ink text-2xl">{child.title}</span>
                                <ArrowUpRight className="text-brass h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            </Link>
                        ))}
                    </div>
                </section>
            ) : null}
        </VelvetLayout>
    );
}
