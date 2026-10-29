/**
 * Template Name: Home Page
 * Unique: true
 */
import { BLOCK_ICONS } from '@/blocks/icons';
import Blocks from '@/components/blocks';
import { MediaImage } from '@/components/media-image';
import { isExternalLink } from '@/components/social-icon';
import { CmsArticle } from '@/types/models/cms-article';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, ArrowUpRight, Bath, Bone, Cat, Dog, PawPrint, Quote, Scissors, Sparkles, Stethoscope, type LucideIcon } from 'lucide-react';
import { DisplayTitle, Eyebrow } from '../components/brand';
import VelvetLayout from '../layout';

/** Icons for the services: the editor's icon names plus a few pet ones */
const ICONS: Record<string, LucideIcon> = {
    ...BLOCK_ICONS,
    'paw-print': PawPrint,
    scissors: Scissors,
    bone: Bone,
    dog: Dog,
    cat: Cat,
    bath: Bath,
    stethoscope: Stethoscope,
};

interface Card {
    title?: string;
    text?: string;
    image?: string;
    url?: string;
    label?: string;
    icon?: string;
    price?: string;
}

interface Testimonial {
    quote?: string;
    author?: string;
    pet?: string;
}

interface HomeMetadata {
    hero_eyebrow?: string;
    hero_title?: string;
    hero_text?: string;
    hero_image?: string;
    hero_button_label?: string;
    hero_button_url?: string;
    hero_secondary_label?: string;
    hero_secondary_url?: string;
    hero_note?: string;
    categories_eyebrow?: string;
    categories_title?: string;
    categories?: Card[];
    story_eyebrow?: string;
    story_title?: string;
    story_text?: string;
    story_image?: string;
    story_image_small?: string;
    story_button_label?: string;
    story_button_url?: string;
    collections_eyebrow?: string;
    collections_title?: string;
    collections_text?: string;
    collections?: Card[];
    services_eyebrow?: string;
    services_title?: string;
    services_text?: string;
    services?: Card[];
    testimonials?: Testimonial[];
    gallery_title?: string;
    gallery_handle?: string;
    gallery?: Card[];
    journal_eyebrow?: string;
    journal_title?: string;
    journal_text?: string;
    journal_url?: string;
    journal_items?: Card[];
    cta_title?: string;
    cta_text?: string;
    cta_image?: string;
    cta_button_label?: string;
    cta_button_url?: string;
}

interface HomeProps {
    article: CmsArticle;
    navigation: Pick<CmsArticle, 'id' | 'title' | 'slug'>[];
}

const list = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

/** Internal links through Inertia, other sites as plain links */
function SmartLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
    return isExternalLink(href) ? (
        <a href={href} className={className}>
            {children}
        </a>
    ) : (
        <Link href={href} className={className}>
            {children}
        </Link>
    );
}

export default function Home({ article, navigation }: HomeProps) {
    const m = (article.metadata || {}) as HomeMetadata;
    const categories = list<Card>(m.categories);
    const collections = list<Card>(m.collections);
    const services = list<Card>(m.services);
    const testimonials = list<Testimonial>(m.testimonials);
    const gallery = list<Card>(m.gallery);
    const journal = list<Card>(m.journal_items);

    return (
        <VelvetLayout navigation={navigation} overlay={Boolean(m.hero_image)}>
            <Head title={article.title} />

            {/* Hero */}
            <section className="bg-forest-deep relative isolate flex min-h-[92vh] items-end overflow-hidden">
                {m.hero_image && (
                    <>
                        <MediaImage
                            src={m.hero_image}
                            fallbackAlt=""
                            loading="eager"
                            sizes="100vw"
                            className="absolute inset-0 -z-20 h-full w-full object-cover object-[center_35%]"
                        />
                        <div
                            className="absolute inset-0 -z-10 bg-gradient-to-r from-[#14221c]/85 via-[#14221c]/45 to-transparent"
                            aria-hidden="true"
                        />
                        <div
                            className="absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-gradient-to-t from-[#14221c]/60 to-transparent"
                            aria-hidden="true"
                        />
                    </>
                )}
                <div className="mx-auto w-full max-w-7xl px-5 pt-40 pb-20 sm:px-8 sm:pb-28">
                    <div className="animate-in fade-in slide-in-from-bottom-6 max-w-2xl space-y-7 duration-1000">
                        {m.hero_eyebrow && <Eyebrow light>{m.hero_eyebrow}</Eyebrow>}
                        <DisplayTitle as="h1" text={m.hero_title || article.title} className="text-ivory text-[3.4rem] sm:text-[5.2rem]" />
                        {m.hero_text && <p className="text-ivory/80 max-w-xl text-lg leading-relaxed font-light">{m.hero_text}</p>}
                        <div className="flex flex-wrap items-center gap-4 pt-2">
                            {m.hero_button_label && m.hero_button_url && (
                                <SmartLink
                                    href={m.hero_button_url}
                                    className="bg-ivory text-forest-deep hover:bg-brass-light group inline-flex items-center gap-3 rounded-full px-8 py-4 text-xs font-semibold tracking-[0.2em] uppercase transition-colors"
                                >
                                    {m.hero_button_label}
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </SmartLink>
                            )}
                            {m.hero_secondary_label && m.hero_secondary_url && (
                                <SmartLink
                                    href={m.hero_secondary_url}
                                    className="text-ivory border-ivory/40 hover:border-ivory inline-flex items-center gap-2 border-b pb-1 text-xs font-semibold tracking-[0.2em] uppercase transition-colors"
                                >
                                    {m.hero_secondary_label}
                                </SmartLink>
                            )}
                        </div>
                    </div>
                </div>
                {m.hero_note && (
                    <div className="border-ivory/25 bg-ivory/10 text-ivory absolute right-8 bottom-10 hidden h-36 w-36 flex-col items-center justify-center rounded-full border text-center backdrop-blur-md lg:flex">
                        <PawPrint className="text-brass-light mb-1.5 h-5 w-5" strokeWidth={1.5} />
                        <span className="font-display px-4 text-lg leading-tight italic">{m.hero_note}</span>
                    </div>
                )}
            </section>

            {/* Shop by pet */}
            {categories.length > 0 && (
                <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
                    <div className="mb-14 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
                        <div className="space-y-5">
                            {m.categories_eyebrow && <Eyebrow>{m.categories_eyebrow}</Eyebrow>}
                            {m.categories_title && <DisplayTitle text={m.categories_title} className="text-ink text-5xl sm:text-6xl" />}
                        </div>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {categories.map((card, index) => (
                            <SmartLink key={index} href={card.url || '#'} className="group velvet-zoom block">
                                <div className="velvet-arch bg-cream relative aspect-[3/4] overflow-hidden">
                                    {card.image && (
                                        <MediaImage
                                            src={card.image}
                                            fallbackAlt={card.title}
                                            sizes="(max-width: 640px) 100vw, 25vw"
                                            className="h-full w-full object-cover"
                                        />
                                    )}
                                </div>
                                <div className="mt-5 flex items-start justify-between gap-3">
                                    <div>
                                        <h3 className="font-display text-ink text-[1.9rem] leading-none">{card.title}</h3>
                                        {card.text && <p className="text-stone mt-2 text-sm leading-relaxed">{card.text}</p>}
                                    </div>
                                    <span className="text-forest group-hover:bg-forest group-hover:text-ivory mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#d9ccb7] transition-colors">
                                        <ArrowUpRight className="h-4 w-4" />
                                    </span>
                                </div>
                            </SmartLink>
                        ))}
                    </div>
                </section>
            )}

            {/* Our story */}
            {m.story_title && (
                <section className="bg-paper">
                    <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 py-24 sm:px-8 sm:py-32 lg:grid-cols-2">
                        <div className="relative mx-auto w-full max-w-lg lg:mx-0">
                            {m.story_image && (
                                <div className="velvet-arch aspect-[4/5] overflow-hidden shadow-[0_40px_80px_-40px_rgba(30,49,41,0.45)]">
                                    <MediaImage
                                        src={m.story_image}
                                        fallbackAlt=""
                                        sizes="(max-width: 1024px) 100vw, 40vw"
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            )}
                            {m.story_image_small && (
                                <div className="border-paper absolute -right-4 -bottom-10 hidden w-44 overflow-hidden rounded-full border-[6px] shadow-xl sm:block lg:-right-14">
                                    <MediaImage
                                        src={m.story_image_small}
                                        fallbackAlt=""
                                        sizes="180px"
                                        className="aspect-square w-full object-cover"
                                    />
                                </div>
                            )}
                        </div>
                        <div className="space-y-7">
                            {m.story_eyebrow && <Eyebrow>{m.story_eyebrow}</Eyebrow>}
                            <DisplayTitle text={m.story_title} className="text-ink text-5xl sm:text-[3.6rem]" />
                            {m.story_text && <p className="text-stone text-lg leading-[1.85] font-light whitespace-pre-line">{m.story_text}</p>}
                            {m.story_button_label && m.story_button_url && (
                                <SmartLink
                                    href={m.story_button_url}
                                    className="text-forest border-brass inline-flex items-center gap-2 border-b pb-1 text-xs font-semibold tracking-[0.2em] uppercase"
                                >
                                    {m.story_button_label}
                                    <ArrowRight className="h-4 w-4" />
                                </SmartLink>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* Curated collections */}
            {collections.length > 0 && (
                <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
                    <div className="mx-auto mb-16 max-w-2xl space-y-5 text-center">
                        {m.collections_eyebrow && <Eyebrow className="justify-center">{m.collections_eyebrow}</Eyebrow>}
                        {m.collections_title && <DisplayTitle text={m.collections_title} className="text-ink text-5xl sm:text-6xl" />}
                        {m.collections_text && <p className="text-stone text-lg leading-relaxed font-light">{m.collections_text}</p>}
                    </div>
                    <div className="grid gap-x-8 gap-y-14 md:grid-cols-3">
                        {collections.map((card, index) => (
                            <SmartLink
                                key={index}
                                href={card.url || '#'}
                                className={`group velvet-zoom block ${index % 3 === 1 ? 'md:translate-y-14' : ''}`}
                            >
                                <div className="bg-cream relative aspect-[4/5] overflow-hidden rounded-[1.75rem]">
                                    {card.image && (
                                        <MediaImage
                                            src={card.image}
                                            fallbackAlt={card.title}
                                            sizes="(max-width: 768px) 100vw, 33vw"
                                            className="h-full w-full object-cover"
                                        />
                                    )}
                                    {card.label && (
                                        <span className="bg-ivory/90 text-forest absolute top-5 left-5 rounded-full px-4 py-1.5 text-[0.65rem] font-semibold tracking-[0.2em] uppercase backdrop-blur">
                                            {card.label}
                                        </span>
                                    )}
                                </div>
                                <div className="mt-6 space-y-2 px-1">
                                    <div className="flex items-baseline justify-between gap-4">
                                        <h3 className="font-display text-ink group-hover:text-forest text-[1.85rem] leading-tight transition-colors">
                                            {card.title}
                                        </h3>
                                        {card.price && <span className="text-brass shrink-0 text-sm font-medium tracking-wide">{card.price}</span>}
                                    </div>
                                    {card.text && <p className="text-stone text-[0.95rem] leading-relaxed">{card.text}</p>}
                                </div>
                            </SmartLink>
                        ))}
                    </div>
                </section>
            )}

            {/* Services */}
            {services.length > 0 && (
                <section className="bg-forest text-ivory relative overflow-hidden">
                    <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
                        <div className="grid gap-16 lg:grid-cols-12">
                            <div className="space-y-6 lg:col-span-4">
                                {m.services_eyebrow && <Eyebrow light>{m.services_eyebrow}</Eyebrow>}
                                {m.services_title && <DisplayTitle text={m.services_title} className="text-ivory text-5xl" />}
                                {m.services_text && <p className="text-ivory/70 text-lg leading-relaxed font-light">{m.services_text}</p>}
                            </div>
                            <div className="grid gap-px overflow-hidden rounded-[1.75rem] bg-white/10 sm:grid-cols-2 lg:col-span-8">
                                {services.map((card, index) => {
                                    const Icon = ICONS[card.icon ?? ''] ?? Sparkles;
                                    const body = (
                                        <>
                                            <div className="flex items-start justify-between">
                                                <span className="border-brass-light/40 text-brass-light inline-flex h-14 w-14 items-center justify-center rounded-full border">
                                                    <Icon className="h-6 w-6" strokeWidth={1.4} aria-hidden="true" />
                                                </span>
                                                {card.price && <span className="text-ivory/60 text-xs tracking-[0.2em] uppercase">{card.price}</span>}
                                            </div>
                                            <h3 className="font-display text-ivory mt-8 text-[1.9rem] leading-tight">{card.title}</h3>
                                            {card.text && <p className="text-ivory/65 mt-3 leading-relaxed font-light">{card.text}</p>}
                                        </>
                                    );
                                    return card.url ? (
                                        <SmartLink key={index} href={card.url} className="bg-forest hover:bg-forest-deep block p-9 transition-colors">
                                            {body}
                                        </SmartLink>
                                    ) : (
                                        <div key={index} className="bg-forest p-9">
                                            {body}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Testimonials */}
            {testimonials.length > 0 && (
                <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
                    <div className="grid gap-10 md:grid-cols-3">
                        {testimonials.map((t, index) => (
                            <figure key={index} className="bg-paper relative rounded-[1.75rem] border border-[#e8dece] p-9">
                                <Quote className="text-brass/40 h-9 w-9" strokeWidth={1.2} aria-hidden="true" />
                                <blockquote className="font-display text-ink mt-5 text-[1.55rem] leading-snug italic">{t.quote}</blockquote>
                                <figcaption className="mt-7 flex items-center gap-3 border-t border-[#e8dece] pt-5">
                                    <span className="bg-cream text-forest inline-flex h-10 w-10 items-center justify-center rounded-full">
                                        <PawPrint className="h-4 w-4" strokeWidth={1.6} />
                                    </span>
                                    <span className="text-sm">
                                        <span className="text-ink block font-medium">{t.author}</span>
                                        {t.pet && <span className="text-stone block">{t.pet}</span>}
                                    </span>
                                </figcaption>
                            </figure>
                        ))}
                    </div>
                </section>
            )}

            {/* Editor content, if any */}
            {Boolean(article.blocks?.length || article.content) && (
                <section className="mx-auto max-w-5xl px-5 pb-24 sm:px-8">
                    <Blocks blocks={article.blocks} html={article.content} textClassName="velvet-prose prose max-w-none" />
                </section>
            )}

            {/* From the journal */}
            {journal.length > 0 && (
                <section className="bg-cream/60">
                    <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-28">
                        <div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
                            <div className="max-w-xl space-y-5">
                                {m.journal_eyebrow && <Eyebrow>{m.journal_eyebrow}</Eyebrow>}
                                {m.journal_title && <DisplayTitle text={m.journal_title} className="text-ink text-5xl" />}
                                {m.journal_text && <p className="text-stone text-lg leading-relaxed font-light">{m.journal_text}</p>}
                            </div>
                            {m.journal_url && (
                                <a
                                    href={m.journal_url}
                                    className="text-forest border-brass inline-flex shrink-0 items-center gap-2 border-b pb-1 text-xs font-semibold tracking-[0.2em] uppercase"
                                >
                                    Read the journal
                                    <ArrowUpRight className="h-4 w-4" />
                                </a>
                            )}
                        </div>
                        <div className="grid gap-8 md:grid-cols-3">
                            {journal.map((card, index) => (
                                <a key={index} href={card.url || m.journal_url || '#'} className="group velvet-zoom block">
                                    <div className="aspect-[16/11] overflow-hidden rounded-[1.5rem]">
                                        {card.image && (
                                            <MediaImage
                                                src={card.image}
                                                fallbackAlt={card.title}
                                                sizes="(max-width: 768px) 100vw, 33vw"
                                                className="h-full w-full object-cover"
                                            />
                                        )}
                                    </div>
                                    {card.label && (
                                        <p className="text-brass mt-5 text-[0.68rem] font-semibold tracking-[0.25em] uppercase">{card.label}</p>
                                    )}
                                    <h3 className="font-display text-ink group-hover:text-forest mt-2 text-[1.7rem] leading-tight transition-colors">
                                        {card.title}
                                    </h3>
                                </a>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Gallery */}
            {gallery.length > 0 && (
                <section className="py-24 sm:py-28">
                    <div className="mx-auto mb-12 max-w-7xl px-5 text-center sm:px-8">
                        {m.gallery_title && <DisplayTitle text={m.gallery_title} className="text-ink text-4xl sm:text-5xl" />}
                        {m.gallery_handle && <p className="text-brass mt-3 text-sm tracking-[0.2em] uppercase">{m.gallery_handle}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3 px-3 sm:grid-cols-3 lg:grid-cols-6">
                        {gallery.map((card, index) => (
                            <figure key={index} className="velvet-zoom group relative aspect-square overflow-hidden rounded-2xl">
                                {card.image && (
                                    <MediaImage
                                        src={card.image}
                                        fallbackAlt={card.title}
                                        sizes="(max-width: 640px) 50vw, 17vw"
                                        className="h-full w-full object-cover"
                                    />
                                )}
                                {card.title && (
                                    <figcaption className="font-display text-ivory absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-4 pt-10 text-xl italic opacity-0 transition-opacity group-hover:opacity-100">
                                        {card.title}
                                    </figcaption>
                                )}
                            </figure>
                        ))}
                    </div>
                </section>
            )}

            {/* Closing call to action */}
            {m.cta_title && (
                <section className="px-3 pb-3">
                    <div className="bg-forest-deep relative isolate overflow-hidden rounded-[2rem]">
                        {m.cta_image && (
                            <>
                                <MediaImage
                                    src={m.cta_image}
                                    fallbackAlt=""
                                    sizes="100vw"
                                    className="absolute inset-0 -z-20 h-full w-full object-cover"
                                />
                                <div className="bg-forest-deep/70 absolute inset-0 -z-10" aria-hidden="true" />
                            </>
                        )}
                        <div className="mx-auto max-w-3xl space-y-7 px-6 py-28 text-center sm:py-36">
                            <PawPrint className="text-brass-light mx-auto h-8 w-8" strokeWidth={1.3} />
                            <DisplayTitle text={m.cta_title} className="text-ivory text-5xl sm:text-6xl" />
                            {m.cta_text && <p className="text-ivory/75 mx-auto max-w-xl text-lg leading-relaxed font-light">{m.cta_text}</p>}
                            {m.cta_button_label && m.cta_button_url && (
                                <SmartLink
                                    href={m.cta_button_url}
                                    className="bg-ivory text-forest-deep hover:bg-brass-light inline-flex items-center gap-3 rounded-full px-9 py-4 text-xs font-semibold tracking-[0.2em] uppercase transition-colors"
                                >
                                    {m.cta_button_label}
                                    <ArrowRight className="h-4 w-4" />
                                </SmartLink>
                            )}
                        </div>
                    </div>
                </section>
            )}
        </VelvetLayout>
    );
}
