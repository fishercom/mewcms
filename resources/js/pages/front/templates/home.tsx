/**
 * Template Name: Home Page
 * Unique: true
 */
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

interface HomeMetadata {
    hero_title?: string;
    hero_subtitle?: string;
    hero_description?: string;
    [key: string]: unknown;
}

export default function Home({ article, navigation, slider }: HomeProps) {
    const meta = (article.metadata || {}) as HomeMetadata;

    const heroTitle = meta.hero_title || article.title;
    const heroSubtitle =
        meta.hero_subtitle || 'Un CMS ágil, potente y elegante con React, Inertia.js y Laravel 11.';
    const heroDescription =
        meta.hero_description ||
        'Personaliza cada sección, gestiona taxonomías y administra contenidos con esquemas dinámicos directamente desde el panel de control.';

    const features = [
        {
            icon: Cpu,
            title: 'Arquitectura SPA Unificada',
            description:
                'Combina la robustez de Laravel 11 con la velocidad instantánea de Inertia.js v2 y React 19 sin recargas de página.',
            badge: 'Alto Rendimiento',
            color: 'from-violet-500/20 to-purple-500/10 text-violet-600 dark:text-violet-400',
        },
        {
            icon: Layers,
            title: 'Esquemas y Campos a Medida',
            description:
                'Modela cualquier tipo de dato con campos de texto, repetidores, selecciones y metadatos dinámicos sin tocar código de base de datos.',
            badge: 'Modular',
            color: 'from-blue-500/20 to-cyan-500/10 text-blue-600 dark:text-blue-400',
        },
        {
            icon: Palette,
            title: 'Plantillas React & Tailwind',
            description:
                'Diseña tus páginas con componentes limpios en TypeScript y estilos con Tailwind CSS con soporte nativo para temas claro y oscuro.',
            badge: 'UI Vanguardista',
            color: 'from-amber-500/20 to-orange-500/10 text-amber-600 dark:text-amber-400',
        },
        {
            icon: Command,
            title: 'Paleta de Comandos ⌘K',
            description:
                'Navegación ultra rápida por teclado para saltar a cualquier módulo, editar páginas o realizar acciones al vuelo.',
            badge: 'Productividad',
            color: 'from-emerald-500/20 to-teal-500/10 text-emerald-600 dark:text-emerald-400',
        },
        {
            icon: FileText,
            title: 'Editor Enriquecido TipTap',
            description:
                'Crea y maqueta publicaciones, blogs y artículos con un editor de texto enriquecido moderno, potente e intuitivo.',
            badge: 'Edición Ágil',
            color: 'from-rose-500/20 to-pink-500/10 text-rose-600 dark:text-rose-400',
        },
        {
            icon: Lock,
            title: 'Seguridad y Roles Granulares',
            description:
                'Control de acceso detallado por módulos y acciones, auditoría de eventos y protección integrada de datos.',
            badge: 'Enterprise',
            color: 'from-indigo-500/20 to-blue-500/10 text-indigo-600 dark:text-indigo-400',
        },
    ];

    const stats = [
        { label: 'Tiempo de Respuesta', value: '< 100ms', icon: Zap },
        { label: 'Tipado Seguro', value: '100% TS', icon: CheckCircle2 },
        { label: 'Arquitectura', value: 'Laravel + React', icon: Database },
        { label: 'Navegación Fluida', value: 'Inertia v2', icon: Globe },
    ];

    return (
        <FrontLayout navigation={navigation}>
            <Head title={article.title} />

            <div className="space-y-20 py-4 sm:py-8">
                {/* 1. Hero / Slider Section */}
                {slider && slider.slides && slider.slides.length > 0 ? (
                    <FrontSlider slider={slider} />
                ) : (
                    <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-violet-500/10 via-background to-amber-500/5 px-6 py-20 text-center shadow-2xl sm:px-12 sm:py-28 dark:from-violet-950/20 dark:via-background dark:to-background">
                        <div className="mx-auto max-w-3xl space-y-6">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3.5 py-1 text-xs font-semibold text-violet-700 dark:text-violet-300 backdrop-blur-md">
                                <Sparkles className="h-3.5 w-3.5" />
                                <span>Gestor de Contenidos de Nueva Generación</span>
                            </span>

                            <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-6xl md:text-7xl leading-tight">
                                <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-amber-600 bg-clip-text text-transparent dark:from-violet-400 dark:via-purple-300 dark:to-amber-400">
                                    {heroTitle}
                                </span>
                            </h1>

                            <p className="text-lg font-medium text-foreground/80 sm:text-xl leading-relaxed">
                                {heroSubtitle}
                            </p>

                            <p className="mx-auto max-w-2xl text-sm text-muted-foreground leading-relaxed">
                                {heroDescription}
                            </p>

                            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                                <Link
                                    href="/admin"
                                    className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:bg-violet-700 hover:scale-[1.02] active:scale-95"
                                >
                                    <LayoutDashboard className="h-4 w-4" />
                                    <span>Ir al Panel Administrativo</span>
                                    <ArrowRight className="h-4 w-4" />
                                </Link>

                                <a
                                    href="#caracteristicas"
                                    className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-background px-5 py-3 text-xs sm:text-sm font-semibold text-foreground transition-all hover:bg-muted active:scale-95 shadow-2xs"
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
                                className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 sm:p-5 shadow-2xs transition-all hover:border-border hover:shadow-xs"
                            >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                                    <StatIcon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-base sm:text-lg font-bold text-foreground">{stat.value}</p>
                                    <p className="text-[11px] font-medium text-muted-foreground">{stat.label}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* 3. Graphical Features Grid */}
                <div id="caracteristicas" className="space-y-8 scroll-mt-20">
                    <div className="text-center space-y-3 max-w-2xl mx-auto">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/50 px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Potencia & Modularidad
                        </span>
                        <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                            Todo lo que necesitas para tu proyecto web
                        </h2>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Diseñado tanto para creadores de contenido no técnicos como para ingenieros que exigen código limpio y escalable.
                        </p>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {features.map((feature, idx) => {
                            const FeatureIcon = feature.icon;
                            return (
                                <div
                                    key={idx}
                                    className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-6 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-violet-500/40 hover:shadow-md dark:hover:border-violet-500/30"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div
                                            className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.color} shadow-2xs`}
                                        >
                                            <FeatureIcon className="h-6 w-6 stroke-[1.8]" />
                                        </div>
                                        <span className="rounded-full border border-border/60 bg-muted/60 px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                            {feature.badge}
                                        </span>
                                    </div>

                                    <h3 className="text-base font-bold text-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                                        {feature.title}
                                    </h3>
                                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                                        {feature.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 4. Custom Metadata Blocks (if extra fields are set in admin) */}
                {Object.keys(meta).length > 4 && (
                    <div className="space-y-6 rounded-3xl border border-border/60 bg-muted/10 p-6 sm:p-10">
                        <div className="flex items-center gap-2">
                            <Layers className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                            <h3 className="text-lg font-bold text-foreground">Campos Personalizados Activos</h3>
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
                                            '_id',
                                        ].includes(key) && !key.startsWith('seo_'),
                                )
                                .map(([key, val]) => {
                                    if (typeof val !== 'object' && val) {
                                        return (
                                            <div
                                                key={key}
                                                className="rounded-xl border border-border/60 bg-card p-4 shadow-2xs space-y-1.5"
                                            >
                                                <h4 className="text-[11px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                                                    {key.replace(/_/g, ' ')}
                                                </h4>
                                                <p className="text-xs text-foreground/80 leading-relaxed break-words">
                                                    {String(val)}
                                                </p>
                                            </div>
                                        );
                                    }
                                    return null;
                                })}
                        </div>
                    </div>
                )}

                {/* 5. Call to Action Banner */}
                <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-r from-violet-900/90 via-purple-900/90 to-zinc-950 p-8 sm:p-12 text-white shadow-2xl">
                    <div className="relative z-10 max-w-2xl space-y-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur-md uppercase tracking-wider">
                            Control Total
                        </span>
                        <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                            Comienza a administrar tu contenido hoy mismo
                        </h2>
                        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                            Accede al panel de control para crear nuevas páginas, gestionar artículos de blog, configurar menús y personalizar cada aspecto de tu sitio.
                        </p>
                        <div className="pt-2">
                            <Link
                                href="/admin"
                                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-xs sm:text-sm font-bold text-zinc-950 shadow-lg transition-all hover:bg-zinc-100 hover:scale-[1.02] active:scale-95"
                            >
                                <span>Abrir Dashboard</span>
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>

                    {/* Decorative Background Accents */}
                    <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-20 right-40 h-60 w-60 rounded-full bg-amber-500/15 blur-2xl" />
                </div>
            </div>
        </FrontLayout>
    );
}
