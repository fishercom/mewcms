import { type BlockData } from '@/blocks/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { diffWords, htmlToText } from '@/lib/word-diff';
import apiClient from '@/services/api';
import { router } from '@inertiajs/react';
import { format } from 'date-fns';
import { Eye, GitCompare, History, Loader2, RotateCcw, Save } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

/** Seconds between autosaves while the form has unsaved changes. */
const AUTOSAVE_SECONDS = 30;

type ContentModule = 'articles' | 'posts';

/** Editor state a revision stores. */
export interface RevisionData {
    title?: string | null;
    content?: string | null;
    blocks?: BlockData[] | null;
    excerpt?: string | null;
    metadata?: unknown;
    status?: string | null;
    published_at?: string | null;
    tag_ids?: number[] | null;
}

interface RevisionSummary {
    id: number;
    title: string;
    status: string | null;
    is_autosave: boolean;
    author: string | null;
    created_at: string;
}

interface Props {
    module: ContentModule;
    /** Id of the saved item; null while creating (only preview is available then). */
    id: number | null;
    /** Current form data. */
    data: object;
    /** Form data as loaded, to detect unsaved changes. */
    initialData: object;
    /** The user's autosave newer than the saved item, if any. */
    autosave?: (RevisionData & { updated_at?: string }) | null;
    /** Load an autosave or revision into the form. */
    onApply: (revision: RevisionData) => void;
    /** Extra fields the preview needs (e.g. the post type). */
    previewExtra?: Record<string, unknown>;
}

const sameData = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Revisions, autosave, unsaved-changes warning and preview for the page and post editors.
 */
export default function ContentEditorTools({ module, id, data, initialData, autosave, onApply, previewExtra = {} }: Props) {
    // The form as loaded; the editor remounts after a save or restore, which resets it
    const baseline = useRef(initialData).current;
    const dirty = !sameData(data, baseline);
    const [pendingAutosave, setPendingAutosave] = useState(autosave ?? null);
    const [autosavedAt, setAutosavedAt] = useState<string | null>(null);
    const [previewing, setPreviewing] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);

    // Latest values for the interval callback
    const dataRef = useRef(data);
    dataRef.current = data;
    const lastAutosaved = useRef<string>(JSON.stringify(baseline));

    // Autosave every 30s while there are changes that were not autosaved yet
    useEffect(() => {
        if (!id) return;
        const timer = window.setInterval(async () => {
            const current = JSON.stringify(dataRef.current);
            if (current === lastAutosaved.current || sameData(dataRef.current, baseline)) return;
            try {
                const { data: result } = await apiClient.post(route(`${module}.autosave`, id), dataRef.current);
                lastAutosaved.current = current;
                setAutosavedAt(result.saved_at);
            } catch {
                // A failed autosave is retried on the next tick
            }
        }, AUTOSAVE_SECONDS * 1000);
        return () => window.clearInterval(timer);
    }, [id, module, baseline]);

    // Warn before leaving with unsaved changes (browser close/reload and in-app links)
    useEffect(() => {
        if (!dirty) return;
        const onBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
        };
        window.addEventListener('beforeunload', onBeforeUnload);
        const removeInertiaGuard = router.on('before', (event) => {
            if (event.detail.visit.method === 'get' && !window.confirm('Hay cambios sin guardar. ¿Salir de todos modos?')) {
                event.preventDefault();
            }
        });
        return () => {
            window.removeEventListener('beforeunload', onBeforeUnload);
            removeInertiaGuard();
        };
    }, [dirty]);

    const preview = async () => {
        // Open the tab right away so the browser does not block it as a popup
        const tab = window.open('about:blank', '_blank');
        setPreviewing(true);
        try {
            const { data: result } = await apiClient.post(route(`${module}.preview`), { ...data, ...previewExtra, id });
            if (tab) tab.location.href = result.url;
            else window.open(result.url, '_blank');
        } catch {
            tab?.close();
            alert('No se pudo generar la vista previa.');
        } finally {
            setPreviewing(false);
        }
    };

    const discardAutosave = async () => {
        if (!id) return;
        await apiClient.delete(route(`${module}.autosave.destroy`, id));
        setPendingAutosave(null);
    };

    return (
        <div className="space-y-3">
            {pendingAutosave && (
                <div className="border-warning/30 bg-warning/10 text-warning flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-xs">
                    <span className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Hay un borrador autoguardado más reciente
                        {pendingAutosave.updated_at && ` (${format(new Date(pendingAutosave.updated_at), 'dd/MM/yyyy HH:mm')})`}.
                    </span>
                    <span className="flex gap-2">
                        <Button
                            type="button"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => {
                                onApply(pendingAutosave);
                                setPendingAutosave(null);
                            }}
                        >
                            Restaurar
                        </Button>
                        <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={discardAutosave}>
                            Descartar
                        </Button>
                    </span>
                </div>
            )}

            <div className="text-muted-foreground flex flex-wrap items-center justify-end gap-2 text-xs">
                {autosavedAt && <span>Autoguardado a las {format(new Date(autosavedAt), 'HH:mm')}</span>}
                {dirty && !autosavedAt && <span>Cambios sin guardar</span>}
                <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={preview} disabled={previewing}>
                    {previewing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
                    Vista previa
                </Button>
                {id && (
                    <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setHistoryOpen(true)}>
                        <History className="h-3.5 w-3.5" />
                        Revisiones
                    </Button>
                )}
            </div>

            {id && (
                <RevisionsSheet
                    module={module}
                    id={id}
                    open={historyOpen}
                    onOpenChange={setHistoryOpen}
                    current={data as Record<string, unknown>}
                    dirty={dirty}
                />
            )}
        </div>
    );
}

interface SheetProps {
    module: ContentModule;
    id: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    current: Record<string, unknown>;
    dirty: boolean;
}

function RevisionsSheet({ module, id, open, onOpenChange, current, dirty }: SheetProps) {
    const [revisions, setRevisions] = useState<RevisionSummary[] | null>(null);
    const [comparing, setComparing] = useState<(RevisionData & { id: number }) | null>(null);

    const load = useCallback(async () => {
        const { data } = await apiClient.get(route(`${module}.revisions.index`, id));
        setRevisions(data.revisions);
    }, [module, id]);

    useEffect(() => {
        if (open) load();
    }, [open, load]);

    const compare = async (revisionId: number) => {
        const { data } = await apiClient.get(route(`${module}.revisions.show`, { id, revisionId }));
        setComparing(data);
    };

    const restore = (revisionId: number) => {
        const message = dirty
            ? 'Tienes cambios sin guardar que se perderán. ¿Restaurar esta revisión?'
            : '¿Restaurar esta revisión? El estado actual se guardará como una revisión nueva.';
        if (!window.confirm(message)) return;

        // Reload the editor with the restored data
        router.post(route(`${module}.revisions.restore`, { id, revisionId }), {}, { preserveState: false, preserveScroll: true });
    };

    return (
        <>
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent className="w-full overflow-y-auto sm:max-w-md">
                    <SheetHeader>
                        <SheetTitle>Revisiones</SheetTitle>
                        <SheetDescription>Cada vez que guardas se crea una revisión. Se conservan las últimas 25.</SheetDescription>
                    </SheetHeader>
                    <div className="space-y-2 px-4 pb-6">
                        {revisions === null && <Loader2 className="text-muted-foreground mx-auto h-5 w-5 animate-spin" />}
                        {revisions?.length === 0 && <p className="text-muted-foreground text-sm italic">Aún no hay revisiones.</p>}
                        {revisions?.map((revision, index) => (
                            <div key={revision.id} className="border-border/70 space-y-2 rounded-lg border p-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium">{revision.title}</p>
                                        <p className="text-muted-foreground text-xs">
                                            {format(new Date(revision.created_at), 'dd/MM/yyyy HH:mm')}
                                            {revision.author && ` · ${revision.author}`}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 gap-1">
                                        {revision.is_autosave && <Badge variant="outline">Autoguardado</Badge>}
                                        {!revision.is_autosave && index === revisions.findIndex((r) => !r.is_autosave) && (
                                            <Badge variant="secondary">Actual</Badge>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-7 gap-1 text-xs"
                                        onClick={() => compare(revision.id)}
                                    >
                                        <GitCompare className="h-3.5 w-3.5" />
                                        Comparar
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 gap-1 text-xs"
                                        onClick={() => restore(revision.id)}
                                    >
                                        <RotateCcw className="h-3.5 w-3.5" />
                                        Restaurar
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </SheetContent>
            </Sheet>

            <Dialog open={comparing !== null} onOpenChange={(isOpen) => !isOpen && setComparing(null)}>
                <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Comparar revisión</DialogTitle>
                        <DialogDescription>
                            <span className="bg-destructive/15 text-destructive rounded px-1 line-through">Revisión</span> frente a{' '}
                            <span className="bg-success/15 text-success rounded px-1">editor actual</span>
                        </DialogDescription>
                    </DialogHeader>
                    {comparing && (
                        <div className="space-y-4 text-sm">
                            <DiffField label="Título" before={comparing.title ?? ''} after={String(current.title ?? '')} />
                            <DiffField label="Extracto" before={comparing.excerpt ?? ''} after={String(current.excerpt ?? '')} />
                            <DiffField label="Contenido" before={htmlToText(comparing.content)} after={htmlToText(String(current.content ?? ''))} />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

function DiffField({ label, before, after }: { label: string; before: string; after: string }) {
    const parts = diffWords(before, after);
    const unchanged = before === after;

    return (
        <div className="space-y-1">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                {label} {unchanged && <span className="font-normal normal-case">(sin cambios)</span>}
            </p>
            <div className="border-border/70 bg-muted/20 rounded-md border p-3 leading-relaxed whitespace-pre-wrap">
                {parts.length === 0 && <span className="text-muted-foreground italic">Vacío</span>}
                {parts.map((part, i) =>
                    part.type === 'same' ? (
                        <span key={i}>{part.text}</span>
                    ) : part.type === 'added' ? (
                        <ins key={i} className="bg-success/15 text-success rounded no-underline">
                            {part.text}
                        </ins>
                    ) : (
                        <del key={i} className="bg-destructive/15 text-destructive rounded">
                            {part.text}
                        </del>
                    ),
                )}
            </div>
        </div>
    );
}
