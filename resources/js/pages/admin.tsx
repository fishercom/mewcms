import AppLayout from '@/layouts/app-layout';
import { generateBreadcrumb } from '@/lib/breadcrumbs';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { Activity, ArrowUpRight, ChevronRight, Clock, Database, FileText, Inbox, Mail, Menu, PlusCircle, Settings, Tags } from 'lucide-react';

interface DashboardProps {
    stats: {
        total_articles: number;
        active_articles: number;
        total_tags: number;
        total_messages: number;
        unreviewed_messages: number;
        file_count: number;
        disk_usage: string;
        article_growth?: number;
    };
    recentLogs: Array<{
        id: number;
        comment: string;
        user_name: string;
        created_at: string | null;
    }>;
    articlesChart: Array<{ label: string; value: number }>;
    messagesChart: Array<{ label: string; value: number }>;
    activityChart: Array<{ label: string; value: number }>;
}

const breadcrumbs: BreadcrumbItem[] = generateBreadcrumb('', '', '/admin');

export default function Dashboard() {
    const {
        stats,
        recentLogs = [],
        articlesChart = [],
        messagesChart = [],
        activityChart = [],
    } = usePage<{ props: DashboardProps }>().props as unknown as DashboardProps;

    const auth = usePage().props.auth as { user: { name: string } };
    const userName = auth?.user?.name || 'Administrador';

    // 1. Math utilities for Monthly Bar Chart
    const maxMonthlyVal = Math.max(
        ...articlesChart.map((d) => d.value),
        ...messagesChart.map((d) => d.value),
        5, // secure a minimum baseline height
    );

    // 2. Math utilities for Daily Area Chart
    const maxActivityVal = Math.max(...activityChart.map((d) => d.value), 5);

    // Build SVG Path for activity line chart (15 points)
    const chartWidth = 450;
    const chartHeight = 130;
    const paddingLeft = 30;
    const paddingRight = 10;
    const paddingTop = 10;
    const paddingBottom = 20;

    const effectiveWidth = chartWidth - paddingLeft - paddingRight;
    const effectiveHeight = chartHeight - paddingTop - paddingBottom;

    const points = activityChart.map((d, index) => {
        const x = paddingLeft + (index / (activityChart.length - 1 || 1)) * effectiveWidth;
        const y = paddingTop + effectiveHeight - (d.value / maxActivityVal) * effectiveHeight;
        return { x, y, value: d.value, label: d.label };
    });

    const linePath =
        points.length > 0
            ? `M ${points[0].x} ${points[0].y} ` +
              points
                  .slice(1)
                  .map((p) => `L ${p.x} ${p.y}`)
                  .join(' ')
            : '';

    const areaPath =
        points.length > 0
            ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + effectiveHeight} L ${points[0].x} ${paddingTop + effectiveHeight} Z`
            : '';

    const growth = stats.article_growth ?? 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Panel de Control - MewCMS" />

            <div className="flex-1 space-y-6 p-6">
                {/* Header Welcome Hero Card */}
                <div className="border-primary/20 from-primary via-primary to-primary shadow-primary/10 relative overflow-hidden rounded-2xl border bg-gradient-to-r p-6 text-white shadow-xl">
                    <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
                    <div className="bg-primary/10 pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full blur-2xl" />

                    <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-white/90 uppercase backdrop-blur-xs">
                                    <span className="bg-success h-1.5 w-1.5 animate-pulse rounded-full" />
                                    MewCMS Studio
                                </span>
                                <span className="text-xs text-white/70">{format(new Date(), 'EEEE, d MMMM yyyy')}</span>
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">¡Bienvenido de nuevo, {userName}!</h1>
                            <p className="max-w-xl text-sm leading-relaxed text-white/80">
                                Supervisa el rendimiento de tus publicaciones, administra páginas y contenidos web, y revisa el flujo de interacción
                                en tiempo real.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0">
                            <Link
                                href="/admin/articles/create"
                                className="bg-card text-primary inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold shadow-sm transition-all hover:bg-white/95 hover:shadow-md active:scale-95"
                            >
                                <PlusCircle className="text-primary h-4 w-4" />
                                <span>Nueva Página</span>
                            </Link>
                            <Link
                                href="/admin/media"
                                className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/25 active:scale-95"
                            >
                                <Database className="h-4 w-4" />
                                <span>Biblioteca</span>
                            </Link>
                            <a
                                href="/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/25 active:scale-95"
                            >
                                <ArrowUpRight className="h-4 w-4" />
                                <span>Ver Sitio</span>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Metrics Cards Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Card 1: Articles */}
                    <div className="group border-border/70 bg-card hover:border-primary/30 relative rounded-xl border p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">Contenido</span>
                            <div className="bg-primary/10 text-primary rounded-xl p-2.5 transition-transform group-hover:scale-110">
                                <FileText className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-4 space-y-1">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-foreground text-3xl font-bold tracking-tight">{stats.total_articles}</h3>
                                {growth !== 0 && (
                                    <span className={`text-[11px] font-semibold ${growth >= 0 ? 'text-success' : 'text-destructive'}`}>
                                        {growth >= 0 ? `+${growth}%` : `${growth}%`}
                                    </span>
                                )}
                            </div>
                            <p className="text-muted-foreground text-xs font-medium">Páginas y Artículos</p>
                            <div className="pt-2">
                                <span className="border-success/20 bg-success/10 text-success inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-medium">
                                    <span className="bg-success h-1.5 w-1.5 rounded-full" />
                                    {stats.active_articles} Publicados
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Tags */}
                    <div className="group border-border/70 bg-card hover:border-warning/30 relative rounded-xl border p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">Etiquetas</span>
                            <div className="bg-warning/10 text-warning rounded-xl p-2.5 transition-transform group-hover:scale-110">
                                <Tags className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-4 space-y-1">
                            <h3 className="text-foreground text-3xl font-bold tracking-tight">{stats.total_tags}</h3>
                            <p className="text-muted-foreground text-xs font-medium">Etiquetas registradas</p>
                            <div className="pt-2">
                                <span className="border-warning/20 bg-warning/10 text-warning inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium">
                                    Categorías & Etiquetas
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Files & Disk Space */}
                    <div className="group border-border/70 bg-card relative rounded-xl border p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500/30 hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">Almacenamiento</span>
                            <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-600 transition-transform group-hover:scale-110 dark:text-blue-400">
                                <Database className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-4 space-y-1">
                            <h3 className="text-foreground text-3xl font-bold tracking-tight">{stats.disk_usage}</h3>
                            <p className="text-muted-foreground text-xs font-medium">Espacio Utilizado</p>
                            <div className="pt-2">
                                <span className="inline-flex items-center rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-300">
                                    {stats.file_count} Archivos en Biblioteca
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Card 4: Contact Submissions */}
                    <div className="group border-border/70 bg-card hover:border-primary/30 relative rounded-xl border p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">Mensajes</span>
                            <div className="bg-primary/10 text-primary rounded-xl p-2.5 transition-transform group-hover:scale-110">
                                <Mail className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-4 space-y-1">
                            <h3 className="text-foreground text-3xl font-bold tracking-tight">{stats.total_messages}</h3>
                            <p className="text-muted-foreground text-xs font-medium">Mensajes Recibidos</p>
                            <div className="pt-2">
                                <span
                                    className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium ${
                                        stats.unreviewed_messages > 0
                                            ? 'border-warning/30 bg-warning-soft text-warning'
                                            : 'border-border/60 bg-muted text-muted-foreground'
                                    }`}
                                >
                                    {stats.unreviewed_messages} Pendientes de Revisión
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Analytical Charts Row */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Chart 1: Articles & Messages Monthly Growth */}
                    <div className="border-border/70 bg-card flex flex-col justify-between rounded-xl border p-5 shadow-2xs">
                        <div className="border-border/60 space-y-1 border-b pb-4">
                            <h3 className="text-foreground text-sm font-bold">Crecimiento Mensual</h3>
                            <p className="text-muted-foreground text-xs">Comparativa de publicación de artículos y contacto (últimos 6 meses)</p>
                        </div>

                        {/* SVG Bar Chart */}
                        <div className="flex w-full items-end justify-center pt-6">
                            <svg className="h-40 w-full max-w-md" viewBox="0 0 500 160">
                                {/* Defs for gradients */}
                                <defs>
                                    <linearGradient id="artGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#8b5cf6" />
                                        <stop offset="100%" stopColor="#6d28d9" stopOpacity="0.5" />
                                    </linearGradient>
                                    <linearGradient id="msgGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#f43f5e" />
                                        <stop offset="100%" stopColor="#be123c" stopOpacity="0.5" />
                                    </linearGradient>
                                </defs>

                                {/* Y-axis gridlines */}
                                <line
                                    x1="40"
                                    y1="20"
                                    x2="480"
                                    y2="20"
                                    stroke="currentColor"
                                    strokeWidth="0.5"
                                    strokeDasharray="3,3"
                                    className="text-border"
                                    opacity="0.6"
                                />
                                <line
                                    x1="40"
                                    y1="70"
                                    x2="480"
                                    y2="70"
                                    stroke="currentColor"
                                    strokeWidth="0.5"
                                    strokeDasharray="3,3"
                                    className="text-border"
                                    opacity="0.6"
                                />
                                <line
                                    x1="40"
                                    y1="120"
                                    x2="480"
                                    y2="120"
                                    stroke="currentColor"
                                    strokeWidth="0.5"
                                    strokeDasharray="3,3"
                                    className="text-border"
                                    opacity="0.6"
                                />
                                <line x1="40" y1="130" x2="480" y2="130" stroke="currentColor" strokeWidth="1" className="text-border" />

                                {/* Render grouped bars */}
                                {articlesChart.map((d, i) => {
                                    const mVal = messagesChart[i]?.value || 0;

                                    // Height calculations
                                    const artHeight = (d.value / maxMonthlyVal) * 100;
                                    const msgHeight = (mVal / maxMonthlyVal) * 100;

                                    const startX = 50 + i * 72;

                                    return (
                                        <g key={i} className="group/bar cursor-pointer">
                                            {/* Article Bar */}
                                            <rect
                                                x={startX}
                                                y={130 - artHeight}
                                                width="14"
                                                height={artHeight}
                                                fill="url(#artGrad)"
                                                rx="3"
                                                className="transition-all duration-300 hover:brightness-110"
                                            />
                                            {/* Message Bar */}
                                            <rect
                                                x={startX + 16}
                                                y={130 - msgHeight}
                                                width="14"
                                                height={msgHeight}
                                                fill="url(#msgGrad)"
                                                rx="3"
                                                className="transition-all duration-300 hover:brightness-110"
                                            />

                                            {/* Tooltip on hover */}
                                            <g className="pointer-events-none opacity-0 transition-opacity duration-200 group-hover/bar:opacity-100">
                                                <rect
                                                    x={startX - 10}
                                                    y={130 - Math.max(artHeight, msgHeight) - 32}
                                                    width="56"
                                                    height="24"
                                                    rx="4"
                                                    className="stroke-border fill-neutral-900 dark:fill-neutral-800"
                                                    strokeWidth="0.5"
                                                />
                                                <text
                                                    x={startX + 18}
                                                    y={130 - Math.max(artHeight, msgHeight) - 16}
                                                    textAnchor="middle"
                                                    fill="#fff"
                                                    fontSize="9"
                                                    fontWeight="bold"
                                                >
                                                    📝{d.value} | ✉️{mVal}
                                                </text>
                                            </g>

                                            {/* X label */}
                                            <text
                                                x={startX + 15}
                                                y="148"
                                                textAnchor="middle"
                                                className="fill-muted-foreground"
                                                fontSize="9"
                                                fontWeight="500"
                                            >
                                                {d.label.split(' ')[0]}
                                            </text>
                                        </g>
                                    );
                                })}
                            </svg>
                        </div>

                        {/* Legend */}
                        <div className="text-muted-foreground flex justify-center gap-4 pt-2 text-[10px] font-semibold">
                            <span className="flex items-center gap-1.5">
                                <span className="bg-primary h-2.5 w-2.5 rounded" /> Artículos Publicados
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="bg-destructive h-2.5 w-2.5 rounded" /> Mensajes de Contacto
                            </span>
                        </div>
                    </div>

                    {/* Chart 2: System Activity Area Chart */}
                    <div className="border-border/70 bg-card flex flex-col justify-between rounded-xl border p-5 shadow-2xs">
                        <div className="border-border/60 space-y-1 border-b pb-4">
                            <h3 className="text-foreground text-sm font-bold">Frecuencia de Operaciones</h3>
                            <p className="text-muted-foreground text-xs">Volumen diario de logs y transacciones registradas (últimos 15 días)</p>
                        </div>

                        {/* SVG Area Chart */}
                        <div className="flex w-full items-end justify-center pt-6">
                            <svg className="h-40 w-full max-w-md" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                                <defs>
                                    <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
                                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                                    </linearGradient>
                                </defs>

                                {/* Y-axis gridlines */}
                                <line
                                    x1={paddingLeft}
                                    y1={paddingTop}
                                    x2={chartWidth - paddingRight}
                                    y2={paddingTop}
                                    stroke="currentColor"
                                    strokeWidth="0.5"
                                    strokeDasharray="3,3"
                                    className="text-border"
                                    opacity="0.6"
                                />
                                <line
                                    x1={paddingLeft}
                                    y1={paddingTop + effectiveHeight / 2}
                                    x2={chartWidth - paddingRight}
                                    y2={paddingTop + effectiveHeight / 2}
                                    stroke="currentColor"
                                    strokeWidth="0.5"
                                    strokeDasharray="3,3"
                                    className="text-border"
                                    opacity="0.6"
                                />
                                <line
                                    x1={paddingLeft}
                                    y1={paddingTop + effectiveHeight}
                                    x2={chartWidth - paddingRight}
                                    y2={paddingTop + effectiveHeight}
                                    stroke="currentColor"
                                    strokeWidth="1"
                                    className="text-border"
                                />

                                {/* Filled Area */}
                                {areaPath && <path d={areaPath} fill="url(#actGrad)" />}

                                {/* Line path */}
                                {linePath && <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" />}

                                {/* Data points */}
                                {points.map((p, i) => (
                                    <g key={i} className="group/point cursor-pointer">
                                        <circle
                                            cx={p.x}
                                            cy={p.y}
                                            r="3.5"
                                            className="fill-background stroke-primary group-hover/point:r-5 group-hover/point:stroke-primary stroke-2 transition-all"
                                        />

                                        {/* Point label hover */}
                                        <g className="pointer-events-none opacity-0 transition-opacity duration-150 group-hover/point:opacity-100">
                                            <rect
                                                x={p.x - 24}
                                                y={p.y - 30}
                                                width="48"
                                                height="20"
                                                rx="4"
                                                className="stroke-border fill-neutral-900 dark:fill-neutral-800"
                                                strokeWidth="0.5"
                                            />
                                            <text x={p.x} y={p.y - 17} textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold">
                                                {p.value} logs
                                            </text>
                                        </g>

                                        {/* Horizontal axis markers */}
                                        {(i === 0 || i === 7 || i === points.length - 1) && (
                                            <text
                                                x={p.x}
                                                y={chartHeight - 4}
                                                textAnchor="middle"
                                                className="fill-muted-foreground"
                                                fontSize="9"
                                                fontWeight="500"
                                            >
                                                {p.label}
                                            </text>
                                        )}
                                    </g>
                                ))}
                            </svg>
                        </div>

                        {/* Legend */}
                        <div className="text-muted-foreground flex justify-center gap-4 pt-2 text-[10px] font-semibold">
                            <span className="flex items-center gap-1.5">
                                <span className="bg-primary h-2.5 w-2.5 rounded" /> Transacciones del Sistema
                            </span>
                        </div>
                    </div>
                </div>

                {/* operations split console */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Console Left Pane: Quick Actions */}
                    <div className="border-border/70 bg-card space-y-4 rounded-xl border p-5 shadow-2xs">
                        <div className="border-border/60 border-b pb-3">
                            <h3 className="text-foreground flex items-center gap-2 text-sm font-bold">
                                <Activity className="text-primary h-4.5 w-4.5" />
                                <span>Consola de Acciones Rápidas</span>
                            </h3>
                            <p className="text-muted-foreground text-xs">Atajos directos a las operaciones más frecuentes</p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            {/* Action 1: Create Article */}
                            <Link
                                href="/admin/articles/create"
                                className="group border-border/60 bg-muted/20 hover:border-primary/30 hover:bg-primary/5 flex items-center justify-between rounded-xl border p-3.5 transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary/10 text-primary rounded-lg p-2 transition-transform group-hover:scale-105">
                                        <PlusCircle className="h-4.5 w-4.5" />
                                    </div>
                                    <span className="text-foreground text-xs font-semibold">Escribir Artículo</span>
                                </div>
                                <ChevronRight className="text-muted-foreground h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                            </Link>

                            {/* Action 2: Tags */}
                            <Link
                                href="/admin/tags"
                                className="group border-border/60 bg-muted/20 hover:border-warning/30 hover:bg-warning/5 flex items-center justify-between rounded-xl border p-3.5 transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-warning/10 text-warning rounded-lg p-2 transition-transform group-hover:scale-105">
                                        <Tags className="h-4.5 w-4.5" />
                                    </div>
                                    <span className="text-foreground text-xs font-semibold">Etiquetas</span>
                                </div>
                                <ChevronRight className="text-muted-foreground h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                            </Link>

                            {/* Action 3: Messages inbox */}
                            <Link
                                href="/admin/registers"
                                className="group border-border/60 bg-muted/20 hover:border-primary/30 hover:bg-primary/5 flex items-center justify-between rounded-xl border p-3.5 transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary/10 text-primary rounded-lg p-2 transition-transform group-hover:scale-105">
                                        <Inbox className="h-4.5 w-4.5" />
                                    </div>
                                    <span className="text-foreground text-xs font-semibold">Mensajes</span>
                                </div>
                                <ChevronRight className="text-muted-foreground h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                            </Link>

                            {/* Action 4: Menus config */}
                            <Link
                                href="/admin/menus"
                                className="group border-border/60 bg-muted/20 flex items-center justify-between rounded-xl border p-3.5 transition-all hover:border-blue-500/30 hover:bg-blue-500/5 dark:hover:bg-blue-950/20"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600 transition-transform group-hover:scale-105 dark:text-blue-400">
                                        <Menu className="h-4.5 w-4.5" />
                                    </div>
                                    <span className="text-foreground text-xs font-semibold">Menús</span>
                                </div>
                                <ChevronRight className="text-muted-foreground h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                            </Link>

                            {/* Action 5: Config */}
                            <Link
                                href="/admin/layout"
                                className="group border-border/60 bg-muted/20 hover:border-primary/30 hover:bg-primary/5 flex items-center justify-between rounded-xl border p-3.5 transition-all sm:col-span-2"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-muted text-muted-foreground rounded-lg p-2 transition-transform group-hover:scale-105">
                                        <Settings className="h-4.5 w-4.5" />
                                    </div>
                                    <div>
                                        <span className="text-foreground block text-xs font-semibold">Personalización y Diseño</span>
                                        <span className="text-muted-foreground text-[10px] font-medium">
                                            Logotipos, redes sociales, derechos reservados y estilos CSS del sitio.
                                        </span>
                                    </div>
                                </div>
                                <ArrowUpRight className="text-muted-foreground h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            </Link>
                        </div>
                    </div>

                    {/* Console Right Pane: Activity Log Feed */}
                    <div className="border-border/70 bg-card flex flex-col justify-between space-y-4 rounded-xl border p-5 shadow-2xs">
                        <div className="border-border/60 border-b pb-3">
                            <h3 className="text-foreground flex items-center gap-2 text-sm font-bold">
                                <Clock className="text-primary h-4.5 w-4.5" />
                                <span>Actividad Reciente</span>
                            </h3>
                            <p className="text-muted-foreground text-xs">Auditoría y eventos registrados en el sistema</p>
                        </div>

                        {/* Logs Feed Container */}
                        <div className="max-h-[260px] flex-1 space-y-3 overflow-y-auto pt-2 pr-1">
                            {recentLogs.length > 0 ? (
                                recentLogs.map((log) => (
                                    <div key={log.id} className="flex gap-3 text-xs">
                                        <div className="mt-0.5 flex flex-col items-center">
                                            <div className="bg-primary/10 text-primary border-primary/20 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border">
                                                <Clock className="h-3 w-3" />
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <p className="text-foreground leading-tight">
                                                <span className="text-foreground font-semibold">{log.user_name}</span>: {log.comment}
                                            </p>
                                            <span className="text-muted-foreground block text-[10px] font-medium">
                                                {log.created_at ? format(new Date(log.created_at), 'dd/MM/yyyy HH:mm') : 'Sistema'}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-muted-foreground flex h-full items-center justify-center py-10 text-xs italic">
                                    No se encontraron registros de actividad.
                                </div>
                            )}
                        </div>

                        {/* Footer View All Link */}
                        <div className="border-border/60 flex justify-end border-t pt-3">
                            <Link href="/admin/logs" className="text-primary flex items-center gap-0.5 text-xs font-semibold hover:underline">
                                Ver todo el historial
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
