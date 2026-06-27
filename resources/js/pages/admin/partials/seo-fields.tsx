import React from 'react';
import QuickMediaDrawer from '@/components/quick-media-drawer';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Trash2, Globe } from 'lucide-react';

interface Props {
    values: {
        seo_title?: string;
        seo_description?: string;
        seo_keywords?: string;
        seo_og_image?: string;
    };
    onChange: (key: string, value: string) => void;
}

export default function SeoFields({ values, onChange }: Props) {
    const [mediaOpen, setMediaOpen] = React.useState(false);
    const descLength = values.seo_description?.length || 0;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-zinc-800 dark:text-zinc-200">
                <Globe className="h-4 w-4 text-red-600 dark:text-red-500" />
                <span>Metadatos SEO (Posicionamiento en Motores de Búsqueda)</span>
            </div>

            <div className="bg-zinc-50/20 dark:bg-[#161615]/30 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4">
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Meta Título (Título de búsqueda)</label>
                    <input
                        type="text"
                        value={values.seo_title || ''}
                        onChange={(e) => onChange('seo_title', e.target.value)}
                        className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-850 bg-transparent rounded-lg text-sm text-zinc-800 dark:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                        placeholder="Título optimizado para buscadores (deja vacío para usar título principal)"
                    />
                </div>

                <div className="space-y-1">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Meta Descripción</label>
                        <span className={`text-[10px] font-mono ${
                            descLength >= 120 && descLength <= 160 ? 'text-green-600' : 'text-zinc-400'
                        }`}>
                            {descLength} / 160 caracteres (Recomendado: 120-160)
                        </span>
                    </div>
                    <textarea
                        value={values.seo_description || ''}
                        onChange={(e) => onChange('seo_description', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-850 bg-transparent rounded-lg text-sm text-zinc-800 dark:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                        placeholder="Descripción atractiva para resultados de Google..."
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Palabras Clave (Keywords - separadas por coma)</label>
                    <input
                        type="text"
                        value={values.seo_keywords || ''}
                        onChange={(e) => onChange('seo_keywords', e.target.value)}
                        className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-850 bg-transparent rounded-lg text-sm text-zinc-800 dark:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                        placeholder="Ej. blog, proyectos, servicios, mewcms"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Imagen Open Graph (Facebook / Twitter Share preview)</label>
                    <div className="flex items-center gap-3">
                        <Button type="button" variant="outline" className="flex items-center gap-1 text-xs" onClick={() => setMediaOpen(true)}>
                            <ImageIcon className="h-4 w-4" />
                            <span>Elegir Imagen OG</span>
                        </Button>
                        <QuickMediaDrawer
                            isOpen={mediaOpen}
                            onClose={() => setMediaOpen(false)}
                            onSelect={(url) => {
                                onChange('seo_og_image', url);
                                setMediaOpen(false);
                            }}
                        />
                        {values.seo_og_image && (
                            <button
                                type="button"
                                onClick={() => onChange('seo_og_image', '')}
                                className="text-zinc-400 hover:text-red-500 transition-colors"
                                title="Eliminar imagen"
                            >
                                <Trash2 className="h-4.5 w-4.5" />
                            </button>
                        )}
                    </div>

                    {values.seo_og_image && (
                        <div className="aspect-[1.91/1] w-48 overflow-hidden rounded-lg border border-zinc-250 dark:border-zinc-800 shadow-xs bg-zinc-50">
                            <img src={values.seo_og_image} alt="OG Preview" className="w-full h-full object-cover" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
