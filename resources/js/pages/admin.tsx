import AppLayout from '@/layouts/app-layout';
import { generateBreadcrumb } from '@/lib/breadcrumbs';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    Activity,
    ArrowDownRight,
    ArrowUpRight,
    CalendarClock,
    ChevronRight,
    ExternalLink,
    FilePen,
    FileText,
    HardDrive,
    Inbox,
    PenTool,
    Plus,
    SearchCheck,
} from 'lucide-react';
import { type ReactNode } from 'react';

interface DashboardProps {
    can: { articles: boolean; posts: boolean; registers: boolean; media: boolean; logs: boolean };
    kpis: {
        messages: { unread: number; this_week: number; last_week: number } | null;
        published: { total: number; this_month: number; last_month: number } | null;
        pipeline: { drafts: number; scheduled: number; next: { title: string; at: string; edit_url: string } | null } | null;
        seo: { missing: number; total: number; items: { title: string; edit_url: string }[] } | null;
    };
    inbox: { id: number; name: string; email: string | null; form: string | null; excerpt: string; created_at: string | null }[];
    recentContent: {
        key: string;
        title: string;
        type: string;
        state: 'draft' | 'scheduled' | 'hidden' | 'published';
        updated_at: string | null;
        edit_url: string;
    }[];
    trend: { label: string; published: number | null; messages: number | null }[];
    recentLogs: { id: number; comment: string; user_name: string; created_at: string | null }[];
    storage: { files: number; size: string } | null;
}

const breadcrumbs: BreadcrumbItem[] = generateBreadcrumb('', '', '/admin');

const ago = (iso: string | null) => (iso ? formatDistanceToNow(new Date(iso), { addSuffix: true, locale: es }) : '');

const STATES: Record<DashboardProps['recentContent'][number]['state'], { label: string; className: string }> = {
    published: { label: 'Publicado', className: 'bg-success-soft text-success' },
    scheduled: { label: 'Programado', className: 'bg-primary-soft text-primary-soft-foreground' },
    draft: { label: 'Borrador', className: 'bg-warning/10 text-warning' },
    hidden: { label: 'Oculto', className: 'bg-muted text-muted-foreground' },
};

/**
 * Admin home. Answers three questions in order: what needs me today (the cards and the
 * inbox), where did I leave off (recent content), and how is the site doing (trend).
 */
export default function Dashboard() {
    const { can, kpis, inbox = [], recentContent = [], trend = [], recentLogs = [], storage } = usePage().props as unknown as DashboardProps;
    const auth = usePage().props.auth as { user?: { name?: string } };
    const firstName = (auth?.user?.name || '').split(' ')[0];
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

    const cards = [
        kpis.messages && (
            <KpiCard
                key="messages"
                href="/admin/registers"
                icon={<Inbox className="h-4 w-4" />}
                label="Mensajes sin leer"
                value={kpis.messages.unread}
                tone={kpis.messages.unread > 0 ? 'attention' : 'calm'}
                footer={<Delta current={kpis.messages.this_week} previous={kpis.messages.last_week} unit="esta semana" />}
            />
        ),
        kpis.published && (
            <KpiCard
                key="published"
                href={can.articles ? '/admin/articles' : '/admin/posts'}
                icon={<FileText className="h-4 w-4" />}
                label="Contenido publicado"
                value={kpis.published.total}
                footer={<Delta current={kpis.published.this_month} previous={kpis.published.last_month} unit="este mes" />}
            />
        ),
        kpis.pipeline && (
            <KpiCard
                key="pipeline"
                href={kpis.pipeline.next?.edit_url ?? (can.articles ? '/admin/articles?status=draft' : '/admin/posts')}
                icon={<CalendarClock className="h-4 w-4" />}
                label="En preparación"
                value={kpis.pipeline.drafts + kpis.pipeline.scheduled}
                footer={
                    <span className="truncate">
                        {kpis.pipeline.drafts} {kpis.pipeline.drafts === 1 ? 'borrador' : 'borradores'} · {kpis.pipeline.scheduled}{' '}
                        {kpis.pipeline.scheduled === 1 ? 'programado' : 'programados'}
                        {kpis.pipeline.next && <> · próximo {format(new Date(kpis.pipeline.next.at), 'd MMM, HH:mm', { locale: es })}</>}
                    </span>
                }
            />
        ),
        kpis.seo && (
            <KpiCard
                key="seo"
                href={kpis.seo.items[0]?.edit_url ?? '/admin/articles'}
                icon={<SearchCheck className="h-4 w-4" />}
                label="Sin descripción SEO"
                value={kpis.seo.missing}
                tone={kpis.seo.missing > 0 ? 'attention' : 'calm'}
                footer={
                    <span>
                        {kpis.seo.total > 0
                            ? `${Math.round(((kpis.seo.total - kpis.seo.missing) / kpis.seo.total) * 100)}% de lo publicado está completo`
                            : 'Aún no hay contenido publicado'}
                    </span>
                }
            />
        ),
    ].filter(Boolean);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Panel de Control" />

            <div className="mx-auto w-full max-w-7xl flex-1 space-y-6 p-4 sm:p-6">
                {/* Greeting and the actions people take most */}
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-muted-foreground text-xs font-medium capitalize">
                            {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
                        </p>
                        <h1 className="text-foreground text-2xl font-bold tracking-tight">
                            {greeting}
                            {firstName ? `, ${firstName}` : ''}
                        </h1>
                        <p className="text-muted-foreground mt-0.5 text-sm">{summaryLine(kpis)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {can.articles && (
                            <ActionLink href="/admin/articles/create" primary icon={<Plus className="h-4 w-4" />}>
                                Nueva página
                            </ActionLink>
                        )}
                        {can.posts && (
                            <ActionLink href="/admin/posts/create?post_type=post" icon={<PenTool className="h-4 w-4" />}>
                                Nueva entrada
                            </ActionLink>
                        )}
                        <a
                            href="/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="border-border bg-card text-foreground hover:bg-muted inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors"
                        >
                            <ExternalLink className="h-4 w-4" />
                            Ver sitio
                        </a>
                    </div>
                </div>

                {/* What needs attention */}
                {cards.length > 0 && (
                    <div className={cn('grid gap-4 sm:grid-cols-2', cards.length >= 4 && 'lg:grid-cols-4', cards.length === 3 && 'lg:grid-cols-3')}>
                        {cards}
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-5">
                    {/* Unread messages: the leads waiting for an answer */}
                    {can.registers && (
                        <Panel
                            className="lg:col-span-3"
                            icon={<Inbox className="h-4 w-4" />}
                            title="Mensajes por responder"
                            action={{ href: '/admin/registers', label: 'Ver todos' }}
                        >
                            {inbox.length === 0 ? (
                                <Empty>Estás al día: no hay mensajes sin leer.</Empty>
                            ) : (
                                <ul className="divide-border/60 -mx-1 divide-y">
                                    {inbox.map((message) => (
                                        <li key={message.id}>
                                            <Link
                                                href={`/admin/registers/${message.id}`}
                                                className="hover:bg-muted/50 flex items-start gap-3 rounded-lg px-1 py-2.5 transition-colors"
                                            >
                                                <span className="bg-primary mt-1.5 h-2 w-2 shrink-0 rounded-full" aria-hidden />
                                                <span className="min-w-0 flex-1">
                                                    <span className="flex items-baseline justify-between gap-2">
                                                        <span className="text-foreground truncate text-sm font-semibold">{message.name}</span>
                                                        <span className="text-muted-foreground shrink-0 text-[11px]">{ago(message.created_at)}</span>
                                                    </span>
                                                    <span className="text-muted-foreground block truncate text-xs">
                                                        {message.form && <span className="text-foreground/80 font-medium">{message.form} · </span>}
                                                        {message.excerpt || message.email}
                                                    </span>
                                                </span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Panel>
                    )}

                    {/* Where work was left */}
                    {(can.articles || can.posts) && (
                        <Panel
                            className={can.registers ? 'lg:col-span-2' : 'lg:col-span-5'}
                            icon={<FilePen className="h-4 w-4" />}
                            title="Continúa donde lo dejaste"
                        >
                            {recentContent.length === 0 ? (
                                <Empty>Todavía no hay páginas ni entradas.</Empty>
                            ) : (
                                <ul className="-mx-1 space-y-0.5">
                                    {recentContent.map((item) => (
                                        <li key={item.key}>
                                            <Link
                                                href={item.edit_url}
                                                className="group hover:bg-muted/50 flex items-center gap-3 rounded-lg px-1 py-2 transition-colors"
                                            >
                                                <span className="min-w-0 flex-1">
                                                    <span className="text-foreground block truncate text-sm font-medium">{item.title}</span>
                                                    <span className="text-muted-foreground block text-[11px]">
                                                        {item.type} · editado {ago(item.updated_at)}
                                                    </span>
                                                </span>
                                                <span
                                                    className={cn(
                                                        'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                                                        STATES[item.state].className,
                                                    )}
                                                >
                                                    {STATES[item.state].label}
                                                </span>
                                                <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Panel>
                    )}
                </div>

                <div className="grid gap-6 lg:grid-cols-5">
                    {/* How the site is doing */}
                    {trend.length > 0 && (
                        <Panel className="lg:col-span-3" icon={<Activity className="h-4 w-4" />} title="Últimos 6 meses">
                            <TrendChart data={trend} />
                        </Panel>
                    )}

                    {(can.logs || storage) && (
                        <Panel
                            className={trend.length > 0 ? 'lg:col-span-2' : 'lg:col-span-5'}
                            icon={<Activity className="h-4 w-4" />}
                            title="Actividad del equipo"
                            action={can.logs ? { href: '/admin/logs', label: 'Ver registro' } : undefined}
                        >
                            {can.logs &&
                                (recentLogs.length === 0 ? (
                                    <Empty>Sin actividad registrada.</Empty>
                                ) : (
                                    <ul className="space-y-2.5">
                                        {recentLogs.map((log) => (
                                            <li key={log.id} className="text-xs">
                                                <p className="text-foreground line-clamp-1">{log.comment}</p>
                                                <p className="text-muted-foreground text-[11px]">
                                                    {log.user_name} · {ago(log.created_at)}
                                                </p>
                                            </li>
                                        ))}
                                    </ul>
                                ))}
                            {storage && (
                                <Link
                                    href="/admin/media"
                                    className="border-border/60 text-muted-foreground hover:text-foreground mt-4 flex items-center gap-2 border-t pt-3 text-[11px]"
                                >
                                    <HardDrive className="h-3.5 w-3.5" />
                                    Biblioteca de medios: {storage.files} archivos · {storage.size}
                                </Link>
                            )}
                        </Panel>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

/** One sentence that tells the user what matters today */
function summaryLine(kpis: DashboardProps['kpis']): string {
    const parts: string[] = [];
    if (kpis.messages?.unread) parts.push(`${kpis.messages.unread} ${kpis.messages.unread === 1 ? 'mensaje espera' : 'mensajes esperan'} respuesta`);
    if (kpis.pipeline?.drafts) parts.push(`${kpis.pipeline.drafts} ${kpis.pipeline.drafts === 1 ? 'borrador pendiente' : 'borradores pendientes'}`);
    if (kpis.seo?.missing) parts.push(`${kpis.seo.missing} sin descripción SEO`);
    return parts.length > 0 ? `Hoy: ${parts.join(', ')}.` : 'Todo al día. Buen momento para publicar algo nuevo.';
}

function KpiCard({
    href,
    icon,
    label,
    value,
    footer,
    tone = 'calm',
}: {
    href: string;
    icon: ReactNode;
    label: string;
    value: number;
    footer: ReactNode;
    tone?: 'calm' | 'attention';
}) {
    return (
        <Link
            href={href}
            className={cn(
                'group bg-card hover:border-primary/40 rounded-xl border p-4 shadow-2xs transition-all hover:shadow-md',
                tone === 'attention' ? 'border-warning/40' : 'border-border/70',
            )}
        >
            <div className="text-muted-foreground flex items-center justify-between text-xs font-medium">
                <span>{label}</span>
                <span className={cn('rounded-lg p-1.5', tone === 'attention' ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary')}>
                    {icon}
                </span>
            </div>
            <p className="text-foreground mt-2 text-3xl font-bold tracking-tight tabular-nums">{value}</p>
            <div className="text-muted-foreground mt-1 flex items-center gap-1 text-[11px]">{footer}</div>
        </Link>
    );
}

/** "12 esta semana ↑ 20 %" compared with the previous period */
function Delta({ current, previous, unit }: { current: number; previous: number; unit: string }) {
    const change = previous > 0 ? Math.round(((current - previous) / previous) * 100) : null;
    return (
        <>
            <span>
                {current} {unit}
            </span>
            {change !== null && change !== 0 && (
                <span className={cn('inline-flex items-center font-semibold', change > 0 ? 'text-success' : 'text-destructive')}>
                    {change > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {Math.abs(change)}%
                </span>
            )}
        </>
    );
}

function Panel({
    title,
    icon,
    action,
    className,
    children,
}: {
    title: string;
    icon: ReactNode;
    action?: { href: string; label: string };
    className?: string;
    children: ReactNode;
}) {
    return (
        <section className={cn('border-border/70 bg-card rounded-xl border p-4 shadow-2xs', className)}>
            <div className="mb-3 flex items-center justify-between">
                <h2 className="text-foreground flex items-center gap-2 text-sm font-semibold">
                    <span className="text-primary">{icon}</span>
                    {title}
                </h2>
                {action && (
                    <Link href={action.href} className="text-primary text-xs font-medium hover:underline">
                        {action.label}
                    </Link>
                )}
            </div>
            {children}
        </section>
    );
}

function Empty({ children }: { children: ReactNode }) {
    return <p className="text-muted-foreground py-6 text-center text-xs">{children}</p>;
}

function ActionLink({ href, icon, primary, children }: { href: string; icon: ReactNode; primary?: boolean; children: ReactNode }) {
    return (
        <Link
            href={href}
            className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors',
                primary ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'border-border bg-card text-foreground hover:bg-muted border',
            )}
        >
            {icon}
            {children}
        </Link>
    );
}

/** Grouped bars: content published and messages received per month */
function TrendChart({ data }: { data: DashboardProps['trend'] }) {
    const showPublished = data.some((d) => d.published !== null);
    const showMessages = data.some((d) => d.messages !== null);
    const max = Math.max(1, ...data.map((d) => Math.max(d.published ?? 0, d.messages ?? 0)));

    return (
        <div>
            <div className="flex h-40 items-end gap-3" role="img" aria-label="Contenido publicado y mensajes recibidos por mes">
                {data.map((d) => (
                    <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
                        <div className="flex h-32 w-full items-end justify-center gap-1">
                            {showPublished && (
                                <div
                                    className="bg-primary w-1/3 max-w-5 rounded-t"
                                    style={{ height: `${((d.published ?? 0) / max) * 100}%`, minHeight: 2 }}
                                    title={`${d.published ?? 0} publicados`}
                                />
                            )}
                            {showMessages && (
                                <div
                                    className="bg-primary/35 w-1/3 max-w-5 rounded-t"
                                    style={{ height: `${((d.messages ?? 0) / max) * 100}%`, minHeight: 2 }}
                                    title={`${d.messages ?? 0} mensajes`}
                                />
                            )}
                        </div>
                        <span className="text-muted-foreground text-[10px] capitalize">{d.label}</span>
                    </div>
                ))}
            </div>
            <div className="text-muted-foreground mt-3 flex justify-center gap-4 text-[11px]">
                {showPublished && (
                    <span className="flex items-center gap-1.5">
                        <span className="bg-primary h-2.5 w-2.5 rounded-sm" /> Publicado
                    </span>
                )}
                {showMessages && (
                    <span className="flex items-center gap-1.5">
                        <span className="bg-primary/35 h-2.5 w-2.5 rounded-sm" /> Mensajes
                    </span>
                )}
            </div>
        </div>
    );
}
