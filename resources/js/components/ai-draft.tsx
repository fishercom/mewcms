import { type BlockData } from '@/blocks/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { t } from '@/lib/i18n';
import apiClient from '@/services/api';
import { isAxiosError } from 'axios';
import { FilePlus2, Loader2, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useState } from 'react';

export interface AiDraft {
    title: string;
    blocks: BlockData[];
}

interface Outline {
    title: string;
    sections: { heading: string; summary: string }[];
}

const LENGTHS = [
    { value: 'short', label: 'Corto (~350 palabras)' },
    { value: 'medium', label: 'Medio (~700 palabras)' },
    { value: 'long', label: 'Largo (~1200 palabras)' },
];

const fieldClass =
    'border-input text-foreground focus:border-primary focus:ring-primary/20 w-full rounded-md border bg-transparent px-3 py-2 text-sm focus:ring-2 focus:outline-hidden';

/**
 * "Redactar contenido": a brief, then an outline the editor can adjust, then a full draft
 * as blocks that replaces the content or is added after it. Nothing is stored until saving.
 */
export default function AiDraftPanel({
    module,
    langId,
    schemaId,
    hasContent,
    onDraft,
}: {
    module: 'articles' | 'posts';
    langId?: number | null;
    schemaId?: number | null;
    hasContent: boolean;
    onDraft: (draft: AiDraft, mode: 'replace' | 'append') => void;
}) {
    const [brief, setBrief] = useState({ topic: '', keyword: '', audience: '', length: 'medium' });
    const [outline, setOutline] = useState<Outline | null>(null);
    const [draft, setDraft] = useState<AiDraft | null>(null);
    const [loading, setLoading] = useState<'outline' | 'draft' | null>(null);
    const [error, setError] = useState<string | null>(null);

    const request = () => ({ module, ...brief, lang_id: langId ?? null, schema_id: schemaId ?? null });

    const fail = (e: unknown) => setError((isAxiosError(e) && e.response?.data?.message) || t('Ocurrió un error.'));

    const proposeOutline = async () => {
        setLoading('outline');
        setError(null);
        setDraft(null);
        try {
            const { data } = await apiClient.post<Outline>(route('ai.outline'), request());
            setOutline(data);
        } catch (e) {
            fail(e);
        } finally {
            setLoading(null);
        }
    };

    const writeDraft = async () => {
        if (!outline) return;
        setLoading('draft');
        setError(null);
        try {
            const { data } = await apiClient.post<AiDraft>(route('ai.draft'), { ...request(), outline });
            setDraft(data);
        } catch (e) {
            fail(e);
        } finally {
            setLoading(null);
        }
    };

    const insert = (mode: 'replace' | 'append') => {
        if (!draft) return;
        if (mode === 'replace' && hasContent && !window.confirm(t('¿Reemplazar el contenido actual por el borrador?'))) return;
        onDraft(draft, mode);
        setDraft(null);
        setOutline(null);
    };

    const setSection = (index: number, heading: string) =>
        outline && setOutline({ ...outline, sections: outline.sections.map((section, i) => (i === index ? { ...section, heading } : section)) });

    return (
        <div className="border-border/70 bg-card space-y-3 rounded-2xl border p-4">
            <h3 className="text-foreground flex items-center gap-1.5 text-sm font-bold">
                <FilePlus2 className="h-4 w-4" />
                {t('Redactar contenido')}
            </h3>
            <p className="text-muted-foreground text-xs">
                {t('Describe la página y el asistente propone un esquema; ajústalo y redacta el borrador en bloques.')}
            </p>

            <textarea
                value={brief.topic}
                onChange={(e) => setBrief({ ...brief, topic: e.target.value })}
                rows={3}
                maxLength={1000}
                className={fieldClass}
                placeholder={t('¿De qué trata? Por ejemplo: servicio de diseño web para restaurantes, con precios a medida')}
                aria-label={t('Tema')}
            />
            <div className="grid grid-cols-2 gap-2">
                <Input
                    value={brief.keyword}
                    onChange={(e) => setBrief({ ...brief, keyword: e.target.value })}
                    placeholder={t('Palabra clave (opcional)')}
                    aria-label={t('Palabra clave')}
                    className="h-9 text-sm"
                />
                <select
                    value={brief.length}
                    onChange={(e) => setBrief({ ...brief, length: e.target.value })}
                    className="border-input text-foreground h-9 rounded-md border bg-transparent px-2 text-sm"
                    aria-label={t('Extensión')}
                >
                    {LENGTHS.map((length) => (
                        <option key={length.value} value={length.value}>
                            {t(length.label)}
                        </option>
                    ))}
                </select>
            </div>
            <Input
                value={brief.audience}
                onChange={(e) => setBrief({ ...brief, audience: e.target.value })}
                placeholder={t('Público (opcional)')}
                aria-label={t('Público')}
                className="h-9 text-sm"
            />
            <Button type="button" onClick={proposeOutline} disabled={loading !== null || brief.topic.trim() === ''} className="w-full gap-1.5">
                {loading === 'outline' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {outline ? t('Proponer otro esquema') : t('Proponer esquema')}
            </Button>

            {outline && (
                <div className="space-y-2 pt-1">
                    <Input
                        value={outline.title}
                        onChange={(e) => setOutline({ ...outline, title: e.target.value })}
                        aria-label={t('Título')}
                        className="h-9 text-sm font-semibold"
                    />
                    <ol className="space-y-1.5">
                        {outline.sections.map((section, index) => (
                            <li key={index} className="flex items-start gap-1.5">
                                <span className="text-muted-foreground w-4 pt-2 text-right text-xs tabular-nums">{index + 1}</span>
                                <div className="min-w-0 flex-1">
                                    <Input
                                        value={section.heading}
                                        onChange={(e) => setSection(index, e.target.value)}
                                        aria-label={t('Sección :number', { number: index + 1 })}
                                        className="h-8 text-xs"
                                    />
                                    {section.summary && <p className="text-muted-foreground mt-0.5 px-1 text-[11px]">{section.summary}</p>}
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground h-8 w-8"
                                    onClick={() => setOutline({ ...outline, sections: outline.sections.filter((_, i) => i !== index) })}
                                    disabled={outline.sections.length <= 1}
                                    aria-label={t('Quitar sección')}
                                    title={t('Quitar sección')}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </li>
                        ))}
                    </ol>
                    {outline.sections.length < 12 && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-xs"
                            onClick={() => setOutline({ ...outline, sections: [...outline.sections, { heading: '', summary: '' }] })}
                        >
                            <Plus className="h-3.5 w-3.5" />
                            {t('Añadir sección')}
                        </Button>
                    )}
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={writeDraft}
                        disabled={loading !== null || outline.sections.some((section) => section.heading.trim() === '')}
                        className="w-full gap-1.5"
                    >
                        {loading === 'draft' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        {loading === 'draft' ? t('Redactando... puede tardar un minuto') : draft ? t('Redactar de nuevo') : t('Redactar borrador')}
                    </Button>
                </div>
            )}

            {error && <p className="text-destructive text-xs">{error}</p>}

            {draft && (
                <div className="bg-muted/50 space-y-2 rounded-xl p-3">
                    <p className="text-foreground text-xs font-semibold">{t('Borrador listo: :count bloques', { count: draft.blocks.length })}</p>
                    <div className="flex gap-2">
                        <Button type="button" size="sm" onClick={() => insert('replace')} className="flex-1">
                            {t('Reemplazar contenido')}
                        </Button>
                        {hasContent && (
                            <Button type="button" size="sm" variant="outline" onClick={() => insert('append')} className="flex-1">
                                {t('Añadir al final')}
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
