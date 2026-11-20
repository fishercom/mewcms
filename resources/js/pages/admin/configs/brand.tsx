import { AppWordmark } from '@/components/app-logo';
import AppLogoIcon from '@/components/app-logo-icon';
import InputError from '@/components/input-error';
import QuickMediaDrawer from '@/components/quick-media-drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import FormLayout from '@/layouts/module/Form';
import ModuleLayout from '@/layouts/module/layout';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, ImageIcon, RefreshCw, Trash2, UploadCloud } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';

type ImageKey = 'logo' | 'logo_dark' | 'icon';

interface Props {
    settings: { name: string; tagline: string; logo: string; logo_dark: string; icon: string };
    upload: { extensions: string[]; max_kb: number };
    flash?: { success?: string };
}

const SLOTS: { key: ImageKey; title: string; help: string; dark?: boolean; square?: boolean }[] = [
    {
        key: 'logo',
        title: 'Logo',
        help: 'Logo horizontal: reemplaza al de MewCMS en el panel y en el inicio de sesión. Mejor en SVG, o PNG/WebP con fondo transparente.',
    },
    {
        key: 'logo_dark',
        title: 'Logo para modo oscuro',
        help: 'Opcional. Se usa cuando el panel está en modo oscuro, por ejemplo un logo con texto claro.',
        dark: true,
    },
    {
        key: 'icon',
        title: 'Ícono',
        help: 'Para logos cuadrados o verticales: sin logo horizontal, se muestra junto al nombre del cliente en texto. También se usa en el menú lateral contraído.',
        square: true,
    },
];

/** Object URLs for the files picked but not saved yet, so the previews show them */
function useFilePreviews(files: Record<ImageKey, File | null>) {
    const urls = useMemo(
        () =>
            Object.fromEntries(Object.entries(files).map(([key, file]) => [key, file ? URL.createObjectURL(file) : null])) as Record<
                ImageKey,
                string | null
            >,
        [files],
    );
    useEffect(() => () => Object.values(urls).forEach((url) => url && URL.revokeObjectURL(url)), [urls]);

    return urls;
}

export default function BrandSettings({ settings, upload, flash }: Props) {
    const [saved, setSaved] = useState(false);
    const [drawerTarget, setDrawerTarget] = useState<ImageKey | null>(null);
    const fileInputs = useRef<Record<ImageKey, HTMLInputElement | null>>({ logo: null, logo_dark: null, icon: null });

    const { data, setData, post, processing, errors } = useForm({
        name: settings.name ?? '',
        tagline: settings.tagline ?? '',
        logo: settings.logo ?? '',
        logo_dark: settings.logo_dark ?? '',
        icon: settings.icon ?? '',
        logo_file: null as File | null,
        logo_dark_file: null as File | null,
        icon_file: null as File | null,
    });

    const files = useMemo(
        () => ({ logo: data.logo_file, logo_dark: data.logo_dark_file, icon: data.icon_file }),
        [data.logo_file, data.logo_dark_file, data.icon_file],
    );
    const previews = useFilePreviews(files);
    const src = (key: ImageKey) => previews[key] ?? data[key];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSaved(false);
        post(route('configs.brand.update'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: (page) => {
                const fresh = (page.props as unknown as Props).settings;
                setData({ ...fresh, logo_file: null, logo_dark_file: null, icon_file: null });
                setSaved(true);
            },
        });
    };

    const pickFile = (key: ImageKey, file: File | undefined) => {
        if (file) {
            setData(`${key}_file`, file);
        }
    };

    const clear = (key: ImageKey) => {
        setData((prev) => ({ ...prev, [key]: '', [`${key}_file`]: null }));
        const input = fileInputs.current[key];
        if (input) {
            input.value = '';
        }
    };

    const accept = upload.extensions.map((ext) => '.' + ext).join(',');
    const brandName = data.name.trim() || t('Nombre del cliente');
    const logo = src('logo');
    const logoDark = src('logo_dark') || logo;
    const icon = src('icon');

    return (
        <ModuleLayout title={t('Configuración')}>
            <Head title={t('Marca del panel')} />

            <FormLayout>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h2 className="text-foreground text-base font-semibold">{t('Marca del panel')}</h2>
                            <p className="text-muted-foreground mt-0.5 max-w-2xl text-sm">
                                {t(
                                    'El logo del cliente reemplaza al de MewCMS en el panel y en el inicio de sesión. Debajo queda una pequeña firma "Con tecnología de MewCMS".',
                                )}
                            </p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={route('configs.index')}>
                                <ArrowLeft className="h-4 w-4" />
                                {t('Configuración')}
                            </Link>
                        </Button>
                    </div>

                    {(saved || flash?.success) && (
                        <div className="animate-in fade-in border-success/30 bg-success-soft text-success flex items-center gap-2 rounded-xl border p-4 text-xs font-semibold duration-200">
                            <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
                            <span>{flash?.success ?? t('Marca del panel guardada.')}</span>
                        </div>
                    )}

                    <div className="border-border bg-card grid max-w-3xl gap-4 rounded-xl border p-5 shadow-xs sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="brand-name">{t('Nombre del cliente')}</Label>
                            <Input
                                id="brand-name"
                                value={data.name}
                                maxLength={120}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder={t('Ej.: EMSAL')}
                            />
                            <p className="text-muted-foreground text-xs">
                                {t('Se muestra junto al ícono cuando no hay logo horizontal, y es el texto alternativo del logo.')}
                            </p>
                            <InputError message={errors.name} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="brand-tagline">{t('Subtítulo')}</Label>
                            <Input
                                id="brand-tagline"
                                value={data.tagline}
                                maxLength={60}
                                onChange={(e) => setData('tagline', e.target.value)}
                                placeholder={t('Ej.: Gestor de contenidos')}
                            />
                            <p className="text-muted-foreground text-xs">{t('Opcional. Línea pequeña bajo el nombre en el menú lateral.')}</p>
                            <InputError message={errors.tagline} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {SLOTS.map((slot) => {
                            const url = src(slot.key);
                            const error = errors[slot.key] ?? errors[`${slot.key}_file`];

                            return (
                                <div key={slot.key} className="border-border bg-card flex flex-col gap-4 rounded-xl border p-5 shadow-xs">
                                    <div>
                                        <h3 className="text-muted-foreground text-xs font-bold tracking-wider uppercase">{t(slot.title)}</h3>
                                        <p className="text-muted-foreground mt-1 text-xs">{t(slot.help)}</p>
                                    </div>

                                    <div
                                        className={cn(
                                            'flex h-32 items-center justify-center rounded-lg border border-dashed p-4',
                                            slot.dark ? 'border-white/15 bg-[#141220]' : 'bg-muted/40',
                                        )}
                                    >
                                        {url ? (
                                            <img src={url} alt="" className={cn('max-w-full object-contain', slot.square ? 'size-16' : 'max-h-20')} />
                                        ) : (
                                            <span
                                                className={cn(
                                                    'flex flex-col items-center gap-1 text-xs',
                                                    slot.dark ? 'text-white/50' : 'text-muted-foreground',
                                                )}
                                            >
                                                <ImageIcon className="h-6 w-6" />
                                                {t('Sin imagen')}
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-auto flex flex-wrap gap-2">
                                        <input
                                            ref={(el) => {
                                                fileInputs.current[slot.key] = el;
                                            }}
                                            type="file"
                                            accept={accept}
                                            className="hidden"
                                            onChange={(e) => pickFile(slot.key, e.target.files?.[0])}
                                        />
                                        <Button type="button" variant="outline" size="sm" onClick={() => fileInputs.current[slot.key]?.click()}>
                                            <UploadCloud className="h-4 w-4" />
                                            {t('Subir')}
                                        </Button>
                                        <Button type="button" variant="outline" size="sm" onClick={() => setDrawerTarget(slot.key)}>
                                            <ImageIcon className="h-4 w-4" />
                                            {t('Biblioteca')}
                                        </Button>
                                        {url && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                onClick={() => clear(slot.key)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                {t('Quitar')}
                                            </Button>
                                        )}
                                    </div>
                                    <InputError message={error} />
                                </div>
                            );
                        })}
                    </div>
                    <p className="text-muted-foreground text-xs">
                        {t('Formatos: :formats. Máximo :size KB. Los SVG se limpian al subirlos (sin scripts ni enlaces externos).', {
                            formats: upload.extensions.map((ext) => ext.toUpperCase()).join(', '),
                            size: upload.max_kb,
                        })}
                    </p>

                    {/* What the sidebar and the login screen will look like */}
                    <div className="space-y-3">
                        <h3 className="text-muted-foreground text-xs font-bold tracking-wider uppercase">{t('Vista previa')}</h3>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {[false, true].map((dark) => {
                                const current = dark ? logoDark : logo;

                                return (
                                    <div
                                        key={String(dark)}
                                        className={cn(
                                            'flex flex-col items-center gap-4 rounded-xl border p-6',
                                            dark ? 'border-white/10 bg-[#141220] text-white' : 'bg-white text-[#18142B]',
                                        )}
                                    >
                                        <div className="flex h-12 w-full max-w-60 items-center">
                                            {current ? (
                                                <img src={current} alt={brandName} className="max-h-10 max-w-full object-contain" />
                                            ) : icon ? (
                                                <span className="flex min-w-0 items-center gap-2.5">
                                                    <img src={icon} alt="" className="size-8 shrink-0 object-contain" />
                                                    <span className="grid min-w-0 leading-none">
                                                        <span className="truncate text-[15px] font-bold tracking-tight">{brandName}</span>
                                                        {data.tagline && <span className="mt-1 truncate text-[11px] opacity-60">{data.tagline}</span>}
                                                    </span>
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-2.5">
                                                    <AppLogoIcon className={cn('size-8', dark ? 'text-[#8B74FF]' : 'text-[#6447F0]')} />
                                                    <AppWordmark className="text-[15px]" />
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex w-full items-center gap-3 text-xs opacity-70">
                                            <span className="flex size-8 items-center justify-center overflow-hidden rounded-lg">
                                                {icon ? (
                                                    <img src={icon} alt="" className="size-8 object-contain" />
                                                ) : logo ? (
                                                    <span className="flex size-8 items-center justify-center rounded-lg bg-[#6447F0] text-sm font-bold text-white">
                                                        {brandName.charAt(0).toUpperCase()}
                                                    </span>
                                                ) : (
                                                    <AppLogoIcon className={cn('size-8', dark ? 'text-[#8B74FF]' : 'text-[#6447F0]')} />
                                                )}
                                            </span>
                                            {t('Menú lateral contraído')}
                                        </div>
                                        {(logo || icon) && <span className="text-xs opacity-60">{t('Con tecnología de MewCMS')}</span>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="border-border flex justify-end border-t pt-4">
                        <Button type="submit" disabled={processing}>
                            {processing ? (
                                <>
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                    {t('Guardando...')}
                                </>
                            ) : (
                                t('Guardar Cambios')
                            )}
                        </Button>
                    </div>
                </form>
            </FormLayout>

            <QuickMediaDrawer
                isOpen={drawerTarget !== null}
                onClose={() => setDrawerTarget(null)}
                onSelect={(url) => {
                    if (drawerTarget) {
                        const key = drawerTarget;
                        setData((prev) => ({ ...prev, [key]: url, [`${key}_file`]: null }));
                    }
                    setDrawerTarget(null);
                }}
                initialType="Images"
            />
        </ModuleLayout>
    );
}
