import QuickMediaDrawer from '@/components/quick-media-drawer';
import { Button } from '@/components/ui/button';
import { t } from '@/lib/i18n';
import { Globe, Image as ImageIcon, Trash2 } from 'lucide-react';
import React from 'react';

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
            <div className="text-foreground flex items-center gap-2 text-sm font-bold">
                <Globe className="text-primary h-4 w-4" />
                <span>{t('Metadatos SEO (Posicionamiento en Motores de Búsqueda)')}</span>
            </div>

            <div className="border-border bg-muted/50 space-y-4 rounded-xl border p-5">
                <div className="space-y-1">
                    <label className="text-muted-foreground text-xs font-semibold">{t('Meta Título (Título de búsqueda)')}</label>
                    <input
                        type="text"
                        value={values.seo_title || ''}
                        onChange={(e) => onChange('seo_title', e.target.value)}
                        className="border-border text-foreground focus-visible:ring-primary/40 w-full rounded-lg border bg-transparent px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                        placeholder={t('Título optimizado para buscadores (deja vacío para usar título principal)')}
                    />
                </div>

                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <label className="text-muted-foreground text-xs font-semibold">{t('Meta Descripción')}</label>
                        <span
                            className={`font-mono text-[10px] ${descLength >= 120 && descLength <= 160 ? 'text-success' : 'text-muted-foreground'}`}
                        >
                            {t(':count / 160 caracteres (Recomendado: 120-160)', { count: descLength })}
                        </span>
                    </div>
                    <textarea
                        value={values.seo_description || ''}
                        onChange={(e) => onChange('seo_description', e.target.value)}
                        rows={3}
                        className="border-border text-foreground focus-visible:ring-primary/40 w-full rounded-lg border bg-transparent px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                        placeholder={t('Descripción atractiva para resultados de Google...')}
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-muted-foreground text-xs font-semibold">{t('Palabras Clave (Keywords - separadas por coma)')}</label>
                    <input
                        type="text"
                        value={values.seo_keywords || ''}
                        onChange={(e) => onChange('seo_keywords', e.target.value)}
                        className="border-border text-foreground focus-visible:ring-primary/40 w-full rounded-lg border bg-transparent px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                        placeholder={t('Ej. blog, proyectos, servicios, mewcms')}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-muted-foreground text-xs font-semibold">{t('Imagen Open Graph (Facebook / Twitter Share preview)')}</label>
                    <div className="flex items-center gap-3">
                        <Button type="button" variant="outline" className="flex items-center gap-1 text-xs" onClick={() => setMediaOpen(true)}>
                            <ImageIcon className="h-4 w-4" />
                            <span>{t('Elegir Imagen OG')}</span>
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
                                className="text-muted-foreground hover:text-destructive transition-colors"
                                title={t('Eliminar imagen')}
                            >
                                <Trash2 className="h-4.5 w-4.5" />
                            </button>
                        )}
                    </div>

                    {values.seo_og_image && (
                        <div className="border-border bg-muted/50 aspect-[1.91/1] w-48 overflow-hidden rounded-lg border shadow-xs">
                            <img src={values.seo_og_image} alt={t('OG Preview')} className="h-full w-full object-cover" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
