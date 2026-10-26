import { BLOCK_RENDERERS } from '@/blocks/registry';
import { type BlockData, type BlockDefinition, type BlockValues, newBlockId, str } from '@/blocks/types';
import CustomFieldRenderer from '@/components/custom-field-renderer';
import TiptapEditor from '@/components/tiptap-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { ArrowDown, ArrowUp, ChevronDown, Copy, GripVertical, LayoutTemplate, Plus, Search, Settings2, Trash2 } from 'lucide-react';
import { DynamicIcon, type IconName } from 'lucide-react/dynamic';
import { KeyboardEvent, useMemo, useRef, useState } from 'react';
import { ReactSortable } from 'react-sortablejs';

interface Props {
    value: BlockData[];
    onChange: (blocks: BlockData[]) => void;
    types: BlockDefinition[];
}

const CATEGORY_LABELS: Record<string, string> = {
    basic: 'Básicos',
    layout: 'Diseño',
    media: 'Multimedia',
};

/** Short text that identifies a block when it is collapsed */
const summaryOf = (block: BlockData): string => {
    const data = block.data;
    const text = str(data.title) || str(data.caption) || str(data.alt) || str(data.html).replace(/<[^>]+>/g, ' ');
    return text.replace(/\s+/g, ' ').trim().slice(0, 90);
};

/**
 * Page and post content as a list of blocks: add from the picker, drag (or Alt+↑/↓) to
 * reorder, duplicate, collapse and delete. Text blocks are edited in place; the other
 * blocks show their public preview and open their settings in a side panel.
 */
export default function BlockEditor({ value, onChange, types }: Props) {
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
    const [editingId, setEditingId] = useState<string | null>(null);
    const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const typeByKey = useMemo(() => Object.fromEntries(types.map((t) => [t.key, t])), [types]);

    const editing = value.find((block) => block.id === editingId) ?? null;
    const editingType = editing ? typeByKey[editing.type] : null;

    const insert = (type: BlockDefinition, index: number) => {
        const block: BlockData = { id: newBlockId(), type: type.key, version: type.version, data: { ...type.defaults } };
        const next = [...value];
        next.splice(index, 0, block);
        onChange(next);
        // Blocks other than text are configured right away
        if (type.key !== 'rich_text') setEditingId(block.id);
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
                <BlockPicker types={types} onPick={(type) => insert(type, 0)} label="Añadir el primer bloque" variant="default" />
            </div>
        );
    }

    return (
        <div className="space-y-1">
            <ReactSortable list={value} setList={onChange} handle=".block-drag" animation={150} ghostClass="opacity-40" className="space-y-1">
                {value.map((block, index) => {
                    const type = typeByKey[block.type];
                    const Render = BLOCK_RENDERERS[block.type];
                    const isCollapsed = collapsed.has(block.id);
                    const isText = block.type === 'rich_text';

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
                                <div className="border-border/70 flex items-center gap-1.5 border-b px-2 py-1.5">
                                    <button
                                        type="button"
                                        className="block-drag text-muted-foreground hover:text-foreground hover:bg-muted flex h-8 w-6 cursor-grab items-center justify-center rounded active:cursor-grabbing"
                                        aria-label="Arrastrar para ordenar"
                                        title="Arrastrar para ordenar"
                                    >
                                        <GripVertical className="h-4 w-4" />
                                    </button>
                                    <span className="bg-primary-soft text-primary-soft-foreground flex h-7 w-7 shrink-0 items-center justify-center rounded-md">
                                        <DynamicIcon name={(type?.icon ?? 'square') as IconName} className="h-4 w-4" />
                                    </span>
                                    <span className="text-foreground text-xs font-semibold">{type?.name ?? block.type}</span>
                                    {isCollapsed && <span className="text-muted-foreground min-w-0 flex-1 truncate text-xs">{summaryOf(block)}</span>}
                                    <div className="ml-auto flex items-center gap-0.5">
                                        {!isText && type && (
                                            <IconButton label="Ajustes del bloque" onClick={() => setEditingId(block.id)}>
                                                <Settings2 className="h-4 w-4" />
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
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setEditingId(block.id)}
                                            className="front-theme hover:bg-muted/30 block w-full overflow-hidden rounded-b-xl p-4 text-left transition-colors"
                                            aria-label={`Editar ${type?.name ?? block.type}`}
                                        >
                                            {Render && summaryOf(block) !== '' ? (
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
                                <BlockPicker types={types} onPick={(t) => insert(t, index + 1)} label="Insertar bloque aquí" variant="inline" />
                            </div>
                        </div>
                    );
                })}
            </ReactSortable>

            <div className="flex justify-center pt-1">
                <BlockPicker types={types} onPick={(t) => insert(t, value.length)} label="Añadir bloque" variant="outline" />
            </div>

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
                                    onChange={(key, fieldValue) => update(editing.id, { ...editing.data, [key]: fieldValue as BlockValues[string] })}
                                />
                            </div>
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

function BlockPicker({
    types,
    onPick,
    label,
    variant,
}: {
    types: BlockDefinition[];
    onPick: (type: BlockDefinition) => void;
    label: string;
    variant: 'default' | 'outline' | 'inline';
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const q = query.trim().toLowerCase();
    const matches = types.filter((t) => !q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    const categories = [...new Set(matches.map((t) => t.category))];

    const pick = (type: BlockDefinition) => {
        onPick(type);
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
                {matches.length === 0 && <p className="text-muted-foreground px-2 py-4 text-center text-xs">Ningún bloque coincide.</p>}
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
