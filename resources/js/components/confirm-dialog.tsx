import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { AlertTriangle, HelpCircle, Trash2, type LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

/**
 * The admin's one confirmation dialog. Every "are you sure?" goes through confirmDialog(),
 * which resolves true when the action is confirmed and false when it is cancelled.
 *
 * danger  → deleting or moving to the trash (red, trash icon)
 * warning → losing work: leaving with unsaved changes, replacing content (amber)
 * info    → anything else that asks first: publishing, restoring (brand colour)
 */
export type ConfirmTone = 'danger' | 'warning' | 'info';

export interface ConfirmOptions {
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: ConfirmTone;
}

interface Request extends ConfirmOptions {
    resolve: (confirmed: boolean) => void;
}

// One dialog at a time: a new request answers the previous one with "cancel"
let current: Request | null = null;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
    current?.resolve(false);

    return new Promise((resolve) => {
        current = { ...options, resolve };
        emit();
    });
}

function answer(confirmed: boolean) {
    const request = current;
    current = null;
    emit();
    request?.resolve(confirmed);
}

const subscribe = (listener: () => void) => {
    listeners.add(listener);

    return () => listeners.delete(listener);
};

const TONES: Record<ConfirmTone, { icon: LucideIcon; badge: string; button: 'destructive' | 'default'; confirmLabel: string }> = {
    danger: { icon: Trash2, badge: 'bg-destructive-soft text-destructive', button: 'destructive', confirmLabel: 'Eliminar' },
    warning: { icon: AlertTriangle, badge: 'bg-warning-soft text-warning', button: 'default', confirmLabel: 'Continuar' },
    info: { icon: HelpCircle, badge: 'bg-primary-soft text-primary-soft-foreground', button: 'default', confirmLabel: 'Aceptar' },
};

/**
 * Renders the dialog that confirmDialog() asks for. Mounted once, next to the Inertia app.
 */
export function ConfirmDialogHost() {
    const request = useSyncExternalStore(
        subscribe,
        () => current,
        () => null,
    );
    // Keep the last request on screen while the closing animation runs
    const [shown, setShown] = useState<Request | null>(null);
    const confirmRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (request) setShown(request);
    }, [request]);

    const view = request ?? shown;
    if (!view) return null;

    const tone = TONES[view.tone ?? 'danger'];
    const Icon = tone.icon;

    return (
        <Dialog open={request !== null} onOpenChange={(open) => !open && answer(false)}>
            <DialogContent
                className="gap-0 overflow-hidden p-0 sm:max-w-md"
                onOpenAutoFocus={(event) => {
                    // Focus the safe choice for deletions; the main action otherwise
                    if (view.tone === undefined || view.tone === 'danger') return;
                    event.preventDefault();
                    confirmRef.current?.focus();
                }}
            >
                <div className="flex gap-4 p-6 pr-10">
                    <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-full', tone.badge)}>
                        <Icon className="size-5" />
                    </span>
                    <DialogHeader className="gap-1.5 pt-1 text-left">
                        <DialogTitle className="text-base leading-snug">{view.title}</DialogTitle>
                        {view.description ? (
                            <DialogDescription className="leading-relaxed">{view.description}</DialogDescription>
                        ) : (
                            <DialogDescription className="sr-only">{view.title}</DialogDescription>
                        )}
                    </DialogHeader>
                </div>
                <DialogFooter className="bg-muted/50 border-t px-6 py-4">
                    <Button variant="outline" onClick={() => answer(false)}>
                        {view.cancelLabel ?? t('Cancelar')}
                    </Button>
                    <Button ref={confirmRef} variant={tone.button} onClick={() => answer(true)}>
                        {view.confirmLabel ?? t(tone.confirmLabel)}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
