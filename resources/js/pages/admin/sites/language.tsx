import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import ModuleLayout from '@/layouts/module/layout';
import { t } from '@/lib/i18n';
import apiClient from '@/services/api';
import { Link, router, usePage } from '@inertiajs/react';
import { isAxiosError } from 'axios';
import { CheckCircle2, FileText, List, Loader2, Newspaper, Pause, Play, Send, Sparkles, Type } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Lang {
    id: number;
    name: string;
    iso: string;
}

interface Task {
    type: 'page' | 'post' | 'menu' | 'texts' | 'links';
    id: number | null;
    title: string;
}

interface Draft {
    id: number;
    type: 'page' | 'post';
    title: string;
    edit_url: string;
    url: string;
}

interface Props {
    site_id: number;
    site_name: string;
    target: Lang;
    source: Lang | null;
    summary: { pages: number; posts: number; menus: number; texts: number; cost: number | null };
    tasks: Task[];
    drafts: Draft[];
    ai: { available: boolean; spent: number; budget: number } | null;
    [key: string]: unknown;
}

const money = (value: number) => (value < 0.01 ? '< US$0.01' : `US$${value.toFixed(2)}`);

/**
 * "Preparar versión en …": copies the site's pages, posts, menus and theme texts into a
 * new language (translated by the AI when chosen), one request per item, then lists the
 * drafts to review and publish.
 */
export default function Language() {
    const { site_id, site_name, target, source, summary, tasks, drafts, ai } = usePage<Props>().props;
    const [useAi, setUseAi] = useState(Boolean(ai?.available));
    const [running, setRunning] = useState(false);
    const [done, setDone] = useState(0);
    const [current, setCurrent] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [finished, setFinished] = useState(false);
    // "Pausar" stops the run after the item being processed
    const pausing = useRef(false);
    const [pauseAsked, setPauseAsked] = useState(false);
    // Seconds spent on the item being processed: a long page takes the AI a while
    const [seconds, setSeconds] = useState(0);
    useEffect(() => {
        setSeconds(0);
        if (!running) {
            return;
        }
        const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);

        return () => window.clearInterval(timer);
    }, [running, current]);

    // Theme texts are only translated by the AI
    const queue = tasks.filter((task) => useAi || task.type !== 'texts');
    const work = queue.filter((task) => task.type !== 'links').length;
    const overBudget = ai !== null && summary.cost !== null && ai.spent + summary.cost > ai.budget;

    // Leaving the page stops the run: the browser asks first
    useEffect(() => {
        if (!running) {
            return;
        }
        const warn = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = '';
        };
        window.addEventListener('beforeunload', warn);
        const removeRouterWarning = router.on('before', () =>
            window.confirm(t('La preparación se detendrá si sales de esta página. ¿Salir de todos modos?')),
        );

        return () => {
            window.removeEventListener('beforeunload', warn);
            removeRouterWarning();
        };
    }, [running]);

    // Once the run is over (and the leave warning gone), show the drafts it made
    useEffect(() => {
        if (finished) {
            router.reload({ only: ['summary', 'tasks', 'drafts'] });
        }
    }, [finished]);

    const start = async () => {
        setRunning(true);
        setError(null);
        pausing.current = false;
        setPauseAsked(false);
        for (let index = done; index < queue.length; index++) {
            if (pausing.current) {
                setRunning(false);
                setCurrent(null);
                return;
            }
            const task = queue[index];
            setCurrent(task.title);
            try {
                // A model that never answers must not leave the run hanging: give up after 5 minutes
                await apiClient.post(
                    route('sites.languages.step', [site_id, target.id]),
                    { type: task.type, id: task.id, ai: useAi },
                    { timeout: 5 * 60 * 1000 },
                );
            } catch (e) {
                const timedOut = isAxiosError(e) && e.code === 'ECONNABORTED';
                setError(
                    (isAxiosError(e) && e.response?.data?.message) ||
                        (timedOut
                            ? t('La IA no respondió a tiempo con «:title». Pulsa Continuar para reintentar.', { title: task.title })
                            : t('No se pudo completar «:title».', { title: task.title })),
                );
                setRunning(false);
                return;
            }
            setDone(index + 1);
        }
        setRunning(false);
        setCurrent(null);
        setFinished(true);
    };

    const publishAll = () => {
        if (window.confirm(t('¿Publicar las :count versiones en :lang?', { count: String(drafts.length), lang: target.name }))) {
            router.post(route('sites.languages.publish', [site_id, target.id]), {}, { preserveScroll: true });
        }
    };

    const counts = [
        { icon: FileText, label: t('Páginas'), value: summary.pages },
        { icon: Newspaper, label: t('Posts'), value: summary.posts },
        { icon: List, label: t('Menús'), value: summary.menus },
        ...(useAi && summary.texts > 0 ? [{ icon: Type, label: t('Textos del tema'), value: summary.texts }] : []),
    ];
    const progress = queue.length > 0 ? Math.round((done / queue.length) * 100) : 0;

    return (
        <ModuleLayout view={t('Preparar versión en :lang', { lang: target.name })}>
            <div className="max-w-3xl space-y-8">
                <div className="space-y-2">
                    <p className="text-muted-foreground text-sm">
                        {t(
                            'Copia las páginas, los posts y los menús de :site desde :source a :lang. Las páginas y los posts quedan en borrador para que los revises antes de publicarlos.',
                            { site: site_name, source: source?.name ?? '', lang: target.name },
                        )}
                    </p>
                </div>

                {work === 0 && !finished ? (
                    <div className="border-border bg-muted/40 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm">
                        <CheckCircle2 className="text-success h-4 w-4" />
                        {t('Todo el contenido ya tiene su versión en :lang.', { lang: target.name })}
                    </div>
                ) : (
                    <div className="border-border space-y-5 rounded-lg border p-5">
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {counts.map(({ icon: Icon, label, value }) => (
                                <div key={label} className="bg-muted/40 rounded-md px-3 py-2">
                                    <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                                        <Icon className="h-3.5 w-3.5" />
                                        {label}
                                    </div>
                                    <div className="text-foreground text-xl font-semibold">{value}</div>
                                </div>
                            ))}
                        </div>

                        {ai ? (
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="use-ai"
                                        checked={useAi}
                                        disabled={running || done > 0 || !ai.available}
                                        onCheckedChange={() => setUseAi(!useAi)}
                                    />
                                    <Label htmlFor="use-ai" className="flex items-center gap-1.5 font-normal">
                                        <Sparkles className="text-primary h-4 w-4" />
                                        {t('Traducir con IA')}
                                    </Label>
                                </div>
                                <p className="text-muted-foreground text-xs">
                                    {useAi
                                        ? summary.cost !== null
                                            ? t('Costo estimado: :cost. Este mes llevas :spent de :budget.', {
                                                  cost: money(summary.cost),
                                                  spent: money(ai.spent),
                                                  budget: money(ai.budget),
                                              })
                                            : t('El modelo configurado no tiene precio: el costo no se puede estimar.')
                                        : t('Sin IA se copia el contenido tal cual, para traducirlo a mano desde cada editor.')}
                                </p>
                                {!ai.available && (
                                    <p className="text-destructive text-xs">{t('Se alcanzó el presupuesto mensual del asistente IA.')}</p>
                                )}
                                {useAi && overBudget && (
                                    <p className="text-destructive text-xs">
                                        {t('El costo estimado pasa el presupuesto del mes: la traducción se detendrá al llegar al límite.')}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-xs">
                                {t('El contenido se copia tal cual, para traducirlo a mano desde cada editor.')}
                            </p>
                        )}

                        {!running && done > 0 && (
                            <div className="space-y-1.5">
                                <div className="bg-muted h-2 overflow-hidden rounded-full">
                                    <div className="bg-primary h-full transition-all" style={{ width: `${progress}%` }} />
                                </div>
                                <p className="text-muted-foreground text-xs">
                                    {finished
                                        ? t('Listo.')
                                        : current
                                          ? t(':done de :total: :title', { done: String(done), total: String(queue.length), title: current })
                                          : t(':done de :total', { done: String(done), total: String(queue.length) })}
                                </p>
                            </div>
                        )}

                        {error && <p className="text-destructive text-sm">{error}</p>}

                        {!finished && (
                            <Button onClick={start} disabled={running} className="gap-1.5">
                                {running ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : useAi ? (
                                    <Sparkles className="h-4 w-4" />
                                ) : (
                                    <Play className="h-4 w-4" />
                                )}
                                {running ? t('Preparando…') : done > 0 ? t('Continuar') : useAi ? t('Traducir todo con IA') : t('Copiar todo')}
                            </Button>
                        )}
                        {!finished && (
                            <p className="text-muted-foreground text-xs">
                                {t(
                                    'Mientras se prepara, el admin queda bloqueado en esta pestaña. Puedes pausar y continuar después sin perder lo hecho.',
                                )}
                            </p>
                        )}
                    </div>
                )}

                {drafts.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h3 className="text-foreground font-semibold">{t('Borradores para revisar')}</h3>
                                <p className="text-muted-foreground text-xs">
                                    {t('Revisa cada versión y, cuando estén bien, publícalas todas a la vez.')}
                                </p>
                            </div>
                            <Button onClick={publishAll} disabled={running} className="gap-1.5">
                                <Send className="h-4 w-4" />
                                {t('Publicar todas')}
                            </Button>
                        </div>
                        <ul className="divide-border border-border divide-y rounded-lg border text-sm">
                            {drafts.map((draft) => (
                                <li key={`${draft.type}-${draft.id}`} className="flex items-center justify-between gap-3 px-4 py-2.5">
                                    <span className="flex min-w-0 items-center gap-2">
                                        {draft.type === 'page' ? (
                                            <FileText className="text-muted-foreground h-4 w-4 shrink-0" />
                                        ) : (
                                            <Newspaper className="text-muted-foreground h-4 w-4 shrink-0" />
                                        )}
                                        <Link href={draft.edit_url} className="text-foreground truncate hover:underline">
                                            {draft.title}
                                        </Link>
                                        <Badge variant="outline" className="shrink-0">
                                            {t('Borrador')}
                                        </Badge>
                                    </span>
                                    <span className="text-muted-foreground shrink-0 truncate text-xs">{draft.url}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
            {running && (
                <div
                    className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="border-border bg-card w-full max-w-md space-y-4 rounded-xl border p-6 shadow-xl">
                        <div className="flex items-center gap-2">
                            <Loader2 className="text-primary h-5 w-5 animate-spin" />
                            <h2 className="text-foreground font-semibold">{t('Preparando versión en :lang', { lang: target.name })}</h2>
                        </div>
                        <div className="space-y-1.5">
                            <div className="bg-muted h-2 overflow-hidden rounded-full">
                                <div className="bg-primary h-full transition-all" style={{ width: `${progress}%` }} />
                            </div>
                            <p className="text-muted-foreground flex justify-between gap-2 text-xs">
                                <span className="truncate">
                                    {current
                                        ? t(':done de :total: :title', { done: String(done), total: String(queue.length), title: current })
                                        : t(':done de :total', { done: String(done), total: String(queue.length) })}
                                </span>
                                <span className="shrink-0 tabular-nums">{t(':seconds s', { seconds: String(seconds) })}</span>
                            </p>
                            {useAi && seconds >= 15 && (
                                <p className="text-muted-foreground text-xs">
                                    {t('La IA está traduciendo esta página. Las páginas largas pueden tardar uno o dos minutos.')}
                                </p>
                            )}
                        </div>
                        <div className="text-foreground rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs">
                            {t(
                                'No cierres esta pestaña: es la que va procesando cada página. Puedes trabajar en otra pestaña mientras tanto. Si se cierra, se detiene sin perder lo hecho y puedes continuar después desde aquí.',
                            )}
                        </div>
                        <div className="flex justify-end">
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5"
                                disabled={pauseAsked}
                                onClick={() => {
                                    pausing.current = true;
                                    setPauseAsked(true);
                                }}
                            >
                                <Pause className="h-3.5 w-3.5" />
                                {pauseAsked ? t('Pausando…') : t('Pausar')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </ModuleLayout>
    );
}
