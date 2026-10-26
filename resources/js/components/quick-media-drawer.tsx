import { formatBytes, MediaThumb, uploadMedia, type UploadProgress } from '@/components/media-library';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { type Pagination } from '@/types';
import { type CmsMedia } from '@/types/models/cms-media';
import axios from 'axios';
import { AlertTriangle, Check, Loader2, Search, UploadCloud, X } from 'lucide-react';
import { DragEvent, useCallback, useEffect, useRef, useState } from 'react';

interface QuickMediaDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    /** Receives the file URL and its library entry (alt text, size…) */
    onSelect?: (url: string, media?: CmsMedia) => void;
    initialType?: 'Images' | 'Files' | 'Videos';
}

type PickerType = 'image' | 'document' | 'video';

/**
 * Pick a file from the media library (or upload one) without leaving the editor.
 */
export default function QuickMediaDrawer({ isOpen, onClose, onSelect, initialType = 'Images' }: QuickMediaDrawerProps) {
    const [type, setType] = useState<PickerType>(initialType === 'Files' ? 'document' : initialType === 'Videos' ? 'video' : 'image');
    const [search, setSearch] = useState('');
    const [items, setItems] = useState<CmsMedia[]>([]);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<CmsMedia | null>(null);
    const [alt, setAlt] = useState('');
    const [uploads, setUploads] = useState<UploadProgress[]>([]);
    const [dragging, setDragging] = useState(false);
    const [inserting, setInserting] = useState(false);
    const fileInput = useRef<HTMLInputElement>(null);

    const load = useCallback(
        async (pageToLoad: number) => {
            setLoading(true);
            try {
                const { data } = await axios.get<Pagination<CmsMedia>>(route('media.picker'), {
                    params: { type, s: search || undefined, page: pageToLoad },
                });
                setItems((prev) => (pageToLoad === 1 ? data.data : [...prev, ...data.data]));
                setPage(data.current_page);
                setLastPage(data.last_page);
            } catch (error) {
                console.error('Error loading the media library:', error);
            } finally {
                setLoading(false);
            }
        },
        [type, search],
    );

    useEffect(() => {
        if (!isOpen) return;
        const timer = setTimeout(() => load(1), search ? 250 : 0);
        return () => clearTimeout(timer);
    }, [isOpen, load, search]);

    useEffect(() => {
        if (!isOpen) {
            setSelected(null);
            setUploads([]);
        }
    }, [isOpen]);

    useEffect(() => {
        setAlt(selected?.alt ?? '');
    }, [selected]);

    if (!isOpen) return null;

    const upload = async (files: File[]) => {
        if (files.length === 0) return;
        const stored = await uploadMedia(files, setUploads);
        if (stored.length > 0) {
            await load(1);
            setSelected(stored[stored.length - 1]);
        }
        setTimeout(() => setUploads((list) => list.filter((u) => u.error)), 1500);
    };

    const onDrop = (e: DragEvent) => {
        e.preventDefault();
        setDragging(false);
        upload(Array.from(e.dataTransfer.files));
    };

    // Save a changed alt text to the library, then hand the file to the editor
    const insert = async () => {
        if (!selected) return;
        let media = selected;
        if (selected.type === 'image' && alt.trim() !== (selected.alt ?? '')) {
            setInserting(true);
            try {
                const { data } = await axios.put<CmsMedia>(route('media.update', selected.id), {
                    alt: alt.trim(),
                    title: selected.title,
                    caption: selected.caption,
                });
                media = data;
            } catch (error) {
                console.error('Could not save the alt text:', error);
            } finally {
                setInserting(false);
            }
        }
        onSelect?.(media.url, media);
    };

    return (
        <div
            className="animate-in fade-in fixed inset-0 z-50 flex justify-end duration-200"
            role="dialog"
            aria-modal="true"
            aria-label={t('Biblioteca de medios')}
        >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />

            <div
                className="animate-in slide-in-from-right border-border bg-card relative z-10 flex h-full w-full max-w-lg flex-col border-l shadow-2xl duration-300"
                onDragOver={(e) => {
                    if (!e.dataTransfer.types.includes('Files')) return;
                    e.preventDefault();
                    setDragging(true);
                }}
                onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
                }}
                onDrop={onDrop}
            >
                {/* Header */}
                <div className="border-border flex items-center justify-between border-b p-5">
                    <div>
                        <h2 className="text-foreground text-base font-bold">{t('Biblioteca de medios')}</h2>
                        <p className="text-muted-foreground text-xs">{t('Elige un archivo o sube uno nuevo')}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} aria-label={t('Cerrar')}>
                        <X className="h-4.5 w-4.5" />
                    </Button>
                </div>

                {/* Type tabs */}
                <div className="border-border bg-muted/50 grid grid-cols-3 border-b dark:bg-black/10" role="tablist">
                    {(
                        [
                            ['image', t('Imágenes')],
                            ['document', t('Documentos')],
                            ['video', t('Videos')],
                        ] as const
                    ).map(([value, label]) => (
                        <button
                            key={value}
                            type="button"
                            role="tab"
                            aria-selected={type === value}
                            onClick={() => {
                                setType(value);
                                setSelected(null);
                            }}
                            className={cn(
                                'border-b-2 py-3 text-center text-xs font-semibold transition-colors',
                                type === value ? 'border-primary text-primary' : 'text-muted-foreground hover:text-foreground border-transparent',
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Search + upload */}
                <div className="border-border flex gap-2 border-b p-4">
                    <div className="relative flex-1">
                        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t('Buscar...')}
                            className="h-9 pl-9 text-xs"
                            aria-label={t('Buscar en la biblioteca')}
                        />
                    </div>
                    <Button type="button" className="h-9 gap-1.5" onClick={() => fileInput.current?.click()}>
                        <UploadCloud className="h-4 w-4" />
                        {t('Subir')}
                    </Button>
                    <input
                        ref={fileInput}
                        type="file"
                        multiple
                        accept={
                            type === 'image' ? 'image/jpeg,image/png,image/gif,image/webp' : type === 'video' ? 'video/mp4,video/webm' : undefined
                        }
                        className="hidden"
                        onChange={(e) => {
                            upload(Array.from(e.target.files ?? []));
                            e.target.value = '';
                        }}
                    />
                </div>

                {uploads.length > 0 && (
                    <ul className="border-border space-y-1.5 border-b px-4 py-3 text-xs" aria-live="polite">
                        {uploads.map((u, i) => (
                            <li key={`${u.name}-${i}`} className="flex items-center gap-2">
                                <span className="text-foreground min-w-0 flex-1 truncate">{u.name}</span>
                                {u.error ? (
                                    <span className="text-destructive flex items-center gap-1">
                                        <AlertTriangle className="h-3.5 w-3.5" />
                                        {u.error}
                                    </span>
                                ) : u.progress === 100 ? (
                                    <Check className="text-success h-3.5 w-3.5" />
                                ) : (
                                    <span className="text-muted-foreground">{u.progress}%</span>
                                )}
                            </li>
                        ))}
                    </ul>
                )}

                {/* Items */}
                <div className="relative flex-1 overflow-y-auto p-4">
                    {items.length === 0 && !loading ? (
                        <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2 text-center text-xs">
                            <UploadCloud className="h-8 w-8" />
                            {search ? t('No hay archivos que coincidan.') : t('Aún no hay archivos. Arrastra uno aquí o pulsa Subir.')}
                        </div>
                    ) : (
                        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                            {items.map((item) => (
                                <li key={item.id}>
                                    <button
                                        type="button"
                                        onClick={() => setSelected(item)}
                                        onDoubleClick={() => onSelect?.(item.url, item)}
                                        aria-pressed={selected?.id === item.id}
                                        title={item.title || item.filename}
                                        className={cn(
                                            'border-border/70 bg-muted/30 focus-visible:ring-primary/40 relative block aspect-square w-full overflow-hidden rounded-lg border focus-visible:ring-2 focus-visible:outline-none',
                                            selected?.id === item.id && 'ring-primary ring-2 ring-offset-1',
                                        )}
                                    >
                                        <MediaThumb item={item} iconClassName="h-6 w-6" />
                                        {selected?.id === item.id && (
                                            <span className="bg-primary text-primary-foreground absolute top-1 right-1 rounded-full p-0.5">
                                                <Check className="h-3 w-3" />
                                            </span>
                                        )}
                                    </button>
                                    {item.type !== 'image' && <p className="text-muted-foreground mt-1 truncate text-[10px]">{item.filename}</p>}
                                </li>
                            ))}
                        </ul>
                    )}
                    {loading && (
                        <div className="flex justify-center py-4">
                            <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
                        </div>
                    )}
                    {!loading && page < lastPage && (
                        <div className="flex justify-center pt-4">
                            <Button variant="outline" size="sm" onClick={() => load(page + 1)}>
                                {t('Cargar más')}
                            </Button>
                        </div>
                    )}

                    {dragging && (
                        <div className="border-primary bg-primary/5 pointer-events-none absolute inset-2 flex items-center justify-center rounded-xl border-2 border-dashed">
                            <span className="bg-card text-foreground rounded-lg px-3 py-2 text-xs font-semibold shadow-sm">
                                {t('Suelta para subir')}
                            </span>
                        </div>
                    )}
                </div>

                {/* Selection */}
                {selected && (
                    <div className="border-border bg-muted/30 space-y-3 border-t p-4">
                        <div className="flex items-center gap-3">
                            <span className="border-border/70 h-12 w-12 shrink-0 overflow-hidden rounded-md border">
                                <MediaThumb item={selected} iconClassName="h-5 w-5" />
                            </span>
                            <div className="min-w-0 text-xs">
                                <p className="text-foreground truncate font-semibold">{selected.title || selected.filename}</p>
                                <p className="text-muted-foreground">
                                    {selected.width && selected.height ? `${selected.width}×${selected.height} · ` : ''}
                                    {formatBytes(selected.size)}
                                </p>
                            </div>
                        </div>
                        {selected.type === 'image' && (
                            <div className="space-y-1">
                                <Label htmlFor="picker-alt" className="text-xs">
                                    {t('Texto alternativo')}
                                </Label>
                                <Input
                                    id="picker-alt"
                                    value={alt}
                                    onChange={(e) => setAlt(e.target.value)}
                                    placeholder={t('Describe la imagen')}
                                    className="bg-card h-9 text-xs"
                                />
                            </div>
                        )}
                        <Button type="button" className="w-full" onClick={insert} disabled={inserting}>
                            {inserting && <Loader2 className="h-4 w-4 animate-spin" />}
                            {selected.type === 'image' ? t('Insertar imagen') : t('Usar archivo')}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
