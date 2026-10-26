import { RowCheckbox, runBulkAction, SelectAllCheckbox, TrashRowActions, TrashToggle, useRowSelection } from '@/components/content-bulk-actions';
import { formatBytes, MEDIA_TYPE_LABELS, MediaThumb, uploadMedia, type UploadProgress } from '@/components/media-library';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PaginationNav } from '@/components/ui/pagination-nav';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import ModuleLayout from '@/layouts/module/layout';
import { cn } from '@/lib/utils';
import { Pagination } from '@/types';
import { type CmsMedia } from '@/types/models/cms-media';
import { router, usePage } from '@inertiajs/react';
import { AlertTriangle, Check, Copy, ExternalLink, ImageIcon, LayoutGrid, List, Loader2, Search, Trash2, UploadCloud, X } from 'lucide-react';
import { DragEvent, FormEvent, useEffect, useRef, useState } from 'react';

interface Filters {
    s?: string;
    type?: string;
    trash?: string | boolean;
    view?: string;
}

interface Props {
    items: Pagination<CmsMedia>;
    filters: Filters;
    trashCount: number;
    accept: string[];
    [key: string]: unknown;
}

const TYPE_FILTERS = [
    { value: 'all', label: 'Todos los tipos' },
    { value: 'image', label: 'Imágenes' },
    { value: 'document', label: 'Documentos' },
    { value: 'video', label: 'Vídeos' },
    { value: 'audio', label: 'Audio' },
];

export default function MediaIndex() {
    const { items, filters, trashCount, accept } = usePage<Props>().props;
    const trash = filters.trash === true || filters.trash === '1' || filters.trash === 'true';
    const [view, setView] = useState<'grid' | 'list'>(filters.view === 'list' ? 'list' : 'grid');
    const [search, setSearch] = useState(filters.s ?? '');
    const [uploads, setUploads] = useState<UploadProgress[]>([]);
    const [dragging, setDragging] = useState(false);
    const [detailId, setDetailId] = useState<number | null>(null);
    const fileInput = useRef<HTMLInputElement>(null);
    const firstRender = useRef(true);

    const selection = useRowSelection(items.data.map((item) => item.id));
    const detail = items.data.find((item) => item.id === detailId) ?? null;
    const uploading = uploads.some((u) => u.progress < 100 && !u.error);

    const visit = (changes: Partial<Filters>) => {
        const next = {
            s: search || undefined,
            type: filters.type,
            trash: trash ? '1' : undefined,
            view: view === 'list' ? 'list' : undefined,
            ...changes,
        };
        router.get(
            route('media.index'),
            Object.fromEntries(Object.entries(next).filter(([, value]) => value !== undefined && value !== '' && value !== 'all')),
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }
        const timer = setTimeout(() => visit({ s: search || undefined }), 250);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const upload = async (files: File[]) => {
        if (files.length === 0 || trash) return;
        const stored = await uploadMedia(files, setUploads);
        if (stored.length > 0) {
            router.reload({ only: ['items', 'trashCount'] });
        }
        // Successful uploads leave the list after a moment; errors stay until dismissed
        setTimeout(() => setUploads((list) => list.filter((u) => u.error)), 1500);
    };

    const onDrop = (e: DragEvent) => {
        e.preventDefault();
        setDragging(false);
        upload(Array.from(e.dataTransfer.files));
    };

    const changeView = (value: string) => {
        if (value !== 'grid' && value !== 'list') return;
        setView(value);
        visit({ view: value === 'list' ? 'list' : undefined });
    };

    return (
        <ModuleLayout>
            <div
                className="relative space-y-4"
                onDragOver={(e) => {
                    if (trash || !e.dataTransfer.types.includes('Files')) return;
                    e.preventDefault();
                    setDragging(true);
                }}
                onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
                }}
                onDrop={onDrop}
            >
                {/* Toolbar */}
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-xl">
                        <div className="relative flex-1">
                            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar por nombre, título o texto alternativo..."
                                className="pl-9"
                                aria-label="Buscar medios"
                            />
                        </div>
                        <Select value={filters.type ?? 'all'} onValueChange={(value) => visit({ type: value })}>
                            <SelectTrigger className="sm:w-44" aria-label="Tipo de archivo">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {TYPE_FILTERS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <ToggleGroup type="single" value={view} onValueChange={changeView} variant="outline" size="sm" aria-label="Vista">
                            <ToggleGroupItem value="grid" aria-label="Cuadrícula">
                                <LayoutGrid className="h-4 w-4" />
                            </ToggleGroupItem>
                            <ToggleGroupItem value="list" aria-label="Lista">
                                <List className="h-4 w-4" />
                            </ToggleGroupItem>
                        </ToggleGroup>
                        <TrashToggle trash={trash} count={trashCount} onChange={(value) => visit({ trash: value ? '1' : undefined })} />
                        {!trash && (
                            <Button onClick={() => fileInput.current?.click()} disabled={uploading} className="h-10 gap-1.5">
                                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                                Subir archivos
                            </Button>
                        )}
                        <input
                            ref={fileInput}
                            type="file"
                            multiple
                            accept={accept.join(',')}
                            className="hidden"
                            onChange={(e) => {
                                upload(Array.from(e.target.files ?? []));
                                e.target.value = '';
                            }}
                        />
                    </div>
                </div>

                {/* Upload progress */}
                {uploads.length > 0 && (
                    <ul className="border-border/70 bg-card space-y-2 rounded-xl border p-3 text-xs" aria-live="polite">
                        {uploads.map((u, i) => (
                            <li key={`${u.name}-${i}`} className="flex items-center gap-3">
                                <span className="text-foreground min-w-0 flex-1 truncate font-medium">{u.name}</span>
                                {u.error ? (
                                    <span className="text-destructive flex items-center gap-1">
                                        <AlertTriangle className="h-3.5 w-3.5" />
                                        {u.error}
                                    </span>
                                ) : u.progress === 100 ? (
                                    <span className="text-success flex items-center gap-1">
                                        <Check className="h-3.5 w-3.5" />
                                        Subido
                                    </span>
                                ) : (
                                    <span className="bg-muted h-1.5 w-32 overflow-hidden rounded-full">
                                        <span className="bg-primary block h-full transition-all" style={{ width: `${u.progress}%` }} />
                                    </span>
                                )}
                            </li>
                        ))}
                        {uploads.some((u) => u.error) && (
                            <li>
                                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setUploads([])}>
                                    Cerrar
                                </Button>
                            </li>
                        )}
                    </ul>
                )}

                {/* Bulk actions */}
                {selection.selected.length > 0 && (
                    <div className="border-border/70 bg-muted/40 flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2 text-xs">
                        <span className="text-foreground font-medium">
                            {selection.selected.length} {selection.selected.length === 1 ? 'seleccionado' : 'seleccionados'}
                        </span>
                        <div className="ml-auto flex items-center gap-1.5">
                            {trash ? (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8"
                                        onClick={() => runBulkAction('media.bulk', 'restore', selection.selected, selection.clear)}
                                    >
                                        Restaurar
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="h-8"
                                        onClick={() => runBulkAction('media.bulk', 'force_delete', selection.selected, selection.clear)}
                                    >
                                        Eliminar definitivamente
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="h-8 gap-1"
                                    onClick={() => runBulkAction('media.bulk', 'trash', selection.selected, selection.clear)}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Mover a papelera
                                </Button>
                            )}
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={selection.clear} aria-label="Quitar selección">
                                <X className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                )}

                {items.data.length === 0 ? (
                    <EmptyLibrary trash={trash} filtered={!!filters.s || !!filters.type} onUpload={() => fileInput.current?.click()} />
                ) : view === 'grid' ? (
                    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
                        {items.data.map((item) => (
                            <li key={item.id} className="group relative">
                                <button
                                    type="button"
                                    onClick={() => setDetailId(item.id)}
                                    className={cn(
                                        'border-border/70 bg-muted/30 focus-visible:ring-primary/40 block aspect-square w-full overflow-hidden rounded-xl border transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:outline-none',
                                        selection.isSelected(item.id) && 'ring-primary ring-2',
                                    )}
                                    aria-label={`Detalles de ${item.title || item.filename}`}
                                >
                                    <MediaThumb item={item} />
                                </button>
                                <div
                                    className={cn(
                                        'bg-card/90 absolute top-2 left-2 flex rounded-md p-1 shadow-xs transition-opacity',
                                        selection.isSelected(item.id)
                                            ? 'opacity-100'
                                            : 'opacity-0 group-focus-within:opacity-100 group-hover:opacity-100',
                                    )}
                                >
                                    <RowCheckbox
                                        checked={selection.isSelected(item.id)}
                                        onToggle={() => selection.toggle(item.id)}
                                        label={item.filename}
                                    />
                                </div>
                                {item.type === 'image' && !item.alt && !trash && (
                                    <span className="bg-warning-soft text-warning absolute top-2 right-2 rounded-md px-1.5 py-0.5 text-[10px] font-semibold">
                                        Sin alt
                                    </span>
                                )}
                                <p className="text-foreground mt-1.5 truncate text-xs font-medium" title={item.filename}>
                                    {item.title || item.filename}
                                </p>
                                <p className="text-muted-foreground text-[11px]">
                                    {item.width && item.height ? `${item.width}×${item.height} · ` : ''}
                                    {formatBytes(item.size)}
                                </p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="text-muted-foreground w-full text-left text-sm">
                            <thead className="bg-table-header text-muted-foreground text-xs uppercase">
                                <tr>
                                    <th scope="col" className="w-10 rounded-l-md px-4 py-3">
                                        <SelectAllCheckbox state={selection.allState} onToggle={selection.toggleAll} />
                                    </th>
                                    <th scope="col" className="px-4 py-3">
                                        Archivo
                                    </th>
                                    <th scope="col" className="hidden px-4 py-3 md:table-cell">
                                        Texto alternativo
                                    </th>
                                    <th scope="col" className="hidden px-4 py-3 sm:table-cell">
                                        Tipo
                                    </th>
                                    <th scope="col" className="hidden px-4 py-3 lg:table-cell">
                                        Tamaño
                                    </th>
                                    <th scope="col" className="hidden px-4 py-3 lg:table-cell">
                                        Subido
                                    </th>
                                    <th scope="col" className="rounded-r-md px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.data.map((item) => (
                                    <tr key={item.id} className="hover:bg-muted/50 border-b">
                                        <td className="px-4 py-2.5">
                                            <RowCheckbox
                                                checked={selection.isSelected(item.id)}
                                                onToggle={() => selection.toggle(item.id)}
                                                label={item.filename}
                                            />
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <button
                                                type="button"
                                                onClick={() => setDetailId(item.id)}
                                                className="flex min-w-0 items-center gap-3 text-left"
                                            >
                                                <span className="border-border/70 bg-muted/30 h-10 w-10 shrink-0 overflow-hidden rounded-md border">
                                                    <MediaThumb item={item} iconClassName="h-5 w-5" />
                                                </span>
                                                <span className="min-w-0">
                                                    <span className="text-foreground block truncate font-medium hover:underline">
                                                        {item.title || item.filename}
                                                    </span>
                                                    <span className="block truncate font-mono text-[11px]">{item.filename}</span>
                                                </span>
                                            </button>
                                        </td>
                                        <td className="hidden max-w-xs truncate px-4 py-2.5 text-xs md:table-cell">
                                            {item.alt ? (
                                                item.alt
                                            ) : item.type === 'image' ? (
                                                <span className="text-warning font-medium">Sin texto alternativo</span>
                                            ) : (
                                                '—'
                                            )}
                                        </td>
                                        <td className="hidden px-4 py-2.5 text-xs sm:table-cell">{MEDIA_TYPE_LABELS[item.type]}</td>
                                        <td className="hidden px-4 py-2.5 text-xs whitespace-nowrap lg:table-cell">{formatBytes(item.size)}</td>
                                        <td className="hidden px-4 py-2.5 text-xs whitespace-nowrap lg:table-cell">
                                            {new Date(item.created_at).toLocaleDateString('es')}
                                        </td>
                                        <td className="px-4 py-2.5 text-right">
                                            {trash ? (
                                                <TrashRowActions routeName="media.bulk" id={item.id} />
                                            ) : (
                                                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setDetailId(item.id)}>
                                                    Editar
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {view === 'grid' && items.data.length > 0 && (
                    <label className="text-muted-foreground flex w-fit items-center gap-2 text-xs">
                        <Checkbox checked={selection.allState} onCheckedChange={selection.toggleAll} />
                        Seleccionar todos en esta página
                    </label>
                )}

                {items.last_page > 1 && <PaginationNav data={items} />}

                {dragging && (
                    <div className="border-primary bg-primary/5 pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-2xl border-2 border-dashed backdrop-blur-[1px]">
                        <div className="bg-card text-foreground flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-md">
                            <UploadCloud className="text-primary h-5 w-5" />
                            Suelta los archivos para subirlos
                        </div>
                    </div>
                )}
            </div>

            <MediaDetail item={detail} trash={trash} onClose={() => setDetailId(null)} />
        </ModuleLayout>
    );
}

function EmptyLibrary({ trash, filtered, onUpload }: { trash: boolean; filtered: boolean; onUpload: () => void }) {
    return (
        <div className="border-border/80 bg-muted/20 flex flex-col items-center rounded-xl border border-dashed px-6 py-14 text-center">
            <div className="bg-primary-soft text-primary-soft-foreground mb-3 flex h-11 w-11 items-center justify-center rounded-xl">
                <ImageIcon className="h-5 w-5" />
            </div>
            <p className="text-foreground text-sm font-semibold">
                {trash ? 'La papelera está vacía' : filtered ? 'No hay archivos que coincidan' : 'Tu biblioteca está vacía'}
            </p>
            {!trash && !filtered && (
                <>
                    <p className="text-muted-foreground mt-1 mb-4 max-w-sm text-xs">
                        Arrastra imágenes o documentos aquí, o elígelos desde tu equipo.
                    </p>
                    <Button onClick={onUpload} className="gap-1.5">
                        <UploadCloud className="h-4 w-4" />
                        Subir archivos
                    </Button>
                </>
            )}
        </div>
    );
}

function MediaDetail({ item, trash, onClose }: { item: CmsMedia | null; trash: boolean; onClose: () => void }) {
    const [form, setForm] = useState({ alt: '', caption: '', title: '' });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [copied, setCopied] = useState(false);
    const itemId = item?.id;

    // Load the fields when another file is opened (not when the list refreshes after saving)
    useEffect(() => {
        if (item) {
            setForm({ alt: item.alt ?? '', caption: item.caption ?? '', title: item.title ?? '' });
            setSaved(false);
            setErrors({});
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [itemId]);

    if (!item) {
        return null;
    }

    const save = (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        router.put(route('media.update', item.id), form, {
            preserveScroll: true,
            preserveState: true,
            only: ['items'],
            onSuccess: () => {
                setSaved(true);
                setErrors({});
            },
            onError: setErrors,
            onFinish: () => setSaving(false),
        });
    };

    const copyUrl = async () => {
        await navigator.clipboard.writeText(item.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const moveToTrash = () => {
        if (!window.confirm('¿Mover este archivo a la papelera?')) return;
        router.delete(route('media.destroy', item.id), { preserveScroll: true, onSuccess: onClose });
    };

    return (
        <Sheet open onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-md">
                <SheetHeader className="border-b">
                    <SheetTitle className="truncate pr-6">{item.title || item.filename}</SheetTitle>
                    <SheetDescription className="truncate font-mono text-xs">{item.filename}</SheetDescription>
                </SheetHeader>

                <div className="space-y-5 p-4">
                    <div className="border-border/70 bg-muted/30 flex max-h-72 items-center justify-center overflow-hidden rounded-xl border">
                        {item.type === 'image' ? (
                            <img src={item.url} alt={item.alt ?? ''} className="max-h-72 w-auto object-contain" />
                        ) : (
                            <div className="h-40 w-full">
                                <MediaThumb item={item} iconClassName="h-12 w-12" />
                            </div>
                        )}
                    </div>

                    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
                        <dt className="text-muted-foreground">Tipo</dt>
                        <dd className="text-foreground">
                            {MEDIA_TYPE_LABELS[item.type]} · {item.mime}
                        </dd>
                        <dt className="text-muted-foreground">Tamaño</dt>
                        <dd className="text-foreground">
                            {formatBytes(item.size)}
                            {item.width && item.height ? ` · ${item.width}×${item.height} px` : ''}
                        </dd>
                        {item.variants && (
                            <>
                                <dt className="text-muted-foreground">Versiones</dt>
                                <dd className="text-foreground">
                                    WebP de{' '}
                                    {Object.keys(item.variants)
                                        .map(Number)
                                        .sort((a, b) => a - b)
                                        .join(', ')}{' '}
                                    px
                                </dd>
                            </>
                        )}
                        <dt className="text-muted-foreground">Subido</dt>
                        <dd className="text-foreground">
                            {new Date(item.created_at).toLocaleString('es')}
                            {item.uploader ? ` · ${item.uploader.name}` : ''}
                        </dd>
                    </dl>

                    <div className="flex gap-2">
                        <Input
                            value={item.url}
                            readOnly
                            className="h-9 font-mono text-xs"
                            aria-label="URL del archivo"
                            onFocus={(e) => e.target.select()}
                        />
                        <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={copyUrl} aria-label="Copiar URL">
                            {copied ? <Check className="text-success h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0" asChild>
                            <a href={item.url} target="_blank" rel="noopener noreferrer" aria-label="Abrir en una pestaña nueva">
                                <ExternalLink className="h-4 w-4" />
                            </a>
                        </Button>
                    </div>

                    {trash ? (
                        <TrashRowActions routeName="media.bulk" id={item.id} />
                    ) : (
                        <form onSubmit={save} className="space-y-4">
                            {item.type === 'image' && (
                                <div className="space-y-1.5">
                                    <Label htmlFor="media-alt">Texto alternativo</Label>
                                    <Textarea
                                        id="media-alt"
                                        rows={2}
                                        value={form.alt}
                                        onChange={(e) => setForm({ ...form, alt: e.target.value })}
                                        placeholder="Describe la imagen para quien no puede verla"
                                        aria-invalid={!!errors.alt}
                                    />
                                    {errors.alt ? (
                                        <p className="text-destructive text-xs">{errors.alt}</p>
                                    ) : (
                                        <p className="text-muted-foreground text-[11px]">
                                            Se usa en el sitio cuando la imagen no tiene su propio texto. Déjalo vacío si es decorativa.
                                        </p>
                                    )}
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <Label htmlFor="media-title">Título</Label>
                                <Input
                                    id="media-title"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    aria-invalid={!!errors.title}
                                />
                                {errors.title && <p className="text-destructive text-xs">{errors.title}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="media-caption">Leyenda</Label>
                                <Textarea
                                    id="media-caption"
                                    rows={2}
                                    value={form.caption}
                                    onChange={(e) => setForm({ ...form, caption: e.target.value })}
                                />
                                {errors.caption && <p className="text-destructive text-xs">{errors.caption}</p>}
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-1">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5"
                                    onClick={moveToTrash}
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Mover a papelera
                                </Button>
                                <div className="flex items-center gap-2">
                                    {saved && (
                                        <span className="text-success flex items-center gap-1 text-xs font-medium">
                                            <Check className="h-3.5 w-3.5" />
                                            Guardado
                                        </span>
                                    )}
                                    <Button type="submit" disabled={saving}>
                                        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                                        Guardar
                                    </Button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
