import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { router } from '@inertiajs/react';
import { ArchiveRestore, Eye, EyeOff, Trash2, X } from 'lucide-react';
import { useState } from 'react';

export type BulkAction = 'publish' | 'draft' | 'trash' | 'restore' | 'force_delete';

const CONFIRMATIONS: Partial<Record<BulkAction, string>> = {
    trash: '¿Mover a la papelera los registros seleccionados?',
    force_delete: '¿Eliminar definitivamente los registros seleccionados? Esta acción no se puede deshacer.',
};

/**
 * Post a bulk action to a "{resource}.bulk" route and report validation errors.
 */
export function runBulkAction(routeName: string, action: BulkAction, ids: number[], onSuccess?: () => void) {
    const confirmation = CONFIRMATIONS[action];
    if (confirmation && !window.confirm(confirmation)) {
        return;
    }

    router.post(
        route(routeName),
        { action, ids },
        {
            preserveScroll: true,
            onSuccess: () => onSuccess?.(),
            onError: (errors) => alert(Object.values(errors)[0] ?? 'Ocurrió un error al aplicar la acción.'),
        },
    );
}

/**
 * Row selection for a list, reset whenever the visible rows change.
 */
export function useRowSelection(rowIds: number[]) {
    const [selected, setSelected] = useState<number[]>([]);
    const [rowKey, setRowKey] = useState(rowIds.join(','));

    const currentKey = rowIds.join(',');
    if (currentKey !== rowKey) {
        setRowKey(currentKey);
        setSelected((prev) => prev.filter((id) => rowIds.includes(id)));
    }

    const allSelected = rowIds.length > 0 && rowIds.every((id) => selected.includes(id));

    return {
        selected,
        isSelected: (id: number) => selected.includes(id),
        toggle: (id: number) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
        toggleAll: () => setSelected(allSelected ? [] : rowIds),
        clear: () => setSelected([]),
        allState: allSelected ? true : selected.length > 0 ? ('indeterminate' as const) : false,
    };
}

export function SelectAllCheckbox({ state, onToggle }: { state: boolean | 'indeterminate'; onToggle: () => void }) {
    return <Checkbox checked={state} onCheckedChange={onToggle} aria-label="Seleccionar todo" />;
}

export function RowCheckbox({ checked, onToggle, label }: { checked: boolean; onToggle: () => void; label: string }) {
    return <Checkbox checked={checked} onCheckedChange={onToggle} aria-label={`Seleccionar ${label}`} />;
}

interface BarProps {
    routeName: string;
    selected: number[];
    trash: boolean;
    onClear: () => void;
}

/**
 * Toolbar shown while rows are selected.
 */
export function BulkActionsBar({ routeName, selected, trash, onClear }: BarProps) {
    if (selected.length === 0) {
        return null;
    }

    const run = (action: BulkAction) => runBulkAction(routeName, action, selected, onClear);

    return (
        <div className="border-border/70 bg-muted/40 flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2 text-xs">
            <span className="text-foreground font-medium">
                {selected.length} {selected.length === 1 ? 'seleccionado' : 'seleccionados'}
            </span>
            <div className="ml-auto flex flex-wrap items-center gap-1.5">
                {trash ? (
                    <>
                        <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => run('restore')}>
                            <ArchiveRestore className="h-3.5 w-3.5" />
                            Restaurar
                        </Button>
                        <Button variant="destructive" size="sm" className="h-8 gap-1" onClick={() => run('force_delete')}>
                            <Trash2 className="h-3.5 w-3.5" />
                            Eliminar definitivamente
                        </Button>
                    </>
                ) : (
                    <>
                        <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => run('publish')}>
                            <Eye className="h-3.5 w-3.5" />
                            Publicar
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => run('draft')}>
                            <EyeOff className="h-3.5 w-3.5" />
                            Pasar a borrador
                        </Button>
                        <Button variant="destructive" size="sm" className="h-8 gap-1" onClick={() => run('trash')}>
                            <Trash2 className="h-3.5 w-3.5" />
                            Mover a papelera
                        </Button>
                    </>
                )}
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClear} aria-label="Quitar selección">
                    <X className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    );
}

/**
 * Switch between the list and its trash.
 */
export function TrashToggle({ trash, count, onChange }: { trash: boolean; count: number; onChange: (trash: boolean) => void }) {
    return (
        <Button
            variant={trash ? 'secondary' : 'outline'}
            onClick={() => onChange(!trash)}
            className="border-border/70 h-10 gap-1.5 rounded-xl text-xs font-medium shadow-2xs"
        >
            <Trash2 className="text-muted-foreground h-4 w-4" />
            <span>{trash ? 'Volver al listado' : `Papelera (${count})`}</span>
        </Button>
    );
}

/**
 * Row actions inside the trash.
 */
export function TrashRowActions({ routeName, id }: { routeName: string; id: number }) {
    return (
        <div className="flex items-center justify-end gap-1.5">
            <Button variant="outline" size="sm" className="h-8 gap-1 px-2 text-xs" onClick={() => runBulkAction(routeName, 'restore', [id])}>
                <ArchiveRestore className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Restaurar</span>
            </Button>
            <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 px-2 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/20"
                onClick={() => runBulkAction(routeName, 'force_delete', [id])}
            >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Eliminar definitivamente</span>
            </Button>
        </div>
    );
}

export function ScheduledBadge({ date }: { date?: string | Date | null }) {
    return (
        <span
            title={date ? `Se publicará el ${new Date(date).toLocaleString()}` : undefined}
            className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-sky-600 uppercase dark:text-sky-400"
        >
            Programado
        </span>
    );
}
