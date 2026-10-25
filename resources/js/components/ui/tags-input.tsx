import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { KeyboardEvent, useId, useRef, useState } from 'react';

export interface TagOption {
    id: number;
    name: string;
}

interface TagsInputProps {
    /** Selected tags, shown as chips. */
    value: TagOption[];
    onChange: (tags: TagOption[]) => void;
    /** Existing tags offered as suggestions while typing. */
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
 * Tags input: chips plus a text field. Typing suggests existing tags; Enter or a comma
 * adds what was typed (several at once when pasted with commas), × or Backspace on an
 * empty field removes chips.
 */
export function TagsInput({ value, onChange, options, onCreate, placeholder = 'Añadir etiqueta...', disabled, className, id }: TagsInputProps) {
    const [text, setText] = useState('');
    // -1 until a suggestion is chosen with the arrow keys
    const [highlight, setHighlight] = useState(-1);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [open, setOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const listId = useId();

    const selectedIds = new Set(value.map((tag) => tag.id));
    const query = normalize(text);
    const suggestions = query ? options.filter((tag) => !selectedIds.has(tag.id) && normalize(tag.name).includes(query)).slice(0, 8) : [];

    const add = (tags: TagOption[]) => {
        const next = [...value];
        for (const tag of tags) {
            if (!next.some((t) => t.id === tag.id)) next.push(tag);
        }
        onChange(next);
    };

    const remove = (tagId: number) => onChange(value.filter((tag) => tag.id !== tagId));

    const commit = async (raw: string) => {
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
            setText('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo añadir la etiqueta.');
        } finally {
            // Keep the tags that did get added, even if a later one failed
            add(added);
            setBusy(false);
            setHighlight(-1);
        }
    };

    const pick = (tag: TagOption) => {
        add([tag]);
        setText('');
        setHighlight(-1);
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown' && suggestions.length > 0) {
            e.preventDefault();
            setHighlight((h) => (h + 1) % suggestions.length);
        } else if (e.key === 'ArrowUp' && suggestions.length > 0) {
            e.preventDefault();
            setHighlight((h) => (h <= 0 ? suggestions.length - 1 : h - 1));
        } else if (e.key === 'Enter') {
            // Never submit the surrounding form from here
            e.preventDefault();
            const highlighted = suggestions[highlight];
            if (highlighted) {
                pick(highlighted);
            } else {
                commit(text);
            }
        } else if (e.key === ',') {
            e.preventDefault();
            commit(text);
        } else if (e.key === 'Backspace' && text === '' && value.length > 0) {
            remove(value[value.length - 1].id);
        } else if (e.key === 'Escape') {
            setOpen(false);
        }
    };

    return (
        <div className={cn('space-y-1.5', className)}>
            <div className="relative">
                <div
                    onClick={() => inputRef.current?.focus()}
                    className={cn(
                        'flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2 py-1.5 text-xs shadow-xs transition-[color,box-shadow]',
                        'focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50',
                        disabled && 'pointer-events-none opacity-50',
                    )}
                >
                    {value.map((tag) => (
                        <span
                            key={tag.id}
                            className="inline-flex items-center gap-1 rounded-md bg-secondary py-0.5 pr-0.5 pl-2 text-[11px] font-medium text-secondary-foreground"
                        >
                            {tag.name}
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    remove(tag.id);
                                }}
                                className="rounded-sm p-0.5 hover:bg-muted-foreground/20"
                                aria-label={`Quitar ${tag.name}`}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    ))}
                    <input
                        ref={inputRef}
                        id={id}
                        value={text}
                        onChange={(e) => {
                            setText(e.target.value);
                            setHighlight(-1);
                            setOpen(true);
                        }}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setOpen(true)}
                        onBlur={() => setOpen(false)}
                        placeholder={value.length === 0 ? placeholder : ''}
                        disabled={disabled || busy}
                        role="combobox"
                        aria-expanded={open && suggestions.length > 0}
                        aria-controls={listId}
                        aria-autocomplete="list"
                        className="min-w-[6rem] flex-1 bg-transparent py-0.5 text-xs outline-none placeholder:text-muted-foreground"
                    />
                </div>

                {open && suggestions.length > 0 && (
                    <ul
                        id={listId}
                        role="listbox"
                        className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-border bg-popover p-1 text-xs text-popover-foreground shadow-md"
                    >
                        {suggestions.map((tag, index) => (
                            <li key={tag.id} role="option" aria-selected={index === highlight}>
                                <button
                                    type="button"
                                    // Keep the input focused while picking with the mouse
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => pick(tag)}
                                    onMouseEnter={() => setHighlight(index)}
                                    className={cn('w-full rounded-sm px-2 py-1.5 text-left', index === highlight && 'bg-muted')}
                                >
                                    {tag.name}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            {error && <p className="text-[11px] text-destructive">{error}</p>}
        </div>
    );
}
