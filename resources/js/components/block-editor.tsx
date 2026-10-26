import { BLOCK_RENDERERS } from '@/blocks/registry';
import { type BlockData, type BlockDefinition, type BlockPattern, type BlockValues, newBlockId, str, withNewIds } from '@/blocks/types';
import CustomFieldRenderer from '@/components/custom-field-renderer';
import TiptapEditor from '@/components/tiptap-editor';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import {
    ArrowDown,
    ArrowUp,
    Bookmark,
    ChevronDown,
    Copy,
    GripVertical,
    LayoutTemplate,
    Plus,
    RefreshCw,
    Search,
    Settings2,
    Trash2,
} from 'lucide-react';
import { DynamicIcon, type IconName } from 'lucide-react/dynamic';
import { KeyboardEvent, useMemo, useRef, useState } from 'react';
import { ReactSortable } from 'react-sortablejs';

interface Props {
    value: BlockData[];
    onChange: (blocks: BlockData[]) => void;
    types: BlockDefinition[];
    /** Inside a columns block: compact, and its own drag handles */
    nested?: boolean;
    /** False inside the editor of a reusable block itself (no block inside a block) */
    allowPatterns?: boolean;
    /** Block types the picker offers (the schema's allowed blocks); null = all. Existing blocks stay editable. */
    allowedTypes?: string[] | null;
}

interface ColumnData {
    blocks: BlockData[];
}

/** Column spans (out of 12) per layout; keep in sync with App\Blocks\ColumnsBlock::LAYOUTS */
const COLUMN_SPANS: Record<string, number[]> = {
    '50-50': [6, 6],
    '33-67': [4, 8],
    '67-33': [8, 4],
    '33-33-33': [4, 4, 4],
    '25-50-25': [3, 6, 3],
    '25-25-25-25': [3, 3, 3, 3],
};
const SPAN_CLASSES: Record<number, string> = { 3: 'md:col-span-3', 4: 'md:col-span-4', 6: 'md:col-span-6', 8: 'md:col-span-8' };

const columnsOf = (data: BlockValues): ColumnData[] => (Array.isArray(data.columns) ? (data.columns as unknown as ColumnData[]) : []);

/** A new layout for a columns block: empty columns are added, removed ones hand their blocks to the last column */
const withLayout = (data: BlockValues, layout: string): BlockValues => {
    const count = (COLUMN_SPANS[layout] ?? COLUMN_SPANS['50-50']).length;
    const columns = columnsOf(data).map((column) => ({ blocks: [...(column.blocks ?? [])] }));
    while (columns.length < count) columns.push({ blocks: [] });
    while (columns.length > count) {
        const removed = columns.pop();
        columns[columns.length - 1].blocks.push(...(removed?.blocks ?? []));
    }
    return { ...data, layout, columns: columns as unknown as BlockValues[string] };
};

const CATEGORY_LABELS: Record<string, string> = {
    basic: 'Básicos',
    layout: 'Diseño',
    media: 'Multimedia',
    reusable: 'Reutilizables',
};

/** Short text that identifies a block when it is collapsed */
const summaryOf = (block: BlockData): string => {
    const data = block.data;
    const count = (key: string, one: string, many: string) => {
        const n = Array.isArray(data[key]) ? (data[key] as unknown[]).length : 0;
        return n === 0 ? '' : `${n} ${n === 1 ? one : many}`;
    };
    const nestedCount = columnsOf(data).reduce((n, column) => n + (column.blocks?.length ?? 0), 0);
    const text =
        str(data.title) ||
        str(data.text) ||
        str(data.caption) ||
        str(data.alt) ||
        str(data.alias) ||
        str(data.key) ||
        str(data.url) ||
        str(data.file) ||
        count('images', 'imagen', 'imágenes') ||
        count('items', 'elemento', 'elementos') ||
        (nestedCount > 0 ? `${nestedCount} ${nestedCount === 1 ? 'bloque' : 'bloques'} en columnas` : '') ||
        str(data.html).replace(/<[^>]+>/g, ' ');
    return text.replace(/\s+/g, ' ').trim().slice(0, 90);
};

/**
 * Page and post content as a list of blocks: add from the picker, drag (or Alt+↑/↓) to
 * reorder, duplicate, collapse and delete. Text blocks are edited in place; the other
 * blocks show their public preview and open their settings in a side panel.
 */
export default function BlockEditor({ value, onChange, types, nested = false, allowPatterns = true, allowedTypes = null }: Props) {
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
    const [editingId, setEditingId] = useState<string | null>(null);
    /** Index of the block being saved as a reusable block (its dialog is open) */
    const [patternDialogIndex, setPatternDialogIndex] = useState<number | null>(null);
    const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const page = usePage<{
        blockPatterns?: BlockPattern[];
        auth?: { permissions?: { super_admin?: boolean; modules?: Record<string, string[]> } | null };
    }>();
    // Patterns saved from the editor are added to the ones the page was opened with
    const [saved, setSaved] = useState<BlockPattern[]>([]);
    const patterns = useMemo(
        () => (allowPatterns ? [...(page.props.blockPatterns ?? []), ...saved] : []),
        [allowPatterns, page.props.blockPatterns, saved],
    );
    const patternByKey = useMemo(() => Object.fromEntries(patterns.map((p) => [p.key, p])), [patterns]);
    // Inside a column a synced reference is not offered (its content may hold columns): only copies.
    // A schema that leaves out "pattern" hides the reusable blocks altogether.
    const pickerPatterns = useMemo(
        () => (allowedTypes && !allowedTypes.includes('pattern') ? [] : nested ? patterns.filter((p) => !p.synced) : patterns),
        [allowedTypes, nested, patterns],
    );
    const canSavePatterns =
        allowPatterns &&
        Boolean(page.props.auth?.permissions?.super_admin || page.props.auth?.permissions?.modules?.['block-patterns']?.includes('administrar'));
    const typeByKey = useMemo(() => Object.fromEntries(types.map((t) => [t.key, t])), [types]);
    // Inside a column only blocks that may nest are offered (no columns in columns).
    // Synced blocks have their own section in the picker, so the type itself is hidden.
    const pickerTypes = useMemo(
        () => types.filter((t) => t.key !== 'pattern' && (!nested || t.nestable !== false) && (!allowedTypes || allowedTypes.includes(t.key))),
        [nested, types, allowedTypes],
    );
    // Separate handles, so dragging inside a column doesn't also drag the columns block
    const handleClass = nested ? 'block-drag-nested' : 'block-drag';

    const editing = value.find((block) => block.id === editingId) ?? null;
    const editingType = editing ? typeByKey[editing.type] : null;

    const insert = (type: BlockDefinition, index: number) => {
        const block: BlockData = { id: newBlockId(), type: type.key, version: type.version, data: { ...type.defaults } };
        const next = [...value];
        next.splice(index, 0, block);
        onChange(next);
        // Blocks with settings are configured right away (text and columns are edited in place)
        if (type.key !== 'rich_text' && type.key !== 'columns') setEditingId(block.id);
    };

    /** A synced pattern is inserted as a reference; an unsynced one is copied in */
    const insertPattern = (pattern: BlockPattern, index: number) => {
        const copied = withNewIds(pattern.blocks ?? []).filter((block) => !nested || typeByKey[block.type]?.nestable !== false);
        const added: BlockData[] = pattern.synced
            ? [{ id: newBlockId(), type: 'pattern', version: typeByKey.pattern?.version ?? 1, data: { pattern: pattern.key } }]
            : copied;
        const next = [...value];
        next.splice(index, 0, ...added);
        onChange(next);
    };

    /** Save one block as a reusable block; a synced one replaces the block with a reference */
    const saveAsPattern = async (index: number, name: string, synced: boolean) => {
        try {
            const { data } = await axios.post<{ pattern: BlockPattern }>(route('block-patterns.quick'), {
                name,
                synced,
                blocks: [value[index]],
            });
            setSaved((prev) => [...prev, data.pattern]);
            if (synced) {
                const next = [...value];
                next[index] = { id: newBlockId(), type: 'pattern', version: typeByKey.pattern?.version ?? 1, data: { pattern: data.pattern.key } };
                onChange(next);
            }
        } catch {
            window.alert('No se pudo guardar el bloque reutilizable.');
        } finally {
            setPatternDialogIndex(null);
        }
    };

    const update = (id: string, data: BlockValues) => onChange(value.map((block) => (block.id === id ? { ...block, data } : block)));

    const move = (index: number, delta: number) => {
        const target = index + delta;
        if (target < 0 || target >= value.length) return;
        const next = [...value];
        const [block] = next.splice(index, 1);
        next.splice(target, 0, block);
        onChange(next);
        requestAnimationFrame(() => cardRefs.current[block.id]?.focus());
    };

    const duplicate = (index: number) => {
        const copy: BlockData = { ...value[index], id: newBlockId(), data: structuredClone(value[index].data) };
        const next = [...value];
        next.splice(index + 1, 0, copy);
        onChange(next);
    };

    const remove = (index: number) => {
        const block = value[index];
        const type = typeByKey[block.type];
        if (summaryOf(block) && !window.confirm(`¿Eliminar el bloque "${type?.name ?? block.type}"?`)) return;
        onChange(value.filter((_, i) => i !== index));
    };

    const toggle = (id: string) =>
        setCollapsed((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    const onCardKeyDown = (e: KeyboardEvent, index: number) => {
        if (e.target !== e.currentTarget || !e.altKey) return;
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            move(index, e.key === 'ArrowUp' ? -1 : 1);
        }
    };

    if (value.length === 0 && nested) {
        return (
            <div className="border-border/80 flex min-h-24 items-center justify-center rounded-lg border border-dashed p-3">
                <BlockPicker
                    types={pickerTypes}
                    patterns={pickerPatterns}
                    onPick={(type) => insert(type, 0)}
                    onPickPattern={(pattern) => insertPattern(pattern, 0)}
                    label="Añadir"
                    variant="outline"
                />
            </div>
        );
    }

    if (value.length === 0) {
        return (
            <div className="border-border/80 bg-muted/20 flex flex-col items-center rounded-xl border border-dashed px-6 py-12 text-center">
                <div className="bg-primary-soft text-primary-soft-foreground mb-3 flex h-11 w-11 items-center justify-center rounded-xl">
                    <LayoutTemplate className="h-5 w-5" />
                </div>
                <p className="text-foreground text-sm font-semibold">Aún no hay contenido</p>
                <p className="text-muted-foreground mt-1 mb-4 max-w-sm text-xs">
                    Construye la página con bloques: texto, portadas, imágenes y llamadas a la acción.
                </p>
                <BlockPicker
                    types={pickerTypes}
                    patterns={pickerPatterns}
                    onPick={(type) => insert(type, 0)}
                    onPickPattern={(pattern) => insertPattern(pattern, 0)}
                    label="Añadir el primer bloque"
                    variant="default"
                />
            </div>
        );
    }

    return (
        <div className="space-y-1">
            <ReactSortable list={value} setList={onChange} handle={`.${handleClass}`} animation={150} ghostClass="opacity-40" className="space-y-1">
                {value.map((block, index) => {
                    const type = typeByKey[block.type];
                    const Render = BLOCK_RENDERERS[block.type];
                    const isCollapsed = collapsed.has(block.id);
                    const isText = block.type === 'rich_text';
                    const isPattern = block.type === 'pattern';
                    const pattern = isPattern ? patternByKey[str(block.data.pattern)] : undefined;

                    return (
                        <div key={block.id} className="group/block">
                            <div
                                ref={(el) => {
                                    cardRefs.current[block.id] = el;
                                }}
                                tabIndex={0}
                                onKeyDown={(e) => onCardKeyDown(e, index)}
                                aria-label={`Bloque ${index + 1}: ${type?.name ?? block.type}. Alt + flechas para mover.`}
                                className="border-border bg-card focus-visible:ring-primary/40 rounded-xl border shadow-2xs focus-visible:ring-2 focus-visible:outline-none"
                                data-testid="block-card"
                            >
                                {/* Toolbar */}
                                <div className="border-border/70 flex flex-wrap items-center gap-1.5 border-b px-2 py-1.5">
                                    <button
                                        type="button"
                                        className={cn(
                                            handleClass,
                                            'text-muted-foreground hover:text-foreground hover:bg-muted flex h-8 w-6 cursor-grab items-center justify-center rounded active:cursor-grabbing',
                                        )}
                                        aria-label="Arrastrar para ordenar"
                                        title="Arrastrar para ordenar"
                                    >
                                        <GripVertical className="h-4 w-4" />
                                    </button>
                                    <span className="bg-primary-soft text-primary-soft-foreground flex h-7 w-7 shrink-0 items-center justify-center rounded-md">
                                        <DynamicIcon name={(type?.icon ?? 'square') as IconName} className="h-4 w-4" />
                                    </span>
                                    <span className="text-foreground text-xs font-semibold">
                                        {isPattern ? (pattern?.name ?? type?.name ?? block.type) : (type?.name ?? block.type)}
                                    </span>
                                    {isPattern && (
                                        <span className="bg-primary-soft text-primary-soft-foreground inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
                                            <RefreshCw className="h-3 w-3" />
                                            Sincronizado
                                        </span>
                                    )}
                                    {isCollapsed && <span className="text-muted-foreground min-w-0 flex-1 truncate text-xs">{summaryOf(block)}</span>}
                                    <div className="ml-auto flex items-center gap-0.5">
                                        {!isText && type && (
                                            <IconButton label="Ajustes del bloque" onClick={() => setEditingId(block.id)}>
                                                <Settings2 className="h-4 w-4" />
                                            </IconButton>
                                        )}
                                        {canSavePatterns && !isPattern && (
                                            <IconButton label="Guardar como bloque reutilizable" onClick={() => setPatternDialogIndex(index)}>
                                                <Bookmark className="h-4 w-4" />
                                            </IconButton>
                                        )}
                                        <IconButton label="Subir" onClick={() => move(index, -1)} disabled={index === 0}>
                                            <ArrowUp className="h-4 w-4" />
                                        </IconButton>
                                        <IconButton label="Bajar" onClick={() => move(index, 1)} disabled={index === value.length - 1}>
                                            <ArrowDown className="h-4 w-4" />
                                        </IconButton>
                                        <IconButton label="Duplicar" onClick={() => duplicate(index)}>
                                            <Copy className="h-4 w-4" />
                                        </IconButton>
                                        <IconButton label="Eliminar" onClick={() => remove(index)} destructive>
                                            <Trash2 className="h-4 w-4" />
                                        </IconButton>
                                        <IconButton label={isCollapsed ? 'Expandir' : 'Contraer'} onClick={() => toggle(block.id)}>
                                            <ChevronDown className={cn('h-4 w-4 transition-transform', isCollapsed && '-rotate-90')} />
                                        </IconButton>
                                    </div>
                                </div>

                                {/* Body */}
                                {!isCollapsed &&
                                    (isText ? (
                                        <div className="p-2">
                                            <TiptapEditor
                                                value={str(block.data.html)}
                                                onChange={(html) => update(block.id, { ...block.data, html })}
                                            />
                                        </div>
                                    ) : block.type === 'columns' ? (
                                        // Each column is its own (nested) block list
                                        <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-12">
                                            {(COLUMN_SPANS[str(block.data.layout)] ?? COLUMN_SPANS['50-50']).map((span, columnIndex) => {
                                                const columns = columnsOf(block.data);
                                                return (
                                                    <div key={columnIndex} className={cn('bg-muted/30 min-w-0 rounded-lg p-2', SPAN_CLASSES[span])}>
                                                        <p className="text-muted-foreground mb-1.5 px-1 text-[10px] font-semibold tracking-wider uppercase">
                                                            Columna {columnIndex + 1}
                                                        </p>
                                                        <BlockEditor
                                                            nested
                                                            allowPatterns={allowPatterns}
                                                            allowedTypes={allowedTypes}
                                                            types={types}
                                                            value={columns[columnIndex]?.blocks ?? []}
                                                            onChange={(blocks) => {
                                                                const next = columnsOf(withLayout(block.data, str(block.data.layout) || '50-50'));
                                                                next[columnIndex] = { blocks };
                                                                update(block.id, { ...block.data, columns: next as unknown as BlockValues[string] });
                                                            }}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setEditingId(block.id)}
                                            className="front-theme hover:bg-muted/30 block w-full overflow-hidden rounded-b-xl p-4 text-left transition-colors"
                                            aria-label={`Editar ${type?.name ?? block.type}`}
                                        >
                                            {Render && isPattern ? (
                                                <div className="pointer-events-none">
                                                    <Render
                                                        data={{ ...block.data, blocks: (pattern?.blocks ?? []) as unknown as BlockValues[string] }}
                                                        editing
                                                    />
                                                </div>
                                            ) : Render && summaryOf(block) !== '' ? (
                                                <div className="pointer-events-none">
                                                    <Render data={block.data} editing />
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground flex items-center justify-center gap-2 py-6 text-xs">
                                                    <Settings2 className="h-4 w-4" />
                                                    Bloque vacío: pulsa para configurarlo
                                                </span>
                                            )}
                                        </button>
                                    ))}
                            </div>

                            {/* Insert between blocks */}
                            <div className="flex h-7 items-center justify-center opacity-0 transition-opacity group-hover/block:opacity-100 focus-within:opacity-100">
                                <BlockPicker
                                    types={pickerTypes}
                                    patterns={pickerPatterns}
                                    onPick={(t) => insert(t, index + 1)}
                                    onPickPattern={(pattern) => insertPattern(pattern, index + 1)}
                                    label="Insertar bloque aquí"
                                    variant="inline"
                                />
                            </div>
                        </div>
                    );
                })}
            </ReactSortable>

            <div className="flex justify-center pt-1">
                <BlockPicker
                    types={pickerTypes}
                    patterns={pickerPatterns}
                    onPick={(t) => insert(t, value.length)}
                    onPickPattern={(pattern) => insertPattern(pattern, value.length)}
                    label={nested ? 'Añadir' : 'Añadir bloque'}
                    variant={nested ? 'ghost' : 'outline'}
                />
            </div>

            <SavePatternDialog
                open={patternDialogIndex !== null}
                blockName={patternDialogIndex !== null ? (typeByKey[value[patternDialogIndex]?.type]?.name ?? '') : ''}
                onCancel={() => setPatternDialogIndex(null)}
                onSave={(name, synced) => patternDialogIndex !== null && saveAsPattern(patternDialogIndex, name, synced)}
            />

            <Sheet open={!!editing} onOpenChange={(open) => !open && setEditingId(null)}>
                <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-md">
                    {editing && editingType && (
                        <>
                            <SheetHeader className="border-b">
                                <SheetTitle className="flex items-center gap-2">
                                    <DynamicIcon name={editingType.icon as IconName} className="text-primary h-4 w-4" />
                                    {editingType.name}
                                </SheetTitle>
                                <SheetDescription>{editingType.description}</SheetDescription>
                            </SheetHeader>
                            <div className="p-4">
                                <CustomFieldRenderer
                                    idPrefix={`block-${editing.id}-`}
                                    fields={editingType.fields}
                                    values={editing.data as never}
                                    onChange={(key, fieldValue) =>
                                        update(
                                            editing.id,
                                            // A new column layout adds or merges columns
                                            editing.type === 'columns' && key === 'layout' && typeof fieldValue === 'string'
                                                ? withLayout(editing.data, fieldValue)
                                                : { ...editing.data, [key]: fieldValue as BlockValues[string] },
                                        )
                                    }
                                />
                            </div>
                            {editing.type === 'pattern' && patternByKey[str(editing.data.pattern)] && (
                                <div className="px-4 pb-2">
                                    <a
                                        href={route('block-patterns.edit', patternByKey[str(editing.data.pattern)].id)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-primary inline-flex items-center gap-1.5 text-xs font-medium hover:underline"
                                    >
                                        <Settings2 className="h-3.5 w-3.5" />
                                        Editar este bloque reutilizable
                                    </a>
                                </div>
                            )}

                            <div className="bg-card sticky bottom-0 mt-auto border-t p-4">
                                <Button type="button" className="w-full" onClick={() => setEditingId(null)}>
                                    Listo
                                </Button>
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}

function IconButton({
    label,
    onClick,
    disabled,
    destructive,
    children,
}: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    destructive?: boolean;
    children: React.ReactNode;
}) {
    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn('text-muted-foreground h-7 w-7', destructive && 'hover:bg-destructive/10 hover:text-destructive')}
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            title={label}
        >
            {children}
        </Button>
    );
}

/** Name and sync mode of a block the editor saves as a reusable block */
function SavePatternDialog({
    open,
    blockName,
    onCancel,
    onSave,
}: {
    open: boolean;
    blockName: string;
    onCancel: () => void;
    onSave: (name: string, synced: boolean) => void;
}) {
    const [name, setName] = useState('');
    const [synced, setSynced] = useState(true);
    const [saving, setSaving] = useState(false);

    // Each time the dialog opens it starts from the block's own name
    const reset = (next: boolean) => {
        if (!next) {
            onCancel();
            return;
        }
        setName(blockName);
        setSynced(true);
        setSaving(false);
    };

    return (
        <Dialog open={open} onOpenChange={reset}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Guardar como bloque reutilizable</DialogTitle>
                    <DialogDescription>Podrás insertarlo en cualquier página o entrada desde el buscador de bloques.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="pattern-name">Nombre</Label>
                        <Input
                            id="pattern-name"
                            autoFocus
                            value={name || blockName}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej. Aviso de horarios"
                        />
                    </div>
                    <label className="flex items-start gap-3">
                        <Checkbox checked={synced} onClick={() => setSynced(!synced)} className="mt-0.5" />
                        <span>
                            <span className="text-foreground block text-sm font-medium">Sincronizado</span>
                            <span className="text-muted-foreground block text-xs">
                                Al editarlo cambia en todas las páginas que lo usan. Sin sincronizar, cada inserción es una copia independiente.
                            </span>
                        </span>
                    </label>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        disabled={saving || (name || blockName).trim() === ''}
                        onClick={() => {
                            setSaving(true);
                            onSave((name || blockName).trim(), synced);
                        }}
                    >
                        {saving ? 'Guardando...' : 'Guardar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function BlockPicker({
    types,
    patterns = [],
    onPick,
    onPickPattern,
    label,
    variant,
}: {
    types: BlockDefinition[];
    patterns?: BlockPattern[];
    onPick: (type: BlockDefinition) => void;
    onPickPattern?: (pattern: BlockPattern) => void;
    label: string;
    variant: 'default' | 'outline' | 'ghost' | 'inline';
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const q = query.trim().toLowerCase();
    const matches = types.filter((t) => !q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    const categories = [...new Set(matches.map((t) => t.category))];
    const patternMatches = patterns.filter((p) => !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));

    const pick = (type: BlockDefinition) => {
        onPick(type);
        setOpen(false);
        setQuery('');
    };

    const pickPattern = (pattern: BlockPattern) => {
        onPickPattern?.(pattern);
        setOpen(false);
        setQuery('');
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {variant === 'inline' ? (
                    <button
                        type="button"
                        aria-label={label}
                        title={label}
                        className="bg-primary text-primary-foreground focus-visible:ring-primary/40 flex h-6 w-6 items-center justify-center rounded-full shadow-sm focus-visible:ring-2 focus-visible:outline-none"
                    >
                        <Plus className="h-3.5 w-3.5" />
                    </button>
                ) : (
                    <Button type="button" variant={variant} size="sm" className="gap-1.5">
                        <Plus className="h-4 w-4" />
                        {label}
                    </Button>
                )}
            </PopoverTrigger>
            <PopoverContent className="w-[min(22rem,calc(100vw-2rem))] p-2" align="center">
                <div className="relative mb-2">
                    <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
                    <Input
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && matches[0]) {
                                e.preventDefault();
                                pick(matches[0]);
                            }
                        }}
                        placeholder="Buscar bloque..."
                        className="h-8 pl-8 text-xs"
                        aria-label="Buscar bloque"
                    />
                </div>
                {matches.length === 0 && patternMatches.length === 0 && (
                    <p className="text-muted-foreground px-2 py-4 text-center text-xs">Ningún bloque coincide.</p>
                )}
                {patternMatches.length > 0 && (
                    <div className="mb-1">
                        <p className="text-muted-foreground px-2 pt-1 pb-1 text-[10px] font-semibold tracking-wider uppercase">Reutilizables</p>
                        {patternMatches.map((pattern) => (
                            <button
                                key={pattern.key}
                                type="button"
                                onClick={() => pickPattern(pattern)}
                                className="hover:bg-primary-soft focus-visible:bg-primary-soft flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left focus-visible:outline-none"
                            >
                                <span className="bg-muted text-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
                                    {pattern.synced ? <RefreshCw className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </span>
                                <span className="min-w-0">
                                    <span className="text-foreground block text-xs font-semibold">{pattern.name}</span>
                                    <span className="text-muted-foreground block text-[11px] leading-snug">
                                        {pattern.description ||
                                            (pattern.synced
                                                ? 'Sincronizado: se actualiza en todas las páginas.'
                                                : 'Se inserta como una copia independiente.')}
                                    </span>
                                </span>
                            </button>
                        ))}
                    </div>
                )}
                {categories.map((category) => (
                    <div key={category} className="mb-1">
                        <p className="text-muted-foreground px-2 pt-1 pb-1 text-[10px] font-semibold tracking-wider uppercase">
                            {CATEGORY_LABELS[category] ?? category}
                        </p>
                        {matches
                            .filter((t) => t.category === category)
                            .map((type) => (
                                <button
                                    key={type.key}
                                    type="button"
                                    onClick={() => pick(type)}
                                    className="hover:bg-primary-soft focus-visible:bg-primary-soft flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left focus-visible:outline-none"
                                >
                                    <span className="bg-muted text-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
                                        <DynamicIcon name={type.icon as IconName} className="h-4 w-4" />
                                    </span>
                                    <span className="min-w-0">
                                        <span className="text-foreground block text-xs font-semibold">{type.name}</span>
                                        <span className="text-muted-foreground block text-[11px] leading-snug">{type.description}</span>
                                    </span>
                                </button>
                            ))}
                    </div>
                ))}
            </PopoverContent>
        </Popover>
    );
}
