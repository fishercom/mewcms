import QuickMediaDrawer from '@/components/quick-media-drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import FormLayout from '@/layouts/module/Form';
import ModuleLayout from '@/layouts/module/layout';
import { Head, useForm } from '@inertiajs/react';
import { CheckCircle2, Code, Facebook, Globe, Instagram, Layout, Linkedin, RefreshCw, Trash2, Twitter, UploadCloud, Youtube } from 'lucide-react';
import React, { useState } from 'react';

interface Props {
    settings: {
        layout_header_logo: string | null;
        layout_footer_logo: string | null;
        layout_copyright: string;
        layout_facebook: string;
        layout_instagram: string;
        layout_twitter: string;
        layout_linkedin: string;
        layout_youtube: string;
        layout_custom_css: string;
    };
    flash?: {
        success?: string;
    };
}

export default function LayoutCustomizer({ settings, flash }: Props) {
    const [activeTab, setActiveTab] = useState<'general' | 'social' | 'css'>('general');
    const [drawerTarget, setDrawerTarget] = useState<'header' | 'footer' | null>(null);

    const { data, setData, post, processing } = useForm({
        layout_header_logo: settings.layout_header_logo || '',
        layout_footer_logo: settings.layout_footer_logo || '',
        layout_copyright: settings.layout_copyright || '',
        layout_facebook: settings.layout_facebook || '',
        layout_instagram: settings.layout_instagram || '',
        layout_twitter: settings.layout_twitter || '',
        layout_linkedin: settings.layout_linkedin || '',
        layout_youtube: settings.layout_youtube || '',
        layout_custom_css: settings.layout_custom_css || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('layout.update'));
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
            <Head title="Configuración del Sitio" />

            <FormLayout>
                <div className="space-y-6">
                    {/* Top alert feedback */}
                    {flash?.success && (
                        <div className="animate-in fade-in border-success/30 bg-success-soft text-success flex items-center gap-2 rounded-xl border p-4 text-xs font-semibold duration-200">
                            <CheckCircle2 className="text-success h-4.5 w-4.5 shrink-0" />
                            <span>{flash.success}</span>
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
                                <span>General & Logos</span>
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
                                <span>Redes Sociales</span>
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
                                <span>Personalización (CSS)</span>
                            </button>
                        </div>

                        {/* Tab Content: General & Logos */}
                        {activeTab === 'general' && (
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                {/* Header Logo Upload Card */}
                                <div className="border-border bg-card space-y-4 rounded-xl border p-5 shadow-xs">
                                    <div>
                                        <h3 className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                                            Logo de Cabecera (Header)
                                        </h3>
                                        <p className="text-muted-foreground mt-0.5 text-[10px]">Se muestra en la barra de navegación superior</p>
                                    </div>

                                    {data.layout_header_logo ? (
                                        <div className="border-border bg-muted/50 relative flex items-center justify-between gap-4 rounded-lg border p-3 dark:bg-black/10">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <div className="border-border bg-muted flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
                                                    <img
                                                        src={data.layout_header_logo}
                                                        alt="Header Logo"
                                                        className="max-h-full max-w-full object-contain"
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <span className="text-foreground block truncate text-xs font-semibold">Logo Seleccionado</span>
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
                                                    Cambiar
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
                                            <span className="text-foreground text-xs font-semibold">Seleccionar Logo de Cabecera</span>
                                            <span className="text-muted-foreground mt-1 text-[9px]">Busca o sube un archivo en la biblioteca</span>
                                        </div>
                                    )}
                                </div>

                                {/* Footer Logo Upload Card */}
                                <div className="border-border bg-card space-y-4 rounded-xl border p-5 shadow-xs">
                                    <div>
                                        <h3 className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                                            Logo de Pie de Página (Footer)
                                        </h3>
                                        <p className="text-muted-foreground mt-0.5 text-[10px]">Se muestra en la zona inferior del sitio</p>
                                    </div>

                                    {data.layout_footer_logo ? (
                                        <div className="border-border bg-muted/50 relative flex items-center justify-between gap-4 rounded-lg border p-3 dark:bg-black/10">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <div className="border-border bg-muted flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
                                                    <img
                                                        src={data.layout_footer_logo}
                                                        alt="Footer Logo"
                                                        className="max-h-full max-w-full object-contain"
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <span className="text-foreground block truncate text-xs font-semibold">Logo Seleccionado</span>
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
                                                    Cambiar
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
                                            <span className="text-foreground text-xs font-semibold">Seleccionar Logo de Footer</span>
                                            <span className="text-muted-foreground mt-1 text-[9px]">Busca o sube un archivo en la biblioteca</span>
                                        </div>
                                    )}
                                </div>

                                {/* Copyright Text Field */}
                                <div className="border-border bg-card space-y-3 rounded-xl border p-5 shadow-xs md:col-span-2">
                                    <Label htmlFor="layout_copyright" className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                                        Texto de Derechos Reservados (Copyright)
                                    </Label>
                                    <Input
                                        id="layout_copyright"
                                        type="text"
                                        value={data.layout_copyright}
                                        onChange={(e) => setData('layout_copyright', e.target.value)}
                                        className="bg-card h-9 w-full text-xs"
                                        placeholder="Ej: © 2026 MewCMS. Todos los derechos reservados."
                                    />
                                </div>
                            </div>
                        )}

                        {/* Tab Content: Social Networks */}
                        {activeTab === 'social' && (
                            <div className="border-border bg-card space-y-5 rounded-xl border p-5 shadow-xs">
                                <div>
                                    <h3 className="text-muted-foreground text-xs font-bold tracking-wider uppercase">Enlaces de Redes Sociales</h3>
                                    <p className="text-muted-foreground mt-0.5 text-[10px]">
                                        Introduce las URLs completas (con https://) para los íconos del layout
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {/* Facebook */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="layout_facebook" className="text-foreground flex items-center gap-1.5 text-xs font-semibold">
                                            <Facebook className="h-4 w-4 text-blue-600" />
                                            <span>Facebook</span>
                                        </Label>
                                        <Input
                                            id="layout_facebook"
                                            type="url"
                                            value={data.layout_facebook}
                                            onChange={(e) => setData('layout_facebook', e.target.value)}
                                            className="bg-card h-9 w-full text-xs"
                                            placeholder="https://facebook.com/usuario"
                                        />
                                    </div>

                                    {/* Instagram */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="layout_instagram" className="text-foreground flex items-center gap-1.5 text-xs font-semibold">
                                            <Instagram className="h-4 w-4 text-pink-600" />
                                            <span>Instagram</span>
                                        </Label>
                                        <Input
                                            id="layout_instagram"
                                            type="url"
                                            value={data.layout_instagram}
                                            onChange={(e) => setData('layout_instagram', e.target.value)}
                                            className="bg-card h-9 w-full text-xs"
                                            placeholder="https://instagram.com/usuario"
                                        />
                                    </div>

                                    {/* Twitter */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="layout_twitter" className="text-foreground flex items-center gap-1.5 text-xs font-semibold">
                                            <Twitter className="h-4 w-4 text-sky-500" />
                                            <span>Twitter / X</span>
                                        </Label>
                                        <Input
                                            id="layout_twitter"
                                            type="url"
                                            value={data.layout_twitter}
                                            onChange={(e) => setData('layout_twitter', e.target.value)}
                                            className="bg-card h-9 w-full text-xs"
                                            placeholder="https://x.com/usuario"
                                        />
                                    </div>

                                    {/* LinkedIn */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="layout_linkedin" className="text-foreground flex items-center gap-1.5 text-xs font-semibold">
                                            <Linkedin className="h-4 w-4 text-blue-700" />
                                            <span>LinkedIn</span>
                                        </Label>
                                        <Input
                                            id="layout_linkedin"
                                            type="url"
                                            value={data.layout_linkedin}
                                            onChange={(e) => setData('layout_linkedin', e.target.value)}
                                            className="bg-card h-9 w-full text-xs"
                                            placeholder="https://linkedin.com/in/usuario"
                                        />
                                    </div>

                                    {/* YouTube */}
                                    <div className="space-y-1.5 md:col-span-2">
                                        <Label htmlFor="layout_youtube" className="text-foreground flex items-center gap-1.5 text-xs font-semibold">
                                            <Youtube className="text-primary h-4 w-4" />
                                            <span>YouTube</span>
                                        </Label>
                                        <Input
                                            id="layout_youtube"
                                            type="url"
                                            value={data.layout_youtube}
                                            onChange={(e) => setData('layout_youtube', e.target.value)}
                                            className="bg-card h-9 w-full text-xs"
                                            placeholder="https://youtube.com/c/canal"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab Content: Custom CSS */}
                        {activeTab === 'css' && (
                            <div className="border-border bg-card space-y-4 rounded-xl border p-5 shadow-xs">
                                <div>
                                    <h3 className="text-muted-foreground text-xs font-bold tracking-wider uppercase">Estilos CSS Personalizados</h3>
                                    <p className="text-muted-foreground mt-0.5 text-[10px]">
                                        Se inyectarán como un bloque inline global en la cabecera del frontend
                                    </p>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="layout_custom_css" className="sr-only">
                                        CSS
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
                                        <span>Guardando...</span>
                                    </>
                                ) : (
                                    <span>Guardar Cambios</span>
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
