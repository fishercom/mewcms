import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { generateBreadcrumb } from '@/lib/breadcrumbs';
import { Head, Link, usePage } from '@inertiajs/react';
import { 
    FileText, Tags, Database, Mail, 
    PlusCircle, Inbox, Menu, Settings, 
    Clock, Activity, ArrowUpRight, ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';

interface DashboardProps {
    stats: {
        total_articles: number;
        active_articles: number;
        total_terms: number;
        total_messages: number;
        unreviewed_messages: number;
        file_count: number;
        disk_usage: string;
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
        activityChart = [] 
    } = usePage<{ props: DashboardProps }>().props as unknown as DashboardProps;

    const auth = usePage().props.auth as { user: { name: string } };
    const userName = auth?.user?.name || 'Administrador';

    // 1. Math utilities for Monthly Bar Chart
    const maxMonthlyVal = Math.max(
        ...articlesChart.map(d => d.value),
        ...messagesChart.map(d => d.value),
        5 // secure a minimum baseline height
    );

    // 2. Math utilities for Daily Area Chart
    const maxActivityVal = Math.max(
        ...activityChart.map(d => d.value),
        5
    );

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

    const linePath = points.length > 0 
        ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
        : '';

    const areaPath = points.length > 0
        ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + effectiveHeight} L ${points[0].x} ${paddingTop + effectiveHeight} Z`
        : '';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Panel de Administración" />
            
            <div className="flex-1 space-y-6 p-6">
                
                {/* Header Welcome Card */}
                <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-primary-900 to-primary-750 dark:from-[#1b1c18] dark:to-[#22241e] p-6 text-white shadow-lg border border-primary-800/20 dark:border-gray-800">
                    <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/5 blur-xl pointer-events-none" />
                    <div className="relative z-10 space-y-2">
                        <span className="text-xs font-semibold tracking-wider text-primary-200 uppercase">Resumen Ejecutivo</span>
                        <h1 className="text-2xl font-bold tracking-tight">¡Bienvenido de nuevo, {userName}!</h1>
                        <p className="text-sm text-primary-100 max-w-md">
                            Aquí tienes el estado actual de tu CMS. Administra artículos, gestiona las taxonomías y revisa la actividad del sistema.
                        </p>
                    </div>
                </div>

                {/* Metrics Cards Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    
                    {/* Card 1: Articles */}
                    <div className="group relative rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161615] p-5 shadow-xs transition-all hover:-translate-y-1 hover:shadow-md hover:border-emerald-500/20 dark:hover:border-emerald-500/30">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contenido</span>
                            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-2 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                                <FileText className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-4 space-y-1">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_articles}</h3>
                            <p className="text-xs text-gray-500 font-medium">Artículos Totales</p>
                            <span className="inline-flex items-center rounded-md bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200/30">
                                {stats.active_articles} Activos / Públicos
                            </span>
                        </div>
                    </div>

                    {/* Card 2: Taxonomy Terms */}
                    <div className="group relative rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161615] p-5 shadow-xs transition-all hover:-translate-y-1 hover:shadow-md hover:border-amber-500/20 dark:hover:border-amber-500/30">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Taxonomías</span>
                            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-2 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                                <Tags className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-4 space-y-1">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_terms}</h3>
                            <p className="text-xs text-gray-500 font-medium">Términos Registrados</p>
                            <span className="inline-flex items-center rounded-md bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400 border border-amber-200/30">
                                Categorías & Etiquetas
                            </span>
                        </div>
                    </div>

                    {/* Card 3: Files & Disk Space */}
                    <div className="group relative rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161615] p-5 shadow-xs transition-all hover:-translate-y-1 hover:shadow-md hover:border-blue-500/20 dark:hover:border-blue-500/30">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Almacenamiento</span>
                            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-2 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                <Database className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-4 space-y-1">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.disk_usage}</h3>
                            <p className="text-xs text-gray-500 font-medium">Espacio Utilizado</p>
                            <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-950/20 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-400 border border-blue-200/30">
                                {stats.file_count} Archivos en Biblioteca
                            </span>
                        </div>
                    </div>

                    {/* Card 4: Contact Submissions */}
                    <div className="group relative rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161615] p-5 shadow-xs transition-all hover:-translate-y-1 hover:shadow-md hover:border-rose-500/20 dark:hover:border-rose-500/30">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contacto</span>
                            <div className="rounded-lg bg-rose-50 dark:bg-rose-950/30 p-2 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
                                <Mail className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-4 space-y-1">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_messages}</h3>
                            <p className="text-xs text-gray-500 font-medium">Mensajes Recibidos</p>
                            <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold border ${
                                stats.unreviewed_messages > 0 
                                    ? 'bg-rose-50 text-rose-700 border-rose-200/30 dark:bg-rose-950/20 dark:text-rose-400' 
                                    : 'bg-gray-50 text-gray-500 border-gray-200/30 dark:bg-gray-800 dark:text-gray-400'
                            }`}>
                                {stats.unreviewed_messages} Pendientes de Revisión
                            </span>
                        </div>
                    </div>
                </div>

                {/* Analytical Charts Row */}
                <div className="grid gap-6 lg:grid-cols-2">
                    
                    {/* Chart 1: Articles & Messages Monthly Growth */}
                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161615] p-5 shadow-xs flex flex-col justify-between">
                        <div className="space-y-1 pb-4 border-b border-gray-100 dark:border-gray-900">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Crecimiento Mensual</h3>
                            <p className="text-xs text-gray-400">Comparativa de publicación de artículos y contacto (últimos 6 meses)</p>
                        </div>
                        
                        {/* SVG Bar Chart */}
                        <div className="w-full pt-6 flex justify-center items-end">
                            <svg className="w-full max-w-md h-40" viewBox="0 0 500 160">
                                {/* Defs for gradients */}
                                <defs>
                                    <linearGradient id="artGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10b981" />
                                        <stop offset="100%" stopColor="#047857" stopOpacity="0.4" />
                                    </linearGradient>
                                    <linearGradient id="msgGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#f43f5e" />
                                        <stop offset="100%" stopColor="#be123c" stopOpacity="0.4" />
                                    </linearGradient>
                                </defs>

                                {/* Y-axis gridlines */}
                                <line x1="40" y1="20" x2="480" y2="20" stroke="#888888" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.2" />
                                <line x1="40" y1="70" x2="480" y2="70" stroke="#888888" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.2" />
                                <line x1="40" y1="120" x2="480" y2="120" stroke="#888888" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.2" />
                                <line x1="40" y1="130" x2="480" y2="130" stroke="#888888" strokeWidth="1" opacity="0.5" />

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
                                                rx="2"
                                                className="transition-all duration-300 hover:brightness-110"
                                            />
                                            {/* Message Bar */}
                                            <rect
                                                x={startX + 16}
                                                y={130 - msgHeight}
                                                width="14"
                                                height={msgHeight}
                                                fill="url(#msgGrad)"
                                                rx="2"
                                                className="transition-all duration-300 hover:brightness-110"
                                            />

                                            {/* Tooltip on hover */}
                                            <g className="opacity-0 group-hover/bar:opacity-100 transition-opacity duration-200 pointer-events-none">
                                                <rect 
                                                    x={startX - 10} 
                                                    y={130 - Math.max(artHeight, msgHeight) - 32} 
                                                    width="56" 
                                                    height="24" 
                                                    rx="4" 
                                                    fill="#1f1f1e" 
                                                    stroke="#444" 
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
                                                fill="#888"
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
                        <div className="flex gap-4 pt-2 text-[10px] text-gray-500 font-semibold justify-center">
                            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-emerald-500" /> Artículos Publicados</span>
                            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-rose-500" /> Mensajes de Contacto</span>
                        </div>
                    </div>

                    {/* Chart 2: System Activity Area Chart */}
                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161615] p-5 shadow-xs flex flex-col justify-between">
                        <div className="space-y-1 pb-4 border-b border-gray-100 dark:border-gray-900">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Frecuencia de Operaciones</h3>
                            <p className="text-xs text-gray-400">Volumen diario de logs y transacciones registradas (últimos 15 días)</p>
                        </div>
                        
                        {/* SVG Area Chart */}
                        <div className="w-full pt-6 flex justify-center items-end">
                            <svg className="w-full max-w-md h-40" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                                <defs>
                                    <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                                    </linearGradient>
                                </defs>

                                {/* Y-axis gridlines */}
                                <line x1={paddingLeft} y1={paddingTop} x2={chartWidth - paddingRight} y2={paddingTop} stroke="#888" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.15" />
                                <line x1={paddingLeft} y1={paddingTop + effectiveHeight / 2} x2={chartWidth - paddingRight} y2={paddingTop + effectiveHeight / 2} stroke="#888" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.15" />
                                <line x1={paddingLeft} y1={paddingTop + effectiveHeight} x2={chartWidth - paddingRight} y2={paddingTop + effectiveHeight} stroke="#888" strokeWidth="1" opacity="0.4" />

                                {/* Filled Area */}
                                {areaPath && (
                                    <path
                                        d={areaPath}
                                        fill="url(#actGrad)"
                                    />
                                )}

                                {/* Line path */}
                                {linePath && (
                                    <path
                                        d={linePath}
                                        fill="none"
                                        stroke="#3b82f6"
                                        strokeWidth="2"
                                    />
                                )}

                                {/* Data points */}
                                {points.map((p, i) => (
                                    <g key={i} className="group/point cursor-pointer">
                                        <circle
                                            cx={p.x}
                                            cy={p.y}
                                            r="3.5"
                                            className="fill-white stroke-blue-500 stroke-2 transition-all group-hover/point:r-5"
                                        />

                                        {/* Point label hover */}
                                        <g className="opacity-0 group-hover/point:opacity-100 transition-opacity duration-150 pointer-events-none">
                                            <rect 
                                                x={p.x - 24} 
                                                y={p.y - 30} 
                                                width="48" 
                                                height="20" 
                                                rx="4" 
                                                fill="#1f1f1e" 
                                                stroke="#333" 
                                                strokeWidth="0.5" 
                                            />
                                            <text 
                                                x={p.x} 
                                                y={p.y - 17} 
                                                textAnchor="middle" 
                                                fill="#fff" 
                                                fontSize="9" 
                                                fontWeight="bold"
                                            >
                                                {p.value} logs
                                            </text>
                                        </g>

                                        {/* Horizontal axis markers (Show labels for start, middle, and end to avoid overlap) */}
                                        {(i === 0 || i === 7 || i === points.length - 1) && (
                                            <text
                                                x={p.x}
                                                y={chartHeight - 4}
                                                textAnchor="middle"
                                                fill="#888"
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
                        <div className="flex gap-4 pt-2 text-[10px] text-gray-500 font-semibold justify-center">
                            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-blue-500" /> Transacciones del Sistema</span>
                        </div>
                    </div>
                </div>

                {/* operations split console */}
                <div className="grid gap-6 md:grid-cols-2">
                    
                    {/* Console Left Pane: Quick Actions */}
                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161615] p-5 shadow-xs space-y-4">
                        <div className="pb-3 border-b border-gray-100 dark:border-gray-900">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                                <Activity className="h-4.5 w-4.5 text-primary-750 dark:text-primary-400" />
                                <span>Consola de Acciones Rápidas</span>
                            </h3>
                            <p className="text-xs text-gray-400">Atajos rápidos para las operaciones más frecuentes</p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            {/* Action 1: Create Article */}
                            <Link 
                                href="/admin/articles/create"
                                className="flex items-center justify-between p-3.5 rounded-lg border border-gray-100 dark:border-gray-900 hover:border-emerald-500/20 dark:hover:border-emerald-500/30 bg-gray-50/50 hover:bg-emerald-50/10 dark:bg-black/5 dark:hover:bg-emerald-950/10 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                                        <PlusCircle className="h-4.5 w-4.5" />
                                    </div>
                                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Escribir Artículo</span>
                                </div>
                                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                            </Link>

                            {/* Action 2: Taxonomies */}
                            <Link 
                                href="/admin/taxonomies"
                                className="flex items-center justify-between p-3.5 rounded-lg border border-gray-100 dark:border-gray-900 hover:border-amber-500/20 dark:hover:border-amber-500/30 bg-gray-50/50 hover:bg-amber-50/10 dark:bg-black/5 dark:hover:bg-amber-950/10 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
                                        <Tags className="h-4.5 w-4.5" />
                                    </div>
                                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Taxonomías</span>
                                </div>
                                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                            </Link>

                            {/* Action 3: Messages inbox */}
                            <Link 
                                href="/admin/registers"
                                className="flex items-center justify-between p-3.5 rounded-lg border border-gray-100 dark:border-gray-900 hover:border-rose-500/20 dark:hover:border-rose-500/30 bg-gray-50/50 hover:bg-rose-50/10 dark:bg-black/5 dark:hover:bg-rose-950/10 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 group-hover:scale-105 transition-transform">
                                        <Inbox className="h-4.5 w-4.5" />
                                    </div>
                                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Mensajes</span>
                                </div>
                                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                            </Link>

                            {/* Action 4: Menus config */}
                            <Link 
                                href="/admin/menus"
                                className="flex items-center justify-between p-3.5 rounded-lg border border-gray-100 dark:border-gray-900 hover:border-blue-500/20 dark:hover:border-blue-500/30 bg-gray-50/50 hover:bg-blue-50/10 dark:bg-black/5 dark:hover:bg-blue-950/10 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                                        <Menu className="h-4.5 w-4.5" />
                                    </div>
                                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Menús</span>
                                </div>
                                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                            </Link>

                            {/* Action 5: Config */}
                            <Link 
                                href="/admin/configs"
                                className="flex items-center justify-between p-3.5 rounded-lg border border-gray-100 dark:border-gray-900 hover:border-gray-500/20 bg-gray-50/50 hover:bg-gray-100/30 dark:bg-black/5 dark:hover:bg-gray-800/20 transition-all group sm:col-span-2"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 group-hover:scale-105 transition-transform">
                                        <Settings className="h-4.5 w-4.5" />
                                    </div>
                                    <div>
                                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">Configuración del Sitio</span>
                                        <span className="text-[10px] text-gray-400 font-medium">Modifica variables globales, traducciones e idiomas.</span>
                                    </div>
                                </div>
                                <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </Link>
                        </div>
                    </div>

                    {/* Console Right Pane: Activity Log Feed */}
                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161615] p-5 shadow-xs space-y-4 flex flex-col justify-between">
                        <div className="pb-3 border-b border-gray-100 dark:border-gray-900">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                                <Clock className="h-4.5 w-4.5 text-primary-750 dark:text-primary-400" />
                                <span>Actividad Reciente</span>
                            </h3>
                            <p className="text-xs text-gray-400">Registros y auditoría de acciones en la base de datos</p>
                        </div>

                        {/* Logs Feed Container */}
                        <div className="flex-1 overflow-y-auto max-h-[260px] pr-1 space-y-3 pt-2">
                            {recentLogs.length > 0 ? (
                                recentLogs.map((log) => (
                                    <div key={log.id} className="flex gap-3 text-xs">
                                        <div className="mt-0.5 flex flex-col items-center">
                                            <div className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full bg-primary-50 dark:bg-[#20201f] text-primary-700 dark:text-primary-400 border border-primary-200/20">
                                                <Clock className="h-3 w-3" />
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <p className="text-gray-700 dark:text-gray-300 leading-tight">
                                                <span className="font-semibold text-gray-900 dark:text-white">{log.user_name}</span>: {log.comment}
                                            </p>
                                            <span className="text-[10px] text-gray-400 font-medium block">
                                                {log.created_at ? format(new Date(log.created_at), 'dd/MM/yyyy HH:mm') : 'System'}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex items-center justify-center py-10 text-xs italic text-gray-400">
                                    No se encontraron registros de actividad.
                                </div>
                            )}
                        </div>

                        {/* Footer View All Link */}
                        <div className="pt-3 border-t border-gray-100 dark:border-gray-900 flex justify-end">
                            <Link href="/admin/logs" className="text-xs text-primary-750 dark:text-primary-400 hover:underline font-semibold flex items-center gap-0.5">
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
