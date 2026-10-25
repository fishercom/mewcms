import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown, Loader2, Plus, X } from 'lucide-react';
import { KeyboardEvent, useState } from 'react';

export interface TagOption {
    id: number;
    name: string;
}

interface TagsInputProps {
    /** Selected tags, shown as chips. */
    value: TagOption[];
    onChange: (tags: TagOption[]) => void;
    /** Existing tags offered in the list. */
    options: TagOption[];
    /** Creates a tag that does not exist yet. Without it only existing tags can be added. */
    onCreate?: (name: string) => Promise<TagOption>;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    id?: string;
}

const normalize = (value: string) =>
    value
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .trim()
        .toLowerCase();

/**
 * Multi-select combobox for tags (shadcn Popover + Command): chips for the selected tags
 * and a searchable list that toggles tags and can create new ones ("Crear «texto»").
 * Typing a comma adds what was typed; Backspace in an empty search removes the last chip.
 */
export function TagsInput({ value, onChange, options, onCreate, placeholder = 'Añadir etiqueta...', disabled, className, id }: TagsInputProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const selectedIds = new Set(value.map((tag) => tag.id));
    const query = normalize(search);
    const exactMatch = options.find((tag) => normalize(tag.name) === query);
    const canCreate = Boolean(onCreate && query && !exactMatch);

    const toggle = (tag: TagOption) => {
        onChange(selectedIds.has(tag.id) ? value.filter((t) => t.id !== tag.id) : [...value, tag]);
        setSearch('');
    };

    /**
     * Add every comma-separated name: existing tags are selected, new ones created.
     */
    const addNames = async (raw: string) => {
        const names = raw
            .split(',')
            .map((name) => name.trim())
            .filter(Boolean);
        if (names.length === 0 || busy) return;

        setBusy(true);
        setError(null);
        const added: TagOption[] = [];
        try {
            for (const name of names) {
                const existing = options.find((tag) => normalize(tag.name) === normalize(name));
                if (existing) {
                    added.push(existing);
                } else if (onCreate) {
                    added.push(await onCreate(name));
                } else {
                    throw new Error(`La etiqueta "${name}" no existe.`);
                }
            }
            setSearch('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo añadir la etiqueta.');
        } finally {
            // Keep the tags that did get added, even if a later one failed
            const next = [...value];
            for (const tag of added) {
                if (!next.some((t) => t.id === tag.id)) next.push(tag);
            }
            onChange(next);
            setBusy(false);
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === ',') {
            e.preventDefault();
            addNames(search);
        } else if (e.key === 'Backspace' && search === '' && value.length > 0) {
            onChange(value.slice(0, -1));
        }
    };

    return (
        <div className={cn('space-y-1.5', className)}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverAnchor asChild>
                    <div
                        className={cn(
                            'flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2 py-1.5 shadow-xs',
                            open && 'border-ring ring-[3px] ring-ring/50',
                            disabled && 'pointer-events-none opacity-50',
                        )}
                    >
                        {value.map((tag) => (
                            <Badge key={tag.id} variant="secondary" className="gap-1 py-0.5 pr-0.5 pl-2 text-[11px]">
                                {tag.name}
                                <button
                                    type="button"
                                    onClick={() => onChange(value.filter((t) => t.id !== tag.id))}
                                    className="rounded-sm p-0.5 hover:bg-muted-foreground/20"
                                    aria-label={`Quitar ${tag.name}`}
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                        <PopoverTrigger asChild>
                            <button
                                id={id}
                                type="button"
                                role="combobox"
                                aria-expanded={open}
                                disabled={disabled}
                                className="flex min-w-[8rem] flex-1 items-center justify-between gap-2 rounded-sm px-1 py-0.5 text-left text-xs text-muted-foreground outline-none hover:text-foreground"
                            >
                                <span>{value.length === 0 ? placeholder : 'Añadir...'}</span>
                                <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
                            </button>
                        </PopoverTrigger>
                    </div>
                </PopoverAnchor>

                <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] min-w-64 p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <Command
                        // Accent-insensitive matching ("tecnologia" finds "Tecnología")
                        filter={(itemValue, term) => (normalize(itemValue).includes(normalize(term)) ? 1 : 0)}
                    >
                        <CommandInput
                            autoFocus
                            value={search}
                            onValueChange={setSearch}
                            onKeyDown={handleKeyDown}
                            placeholder={onCreate ? 'Buscar o crear etiqueta...' : 'Buscar etiqueta...'}
                            disabled={busy}
                            className="text-xs"
                        />
                        <CommandList>
                            {/* The create option below already tells what will happen */}
                            {!canCreate && (
                                <CommandEmpty className="py-4 text-center text-xs text-muted-foreground">
                                    {onCreate ? 'Escribe para crear una etiqueta.' : 'No hay etiquetas que coincidan.'}
                                </CommandEmpty>
                            )}
                            {options.length > 0 && (
                                <CommandGroup heading="Etiquetas">
                                    {options.map((tag) => (
                                        <CommandItem key={tag.id} value={tag.name} onSelect={() => toggle(tag)} className="text-xs">
                                            <Check className={cn(selectedIds.has(tag.id) ? 'opacity-100' : 'opacity-0')} />
                                            {tag.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                            {canCreate && (
                                <CommandGroup>
                                    <CommandItem value={`__create__ ${search}`} onSelect={() => addNames(search)} className="text-xs">
                                        {busy ? <Loader2 className="animate-spin" /> : <Plus />}
                                        Crear «{search.trim()}»
                                    </CommandItem>
                                </CommandGroup>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            {error && <p className="text-[11px] text-destructive">{error}</p>}
        </div>
    );
}
