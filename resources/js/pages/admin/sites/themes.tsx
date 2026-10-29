import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import ModuleLayout from '@/layouts/module/layout';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { CmsTheme } from '@/types/models/cms-site';
import { Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Download, ImageOff, Loader2, Package, Trash2, UploadCloud } from 'lucide-react';
import { DragEvent, useRef, useState } from 'react';

interface Props {
    themes: (CmsTheme & { sites: string[] })[];
    limits: { max_mb: number; extensions: string[] };
    errors: Record<string, string>;
    [key: string]: unknown;
}

export default function Themes() {
    const { themes, limits, errors } = usePage<Props>().props;
    const input = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [dragging, setDragging] = useState(false);

    const upload = (file: File | undefined) => {
        if (!file) return;
        router.post(
            route('themes.store'),
            { file },
            {
                forceFormData: true,
                preserveScroll: true,
                onStart: () => setUploading(true),
                onFinish: () => {
                    setUploading(false);
                    if (input.current) input.current.value = '';
                },
            },
        );
    };

    const onDrop = (e: DragEvent) => {
        e.preventDefault();
        setDragging(false);
        upload(e.dataTransfer.files[0]);
    };

    const remove = (theme: CmsTheme) => {
        if (!window.confirm(t('¿Eliminar el tema :name? Esta acción no se puede deshacer.').replace(':name', theme.name))) return;
        router.delete(route('themes.destroy', theme.slug), { preserveScroll: true });
    };

    return (
        <ModuleLayout view={t('Temas')}>
            <div className="space-y-6">
                <Link href={route('sites.index')} className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm">
                    <ArrowLeft className="h-4 w-4" />
                    {t('Volver a Sitios')}
                </Link>

                <div
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                    className={cn(
                        'flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors',
                        dragging ? 'border-primary bg-primary/5' : 'border-border',
                    )}
                >
                    {uploading ? (
                        <Loader2 className="text-primary mb-2 h-8 w-8 animate-spin" />
                    ) : (
                        <UploadCloud className="text-muted-foreground mb-2 h-8 w-8" />
                    )}
                    <p className="text-foreground text-sm font-semibold">{t('Subir un tema (.zip)')}</p>
                    <p className="text-muted-foreground mt-1 max-w-xl text-xs">
                        {t(
                            'Un .zip con theme.json en la raíz, y sus estilos, scripts, imágenes y fuentes. Si ya hay un tema con el mismo nombre, se actualiza. Máximo :max MB.',
                        ).replace(':max', String(limits.max_mb))}
                    </p>
                    <input ref={input} type="file" accept=".zip,application/zip" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
                    <Button type="button" size="sm" className="mt-4" disabled={uploading} onClick={() => input.current?.click()}>
                        {t('Elegir archivo')}
                    </Button>
                    <InputError className="mt-3" message={errors.file || errors.error} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {themes.map((theme) => (
                        <div key={theme.slug} className="border-border bg-card overflow-hidden rounded-xl border shadow-xs">
                            <div className="bg-muted aspect-[16/10] w-full overflow-hidden border-b">
                                {theme.screenshot ? (
                                    <img
                                        src={route('themes.screenshot', theme.slug)}
                                        alt={theme.name}
                                        loading="lazy"
                                        className="h-full w-full object-cover object-top"
                                    />
                                ) : (
                                    <div className="text-muted-foreground flex h-full w-full flex-col items-center justify-center gap-1 text-xs">
                                        <ImageOff className="h-6 w-6" />
                                        {t('Sin vista previa')}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2 p-4">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-foreground text-sm font-semibold">{theme.name}</span>
                                    {theme.version && <span className="text-muted-foreground text-[10px]">v{theme.version}</span>}
                                </div>
                                {theme.description && <p className="text-muted-foreground line-clamp-2 text-xs">{theme.description}</p>}
                                <div className="flex flex-wrap gap-1.5 text-[10px]">
                                    <span className="bg-muted text-muted-foreground inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium">
                                        <Package className="h-3 w-3" />
                                        {theme.uploaded ? t('Subido') : t('Incluido en el código')}
                                    </span>
                                    {theme.uploaded && theme.layout && (
                                        <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-medium">
                                            {t('Páginas de :layout').replace(
                                                ':layout',
                                                themes.find((item) => item.slug === theme.layout)?.name || theme.layout,
                                            )}
                                        </span>
                                    )}
                                </div>
                                <p className="text-muted-foreground text-xs">
                                    {theme.sites.length > 0
                                        ? t('Lo usan: :sites').replace(':sites', theme.sites.join(', '))
                                        : t('Ningún sitio lo usa')}
                                </p>
                                {theme.uploaded && (
                                    <div className="flex gap-2 pt-1">
                                        <a
                                            href={route('themes.download', theme.slug)}
                                            className="hover:bg-accent hover:text-accent-foreground border-border inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs font-medium"
                                        >
                                            <Download className="h-3.5 w-3.5" />
                                            {t('Descargar')}
                                        </a>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 gap-1 px-2.5 text-xs"
                                            disabled={theme.sites.length > 0}
                                            title={theme.sites.length > 0 ? t('Hay sitios que usan este tema.') : undefined}
                                            onClick={() => remove(theme)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            {t('Eliminar')}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </ModuleLayout>
    );
}
