import QuickMediaDrawer from '@/components/quick-media-drawer';
import { type SocialLink } from '@/components/social-icon';
import SocialLinksEditor, { toSocialRows } from '@/components/social-links-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import FormLayout from '@/layouts/module/Form';
import ModuleLayout from '@/layouts/module/layout';
import { t } from '@/lib/i18n';
import { Head, useForm } from '@inertiajs/react';
import { CheckCircle2, Code, Globe, Layout, RefreshCw, Trash2, UploadCloud } from 'lucide-react';
import React, { useState } from 'react';

interface Props {
    settings: {
        layout_header_logo: string | null;
        layout_footer_logo: string | null;
        layout_copyright: string;
        layout_custom_css: string;
    };
    socialLinks: SocialLink[];
    flash?: {
        success?: string;
    };
}

export default function LayoutCustomizer({ settings, socialLinks, flash }: Props) {
    const [activeTab, setActiveTab] = useState<'general' | 'social' | 'css'>('general');
    const [saved, setSaved] = useState(false);
    const [drawerTarget, setDrawerTarget] = useState<'header' | 'footer' | null>(null);

    const { data, setData, post, processing, errors, clearErrors } = useForm({
        layout_header_logo: settings.layout_header_logo || '',
        layout_footer_logo: settings.layout_footer_logo || '',
        layout_copyright: settings.layout_copyright || '',
        social_links: toSocialRows(socialLinks ?? []),
        social_links_managed: true,
        layout_custom_css: settings.layout_custom_css || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSaved(false);
        post(route('layout.update'), {
            preserveScroll: true,
            // Show the links as the server stored them (https:// and mailto:/tel: added)
            onSuccess: (page) => {
                setData('social_links', toSocialRows((page.props as unknown as Props).socialLinks ?? []));
                setSaved(true);
            },
        });
    };

    const clearLogo = (type: 'header' | 'footer') => {
        if (type === 'header') {
            setData('layout_header_logo', '');
        } else {
            setData('layout_footer_logo', '');
        }
    };

    return (
        <ModuleLayout>
            <Head title={t('Configuración del Sitio')} />

            <FormLayout>
                <div className="space-y-6">
                    {/* Top alert feedback */}
                    {(saved || flash?.success) && (
                        <div className="animate-in fade-in border-success/30 bg-success-soft text-success flex items-center gap-2 rounded-xl border p-4 text-xs font-semibold duration-200">
                            <CheckCircle2 className="text-success h-4.5 w-4.5 shrink-0" />
                            <span>{flash?.success ?? t('Configuraciones de layout guardadas.')}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Tab Headers */}
                        <div className="border-border flex gap-4 border-b">
                            <button
                                type="button"
                                onClick={() => setActiveTab('general')}
                                className={`flex cursor-pointer items-center gap-2 border-b-2 pb-3.5 text-xs font-bold transition-all ${
                                    activeTab === 'general'
                                        ? 'border-primary text-primary'
                                        : 'text-muted-foreground hover:text-foreground border-transparent'
                                }`}
                            >
                                <Layout className="h-4 w-4" />
                                <span>{t('General & Logos')}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('social')}
                                className={`flex cursor-pointer items-center gap-2 border-b-2 pb-3.5 text-xs font-bold transition-all ${
                                    activeTab === 'social'
                                        ? 'border-primary text-primary'
                                        : 'text-muted-foreground hover:text-foreground border-transparent'
                                }`}
                            >
                                <Globe className="h-4 w-4" />
                                <span>{t('Redes Sociales')}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('css')}
                                className={`flex cursor-pointer items-center gap-2 border-b-2 pb-3.5 text-xs font-bold transition-all ${
                                    activeTab === 'css'
                                        ? 'border-primary text-primary'
                                        : 'text-muted-foreground hover:text-foreground border-transparent'
                                }`}
                            >
                                <Code className="h-4 w-4" />
                                <span>{t('Personalización (CSS)')}</span>
                            </button>
                        </div>

                        {/* Tab Content: General & Logos */}
                        {activeTab === 'general' && (
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                {/* Header Logo Upload Card */}
                                <div className="border-border bg-card space-y-4 rounded-xl border p-5 shadow-xs">
                                    <div>
                                        <h3 className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                                            {t('Logo de Cabecera (Header)')}
                                        </h3>
                                        <p className="text-muted-foreground mt-0.5 text-[10px]">
                                            {t('Se muestra en la barra de navegación superior')}
                                        </p>
                                    </div>

                                    {data.layout_header_logo ? (
                                        <div className="border-border bg-muted/50 relative flex items-center justify-between gap-4 rounded-lg border p-3 dark:bg-black/10">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <div className="border-border bg-muted flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
                                                    <img
                                                        src={data.layout_header_logo}
                                                        alt={t('Header Logo')}
                                                        className="max-h-full max-w-full object-contain"
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <span className="text-foreground block truncate text-xs font-semibold">
                                                        {t('Logo Seleccionado')}
                                                    </span>
                                                    <span
                                                        className="text-muted-foreground mt-0.5 block truncate text-[9px]"
                                                        title={data.layout_header_logo}
                                                    >
                                                        {data.layout_header_logo}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex shrink-0 gap-1.5">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 text-xs"
                                                    onClick={() => setDrawerTarget('header')}
                                                >
                                                    {t('Cambiar')}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    className="text-muted-foreground hover:text-destructive h-8 w-8"
                                                    onClick={() => clearLogo('header')}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => setDrawerTarget('header')}
                                            className="group border-border hover:border-primary/40 hover:bg-muted/30 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors"
                                        >
                                            <UploadCloud className="text-muted-foreground group-hover:text-primary mb-2 h-8 w-8 transition-colors" />
                                            <span className="text-foreground text-xs font-semibold">{t('Seleccionar Logo de Cabecera')}</span>
                                            <span className="text-muted-foreground mt-1 text-[9px]">
                                                {t('Busca o sube un archivo en la biblioteca')}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Footer Logo Upload Card */}
                                <div className="border-border bg-card space-y-4 rounded-xl border p-5 shadow-xs">
                                    <div>
                                        <h3 className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                                            {t('Logo de Pie de Página (Footer)')}
                                        </h3>
                                        <p className="text-muted-foreground mt-0.5 text-[10px]">{t('Se muestra en la zona inferior del sitio')}</p>
                                    </div>

                                    {data.layout_footer_logo ? (
                                        <div className="border-border bg-muted/50 relative flex items-center justify-between gap-4 rounded-lg border p-3 dark:bg-black/10">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <div className="border-border bg-muted flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
                                                    <img
                                                        src={data.layout_footer_logo}
                                                        alt={t('Footer Logo')}
                                                        className="max-h-full max-w-full object-contain"
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <span className="text-foreground block truncate text-xs font-semibold">
                                                        {t('Logo Seleccionado')}
                                                    </span>
                                                    <span
                                                        className="text-muted-foreground mt-0.5 block truncate text-[9px]"
                                                        title={data.layout_footer_logo}
                                                    >
                                                        {data.layout_footer_logo}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex shrink-0 gap-1.5">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 text-xs"
                                                    onClick={() => setDrawerTarget('footer')}
                                                >
                                                    {t('Cambiar')}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    className="text-muted-foreground hover:text-destructive h-8 w-8"
                                                    onClick={() => clearLogo('footer')}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => setDrawerTarget('footer')}
                                            className="group border-border hover:border-primary/40 hover:bg-muted/30 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors"
                                        >
                                            <UploadCloud className="text-muted-foreground group-hover:text-primary mb-2 h-8 w-8 transition-colors" />
                                            <span className="text-foreground text-xs font-semibold">{t('Seleccionar Logo de Footer')}</span>
                                            <span className="text-muted-foreground mt-1 text-[9px]">
                                                {t('Busca o sube un archivo en la biblioteca')}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Copyright Text Field */}
                                <div className="border-border bg-card space-y-3 rounded-xl border p-5 shadow-xs md:col-span-2">
                                    <Label htmlFor="layout_copyright" className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                                        {t('Texto de Derechos Reservados (Copyright)')}
                                    </Label>
                                    <Input
                                        id="layout_copyright"
                                        type="text"
                                        value={data.layout_copyright}
                                        onChange={(e) => setData('layout_copyright', e.target.value)}
                                        className="bg-card h-9 w-full text-xs"
                                        placeholder={t('Ej: © 2026 MewCMS. Todos los derechos reservados.')}
                                    />
                                    <p className="text-muted-foreground text-[11px]">
                                        {t('Admite enlaces simples, por ejemplo')} {t('<a href="https://tusitio.com" target="_blank">Tu empresa</a>')}
                                        {t('. Se elimina cualquier otro código.')}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Tab Content: Social Networks */}
                        {activeTab === 'social' && (
                            <div className="border-border bg-card space-y-5 rounded-xl border p-5 shadow-xs">
                                <div>
                                    <h3 className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                                        {t('Redes sociales y contacto')}
                                    </h3>
                                    <p className="text-muted-foreground mt-0.5 text-[10px]">
                                        {t('Enlaces con https://, un correo o un teléfono. El texto es opcional y se usa para lectores de pantalla.')}
                                    </p>
                                </div>

                                <SocialLinksEditor
                                    links={data.social_links}
                                    onChange={(links) => {
                                        setData('social_links', links);
                                        // Errors are keyed by position, so they go stale once the list changes
                                        const stale = Object.keys(errors).filter((key) => key.startsWith('social_links'));
                                        if (stale.length) clearErrors(...(stale as (keyof typeof errors)[]));
                                    }}
                                    errors={errors}
                                />
                            </div>
                        )}

                        {/* Tab Content: Custom CSS */}
                        {activeTab === 'css' && (
                            <div className="border-border bg-card space-y-4 rounded-xl border p-5 shadow-xs">
                                <div>
                                    <h3 className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                                        {t('Estilos CSS Personalizados')}
                                    </h3>
                                    <p className="text-muted-foreground mt-0.5 text-[10px]">
                                        {t('Se inyectarán como un bloque inline global en la cabecera del frontend')}
                                    </p>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="layout_custom_css" className="sr-only">
                                        {t('CSS')}
                                    </Label>
                                    <Textarea
                                        id="layout_custom_css"
                                        value={data.layout_custom_css}
                                        onChange={(e) => setData('layout_custom_css', e.target.value)}
                                        className="bg-muted/50 text-foreground min-h-[300px] font-mono text-xs focus-visible:ring-1 dark:bg-black/10"
                                        placeholder="/* Ejemplo: \nbody { \n  font-family: sans-serif; \n} */"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Submit Actions */}
                        <div className="flex items-center gap-3">
                            <Button
                                type="submit"
                                disabled={processing}
                                className="bg-primary text-primary-foreground hover:bg-primary/90 flex cursor-pointer items-center gap-1.5"
                            >
                                {processing ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                        <span>{t('Guardando...')}</span>
                                    </>
                                ) : (
                                    <span>{t('Guardar Cambios')}</span>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </FormLayout>

            {/* Media library drawer */}
            <QuickMediaDrawer
                isOpen={drawerTarget !== null}
                onClose={() => setDrawerTarget(null)}
                onSelect={(url) => {
                    if (drawerTarget === 'header') {
                        setData('layout_header_logo', url);
                    } else if (drawerTarget === 'footer') {
                        setData('layout_footer_logo', url);
                    }
                    setDrawerTarget(null);
                }}
                initialType="Images"
            />
        </ModuleLayout>
    );
}
