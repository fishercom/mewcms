/**
 * Template Name: Home Page
 * Unique: true
 */
import Blocks from '@/components/blocks';
import FrontSlider from '@/components/front-slider';
import { CmsArticle } from '@/types/models/cms-article';
import { CmsSlider } from '@/types/models/cms-slider';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    CheckCircle2,
    Command,
    Cpu,
    Database,
    FileText,
    Globe,
    Layers,
    LayoutDashboard,
    Lock,
    Palette,
    Sparkles,
    Zap,
} from 'lucide-react';
import FrontLayout from '../layout';

interface HomeProps {
    article: CmsArticle;
    navigation: Pick<CmsArticle, 'id' | 'title' | 'slug'>[];
    slider?: CmsSlider;
}

interface FeatureItem {
    _id?: string;
    title?: string;
    description?: string;
    badge?: string;
    icon?: string;
    color?: string;
}

interface HomeMetadata {
    hero_title?: string;
    hero_subtitle?: string;
    hero_description?: string;
    badge_text?: string;
    stat_speed?: string;
    stat_typesafe?: string;
    stat_stack?: string;
    stat_navigation?: string;
    section_features_title?: string;
    section_features_subtitle?: string;
    cta_title?: string;
    cta_description?: string;
    cta_button_text?: string;
    cta_button_url?: string;
    features?: FeatureItem[];
    [key: string]: unknown;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    Cpu,
    Layers,
    Palette,
    Command,
    FileText,
    Lock,
    Zap,
    Sparkles,
    Database,
    Globe,
    LayoutDashboard,
    CheckCircle2,
    ArrowRight,
};

const COLOR_MAP: Record<string, string> = {
    violet: 'from-violet-500/20 to-purple-500/10 text-violet-600 dark:text-violet-400',
    purple: 'from-violet-500/20 to-purple-500/10 text-violet-600 dark:text-violet-400',
    blue: 'from-blue-500/20 to-cyan-500/10 text-blue-600 dark:text-blue-400',
    cyan: 'from-cyan-500/20 to-blue-500/10 text-cyan-600 dark:text-cyan-400',
    amber: 'from-amber-500/20 to-orange-500/10 text-amber-600 dark:text-amber-400',
    orange: 'from-orange-500/20 to-amber-500/10 text-orange-600 dark:text-orange-400',
    emerald: 'from-emerald-500/20 to-teal-500/10 text-emerald-600 dark:text-emerald-400',
    teal: 'from-emerald-500/20 to-teal-500/10 text-emerald-600 dark:text-emerald-400',
    green: 'from-emerald-500/20 to-teal-500/10 text-emerald-600 dark:text-emerald-400',
    rose: 'from-rose-500/20 to-pink-500/10 text-rose-600 dark:text-rose-400',
    pink: 'from-pink-500/20 to-rose-500/10 text-pink-600 dark:text-pink-400',
    red: 'from-rose-500/20 to-pink-500/10 text-rose-600 dark:text-rose-400',
    indigo: 'from-indigo-500/20 to-blue-500/10 text-indigo-600 dark:text-indigo-400',
};

export default function Home({ article, navigation, slider }: HomeProps) {
    const meta = (article.metadata || {}) as HomeMetadata;

    const heroTitle = meta.hero_title || article.title;
    const heroSubtitle = meta.hero_subtitle || 'Un CMS ágil, potente y elegante con React, Inertia.js y Laravel 11.';
    const heroDescription =
        meta.hero_description ||
        'Personaliza cada sección, gestiona taxonomías y administra contenidos con esquemas dinámicos directamente desde el panel de control.';
    const badgeText = meta.badge_text || 'Gestor de Contenidos de Nueva Generación';
    const sectionFeaturesTitle = meta.section_features_title || 'Todo lo que necesitas para tu proyecto web';
    const sectionFeaturesSubtitle =
        meta.section_features_subtitle ||
        'Diseñado tanto para creadores de contenido no técnicos como para ingenieros que exigen código limpio y escalable.';
    const ctaTitle = meta.cta_title || 'Comienza a administrar tu contenido hoy mismo';
    const ctaDescription =
        meta.cta_description ||
        'Accede al panel de control para crear nuevas páginas, gestionar artículos de blog, configurar menús y personalizar cada aspecto de tu sitio.';
    const ctaButtonText = meta.cta_button_text || 'Abrir Dashboard';
    const ctaButtonUrl = meta.cta_button_url || '/admin';

    const defaultFeatures: FeatureItem[] = [
        {
            icon: 'Cpu',
            title: 'Arquitectura SPA Unificada',
            description: 'Combina la robustez de Laravel 11 con la velocidad instantánea de Inertia.js v2 y React 19 sin recargas de página.',
            badge: 'Alto Rendimiento',
            color: 'violet',
        },
        {
            icon: 'Layers',
            title: 'Esquemas y Campos a Medida',
            description:
                'Modela cualquier tipo de dato con campos de texto, repetidores, selecciones y metadatos dinámicos sin tocar código de base de datos.',
            badge: 'Modular',
            color: 'blue',
        },
        {
            icon: 'Palette',
            title: 'Plantillas React & Tailwind',
            description:
                'Diseña tus páginas con componentes limpios en TypeScript y estilos con Tailwind CSS con soporte nativo para temas claro y oscuro.',
            badge: 'UI Vanguardista',
            color: 'amber',
        },
        {
            icon: 'Command',
            title: 'Paleta de Comandos ⌘K',
            description: 'Navegación ultra rápida por teclado para saltar a cualquier módulo, editar páginas o realizar acciones al vuelo.',
            badge: 'Productividad',
            color: 'emerald',
        },
        {
            icon: 'FileText',
            title: 'Editor Enriquecido TipTap',
            description: 'Crea y maqueta publicaciones, blogs y artículos con un editor de texto enriquecido moderno, potente e intuitivo.',
            badge: 'Edición Ágil',
            color: 'rose',
        },
        {
            icon: 'Lock',
            title: 'Seguridad y Roles Granulares',
            description: 'Control de acceso detallado por módulos y acciones, auditoría de eventos y protección integrada de datos.',
            badge: 'Enterprise',
            color: 'indigo',
        },
    ];

    const rawFeatures: FeatureItem[] = Array.isArray(meta.features) && meta.features.length > 0 ? meta.features : defaultFeatures;

    const features = rawFeatures.map((feature) => {
        const IconComponent = (feature.icon && ICON_MAP[feature.icon]) || Sparkles;
        const colorClass =
            (feature.color && COLOR_MAP[feature.color.toLowerCase()]) || (feature.color?.startsWith('from-') ? feature.color : COLOR_MAP.violet);

        return {
            ...feature,
            iconComponent: IconComponent,
            colorClass,
        };
    });

    const stats = [
        { label: 'Tiempo de Respuesta', value: meta.stat_speed || '< 100ms', icon: Zap },
        { label: 'Tipado Seguro', value: meta.stat_typesafe || '100% TS', icon: CheckCircle2 },
        { label: 'Arquitectura', value: meta.stat_stack || 'Laravel + React', icon: Database },
        { label: 'Navegación Fluida', value: meta.stat_navigation || 'Inertia v2', icon: Globe },
    ];

    return (
        <FrontLayout navigation={navigation}>
            <Head title={article.title} />

            <div className="space-y-20 py-4 sm:py-8">
                {/* 1. Hero / Slider Section */}
                {slider && slider.slides && slider.slides.length > 0 ? (
                    <FrontSlider slider={slider} />
                ) : (
                    <div className="border-border/60 via-background dark:via-background dark:to-background relative overflow-hidden rounded-3xl border bg-gradient-to-br from-violet-500/10 to-amber-500/5 px-6 py-20 text-center shadow-2xl sm:px-12 sm:py-28 dark:from-violet-950/20">
                        <div className="mx-auto max-w-3xl space-y-6">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3.5 py-1 text-xs font-semibold text-violet-700 backdrop-blur-md dark:text-violet-300">
                                <Sparkles className="h-3.5 w-3.5" />
                                <span>{badgeText}</span>
                            </span>

                            <h1 className="text-foreground text-4xl leading-tight font-black tracking-tight sm:text-6xl md:text-7xl">
                                <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-amber-600 bg-clip-text text-transparent dark:from-violet-400 dark:via-purple-300 dark:to-amber-400">
                                    {heroTitle}
                                </span>
                            </h1>

                            <p className="text-foreground/80 text-lg leading-relaxed font-medium sm:text-xl">{heroSubtitle}</p>

                            <p className="text-muted-foreground mx-auto max-w-2xl text-sm leading-relaxed">{heroDescription}</p>

                            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                                <Link
                                    href="/admin"
                                    className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-xs font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-[1.02] hover:bg-violet-700 active:scale-95 sm:text-sm"
                                >
                                    <LayoutDashboard className="h-4 w-4" />
                                    <span>Ir al Panel Administrativo</span>
                                    <ArrowRight className="h-4 w-4" />
                                </Link>

                                <a
                                    href="#caracteristicas"
                                    className="border-border/80 bg-background text-foreground hover:bg-muted inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-xs font-semibold shadow-2xs transition-all active:scale-95 sm:text-sm"
                                >
                                    <span>Ver Características</span>
                                </a>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. Key Stats Strip */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
                    {stats.map((stat, idx) => {
                        const StatIcon = stat.icon;
                        return (
                            <div
                                key={idx}
                                className="border-border/60 bg-card hover:border-border flex items-center gap-3 rounded-2xl border p-4 shadow-2xs transition-all hover:shadow-xs sm:p-5"
                            >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                                    <StatIcon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-foreground text-base font-bold sm:text-lg">{stat.value}</p>
                                    <p className="text-muted-foreground text-[11px] font-medium">{stat.label}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* 3. Graphical Features Grid */}
                <div id="caracteristicas" className="scroll-mt-20 space-y-8">
                    <div className="mx-auto max-w-2xl space-y-3 text-center">
                        <span className="border-border/70 bg-muted/50 text-muted-foreground inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wider uppercase">
                            Potencia & Modularidad
                        </span>
                        <h2 className="text-foreground text-2xl font-extrabold tracking-tight sm:text-4xl">{sectionFeaturesTitle}</h2>
                        <p className="text-muted-foreground text-sm leading-relaxed">{sectionFeaturesSubtitle}</p>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {features.map((feature, idx) => {
                            const FeatureIcon = feature.iconComponent;
                            return (
                                <div
                                    key={feature._id || idx}
                                    className="group border-border/70 bg-card relative overflow-hidden rounded-2xl border p-6 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-violet-500/40 hover:shadow-md dark:hover:border-violet-500/30"
                                >
                                    <div className="mb-4 flex items-center justify-between">
                                        <div
                                            className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.colorClass} shadow-2xs`}
                                        >
                                            <FeatureIcon className="h-6 w-6 stroke-[1.8]" />
                                        </div>
                                        {feature.badge && (
                                            <span className="border-border/60 bg-muted/60 text-muted-foreground rounded-full border px-2.5 py-0.5 text-[10px] font-semibold">
                                                {feature.badge}
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-foreground text-base font-bold transition-colors group-hover:text-violet-600 dark:group-hover:text-violet-400">
                                        {feature.title}
                                    </h3>
                                    {feature.description && (
                                        <p className="text-muted-foreground mt-2 text-xs leading-relaxed">{feature.description}</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 4. Editorial Content Showcase (if article content is set) */}
                {article.content && article.content.trim().length > 0 && (
                    <div className="border-border/70 from-card via-card relative overflow-hidden rounded-3xl border bg-gradient-to-br to-violet-500/5 p-8 shadow-2xs sm:p-12 dark:to-violet-950/20">
                        <div className="mx-auto max-w-3xl space-y-6">
                            <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
                                <Sparkles className="h-5 w-5" />
                                <span className="text-xs font-bold tracking-wider uppercase">Presentación Editorial</span>
                            </div>
                            <Blocks blocks={article.blocks} html={article.content} textClassName="text-foreground/90 leading-relaxed font-normal" />
                        </div>
                    </div>
                )}

                {/* 5. Custom Metadata Blocks (if extra fields are set in admin) */}
                {Object.keys(meta).length > 4 && (
                    <div className="border-border/60 bg-muted/10 space-y-6 rounded-3xl border p-6 sm:p-10">
                        <div className="flex items-center gap-2">
                            <Layers className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                            <h3 className="text-foreground text-lg font-bold">Campos Personalizados del Esquema</h3>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {Object.entries(meta)
                                .filter(
                                    ([key]) =>
                                        ![
                                            'slider',
                                            'hero_title',
                                            'hero_subtitle',
                                            'hero_description',
                                            'badge_text',
                                            'stat_speed',
                                            'stat_typesafe',
                                            'stat_stack',
                                            'stat_navigation',
                                            'section_features_title',
                                            'section_features_subtitle',
                                            'cta_title',
                                            'cta_description',
                                            'cta_button_text',
                                            'cta_button_url',
                                            'features',
                                            '_id',
                                        ].includes(key) && !key.startsWith('seo_'),
                                )
                                .map(([key, val]) => {
                                    if (typeof val !== 'object' && val) {
                                        return (
                                            <div key={key} className="border-border/60 bg-card space-y-1.5 rounded-xl border p-4 shadow-2xs">
                                                <h4 className="text-[11px] font-bold tracking-wider text-violet-600 uppercase dark:text-violet-400">
                                                    {key.replace(/_/g, ' ')}
                                                </h4>
                                                <p className="text-foreground/80 text-xs leading-relaxed break-words">{String(val)}</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                })}
                        </div>
                    </div>
                )}

                {/* 6. Call to Action Banner */}
                <div className="border-border/80 relative overflow-hidden rounded-3xl border bg-gradient-to-r from-violet-900/90 via-purple-900/90 to-zinc-950 p-8 text-white shadow-2xl sm:p-12">
                    <div className="relative z-10 max-w-2xl space-y-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wider text-white/90 uppercase backdrop-blur-md">
                            Control Total
                        </span>
                        <h2 className="text-2xl leading-tight font-black tracking-tight sm:text-4xl">{ctaTitle}</h2>
                        <p className="text-xs leading-relaxed text-zinc-300 sm:text-sm">{ctaDescription}</p>
                        <div className="pt-2">
                            <Link
                                href={ctaButtonUrl}
                                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-xs font-bold text-zinc-950 shadow-lg transition-all hover:scale-[1.02] hover:bg-zinc-100 active:scale-95 sm:text-sm"
                            >
                                <span>{ctaButtonText}</span>
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>

                    {/* Decorative Background Accents */}
                    <div className="pointer-events-none absolute -top-20 -right-20 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />
                    <div className="pointer-events-none absolute right-40 -bottom-20 h-60 w-60 rounded-full bg-amber-500/15 blur-2xl" />
                </div>
            </div>
        </FrontLayout>
    );
}
