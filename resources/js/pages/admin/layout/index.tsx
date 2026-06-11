import React, { useState } from 'react';
import { useForm, Head } from '@inertiajs/react';
import ModuleLayout from '@/layouts/module/layout';
import FormLayout from '@/layouts/module/Form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import QuickMediaDrawer from '@/components/quick-media-drawer';
import { 
    Layout, Globe, Facebook, Instagram, Twitter, 
    Linkedin, Youtube, Code, UploadCloud, Trash2, 
    CheckCircle2, RefreshCw 
} from 'lucide-react';

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
            <Head title="Personalizar Layout" />
            
            <FormLayout>
                <div className="space-y-6">
                    {/* Top alert feedback */}
                    {flash?.success && (
                        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 p-4 rounded-xl text-emerald-800 dark:text-emerald-400 text-xs font-semibold animate-in fade-in duration-200">
                            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-500 shrink-0" />
                            <span>{flash.success}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* Tab Headers */}
                        <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-4">
                            <button
                                type="button"
                                onClick={() => setActiveTab('general')}
                                className={`flex items-center gap-2 pb-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                                    activeTab === 'general'
                                        ? 'border-red-600 text-red-600 dark:border-red-500 dark:text-red-500'
                                        : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                                }`}
                            >
                                <Layout className="h-4 w-4" />
                                <span>General & Logos</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('social')}
                                className={`flex items-center gap-2 pb-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                                    activeTab === 'social'
                                        ? 'border-red-600 text-red-600 dark:border-red-500 dark:text-red-500'
                                        : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                                }`}
                            >
                                <Globe className="h-4 w-4" />
                                <span>Redes Sociales</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('css')}
                                className={`flex items-center gap-2 pb-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                                    activeTab === 'css'
                                        ? 'border-red-600 text-red-600 dark:border-red-500 dark:text-red-500'
                                        : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                                }`}
                            >
                                <Code className="h-4 w-4" />
                                <span>Personalización (CSS)</span>
                            </button>
                        </div>

                        {/* Tab Content: General & Logos */}
                        {activeTab === 'general' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                
                                {/* Header Logo Upload Card */}
                                <div className="bg-white dark:bg-[#161615] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-4 shadow-xs">
                                    <div>
                                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Logo de Cabecera (Header)</h3>
                                        <p className="text-[10px] text-zinc-400 mt-0.5">Se muestra en la barra de navegación superior</p>
                                    </div>
                                    
                                    {data.layout_header_logo ? (
                                        <div className="relative border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 bg-zinc-50/50 dark:bg-black/10 flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-14 h-14 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                                                    <img src={data.layout_header_logo} alt="Header Logo" className="max-w-full max-h-full object-contain" />
                                                </div>
                                                <div className="min-w-0">
                                                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate block">Logo Seleccionado</span>
                                                    <span className="text-[9px] text-zinc-450 truncate block mt-0.5" title={data.layout_header_logo}>
                                                        {data.layout_header_logo}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex gap-1.5 shrink-0">
                                                <Button type="button" size="sm" variant="outline" className="h-8 text-xs" onClick={() => setDrawerTarget('header')}>Cambiar</Button>
                                                <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:text-red-500" onClick={() => clearLogo('header')}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div 
                                            onClick={() => setDrawerTarget('header')}
                                            className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-red-500/40 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-zinc-50/30 dark:hover:bg-zinc-900/10 transition-colors group"
                                        >
                                            <UploadCloud className="h-8 w-8 text-zinc-400 group-hover:text-red-500 mb-2 transition-colors" />
                                            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Seleccionar Logo de Cabecera</span>
                                            <span className="text-[9px] text-zinc-400 mt-1">Busca o sube un archivo en la biblioteca</span>
                                        </div>
                                    )}
                                </div>

                                {/* Footer Logo Upload Card */}
                                <div className="bg-white dark:bg-[#161615] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-4 shadow-xs">
                                    <div>
                                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Logo de Pie de Página (Footer)</h3>
                                        <p className="text-[10px] text-zinc-400 mt-0.5">Se muestra en la zona inferior del sitio</p>
                                    </div>
                                    
                                    {data.layout_footer_logo ? (
                                        <div className="relative border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 bg-zinc-50/50 dark:bg-black/10 flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-14 h-14 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                                                    <img src={data.layout_footer_logo} alt="Footer Logo" className="max-w-full max-h-full object-contain" />
                                                </div>
                                                <div className="min-w-0">
                                                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate block">Logo Seleccionado</span>
                                                    <span className="text-[9px] text-zinc-450 truncate block mt-0.5" title={data.layout_footer_logo}>
                                                        {data.layout_footer_logo}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex gap-1.5 shrink-0">
                                                <Button type="button" size="sm" variant="outline" className="h-8 text-xs" onClick={() => setDrawerTarget('footer')}>Cambiar</Button>
                                                <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:text-red-500" onClick={() => clearLogo('footer')}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div 
                                            onClick={() => setDrawerTarget('footer')}
                                            className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-red-500/40 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-zinc-50/30 dark:hover:bg-zinc-900/10 transition-colors group"
                                        >
                                            <UploadCloud className="h-8 w-8 text-zinc-400 group-hover:text-red-500 mb-2 transition-colors" />
                                            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Seleccionar Logo de Footer</span>
                                            <span className="text-[9px] text-zinc-400 mt-1">Busca o sube un archivo en la biblioteca</span>
                                        </div>
                                    )}
                                </div>

                                {/* Copyright Text Field */}
                                <div className="md:col-span-2 bg-white dark:bg-[#161615] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-3 shadow-xs">
                                    <Label htmlFor="layout_copyright" className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Texto de Derechos Reservados (Copyright)</Label>
                                    <Input
                                        id="layout_copyright"
                                        type="text"
                                        value={data.layout_copyright}
                                        onChange={(e) => setData('layout_copyright', e.target.value)}
                                        className="w-full text-xs h-9 bg-white dark:bg-[#161615]"
                                        placeholder="Ej: © 2026 MewCMS. Todos los derechos reservados."
                                    />
                                </div>
                            </div>
                        )}

                        {/* Tab Content: Social Networks */}
                        {activeTab === 'social' && (
                            <div className="bg-white dark:bg-[#161615] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-5 shadow-xs">
                                <div>
                                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Enlaces de Redes Sociales</h3>
                                    <p className="text-[10px] text-zinc-400 mt-0.5">Introduce las URLs completas (con https://) para los íconos del layout</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Facebook */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="layout_facebook" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                                            <Facebook className="h-4 w-4 text-blue-600" />
                                            <span>Facebook</span>
                                        </Label>
                                        <Input
                                            id="layout_facebook"
                                            type="url"
                                            value={data.layout_facebook}
                                            onChange={(e) => setData('layout_facebook', e.target.value)}
                                            className="w-full text-xs h-9 bg-white dark:bg-[#161615]"
                                            placeholder="https://facebook.com/usuario"
                                        />
                                    </div>

                                    {/* Instagram */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="layout_instagram" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                                            <Instagram className="h-4 w-4 text-pink-600" />
                                            <span>Instagram</span>
                                        </Label>
                                        <Input
                                            id="layout_instagram"
                                            type="url"
                                            value={data.layout_instagram}
                                            onChange={(e) => setData('layout_instagram', e.target.value)}
                                            className="w-full text-xs h-9 bg-white dark:bg-[#161615]"
                                            placeholder="https://instagram.com/usuario"
                                        />
                                    </div>

                                    {/* Twitter */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="layout_twitter" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                                            <Twitter className="h-4 w-4 text-sky-500" />
                                            <span>Twitter / X</span>
                                        </Label>
                                        <Input
                                            id="layout_twitter"
                                            type="url"
                                            value={data.layout_twitter}
                                            onChange={(e) => setData('layout_twitter', e.target.value)}
                                            className="w-full text-xs h-9 bg-white dark:bg-[#161615]"
                                            placeholder="https://x.com/usuario"
                                        />
                                    </div>

                                    {/* LinkedIn */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="layout_linkedin" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                                            <Linkedin className="h-4 w-4 text-blue-700" />
                                            <span>LinkedIn</span>
                                        </Label>
                                        <Input
                                            id="layout_linkedin"
                                            type="url"
                                            value={data.layout_linkedin}
                                            onChange={(e) => setData('layout_linkedin', e.target.value)}
                                            className="w-full text-xs h-9 bg-white dark:bg-[#161615]"
                                            placeholder="https://linkedin.com/in/usuario"
                                        />
                                    </div>

                                    {/* YouTube */}
                                    <div className="space-y-1.5 md:col-span-2">
                                        <Label htmlFor="layout_youtube" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                                            <Youtube className="h-4 w-4 text-red-600" />
                                            <span>YouTube</span>
                                        </Label>
                                        <Input
                                            id="layout_youtube"
                                            type="url"
                                            value={data.layout_youtube}
                                            onChange={(e) => setData('layout_youtube', e.target.value)}
                                            className="w-full text-xs h-9 bg-white dark:bg-[#161615]"
                                            placeholder="https://youtube.com/c/canal"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab Content: Custom CSS */}
                        {activeTab === 'css' && (
                            <div className="bg-white dark:bg-[#161615] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-4 shadow-xs">
                                <div>
                                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Estilos CSS Personalizados</h3>
                                    <p className="text-[10px] text-zinc-400 mt-0.5">Se inyectarán como un bloque inline global en la cabecera del frontend</p>
                                </div>
                                
                                <div className="space-y-1.5">
                                    <Label htmlFor="layout_custom_css" className="sr-only">CSS</Label>
                                    <Textarea
                                        id="layout_custom_css"
                                        value={data.layout_custom_css}
                                        onChange={(e) => setData('layout_custom_css', e.target.value)}
                                        className="font-mono text-xs min-h-[300px] bg-zinc-50 dark:bg-black/10 text-zinc-800 dark:text-zinc-300 focus-visible:ring-1"
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
                                className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-500 dark:hover:bg-red-600 flex items-center gap-1.5 cursor-pointer"
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
