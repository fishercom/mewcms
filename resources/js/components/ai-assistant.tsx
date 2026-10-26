import AiDraftPanel, { type AiDraft } from '@/components/ai-draft';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import apiClient from '@/services/api';
import { usePage } from '@inertiajs/react';
import { isAxiosError } from 'axios';
import { Check, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { useState } from 'react';

export type AiMetadataField = 'seo_title' | 'seo_description' | 'slug';

interface AssistantInput {
    id?: number | null;
    lang_id?: number | null;
    schema_id?: number | null;
    title?: string | null;
    content?: string | null;
    blocks?: unknown;
    metadata?: unknown;
}

interface MetadataSuggestions {
    keyword: string | null;
    titles: string[];
    descriptions: string[];
    slugs: string[];
}

function focusKeyword(metadata: unknown): string {
    const keywords = (metadata as { seo_keywords?: string } | null)?.seo_keywords ?? '';

    return keywords.split(',')[0]?.trim() ?? '';
}

/**
 * Sparkle button and side panel of the AI assistant: draft content and suggest metadata.
 * Suggestions are previews that only fill the form; nothing is stored until the editor saves.
 */
export default function AiAssistant({
    module,
    input,
    onApply,
    onDraft,
    className,
}: {
    module: 'articles' | 'posts';
    input: AssistantInput;
    onApply: (field: AiMetadataField, value: string) => void;
    onDraft: (draft: AiDraft, mode: 'replace' | 'append') => void;
    className?: string;
}) {
    const { ai_assistant } = usePage<{ ai_assistant?: boolean }>().props;
    const [open, setOpen] = useState(false);
    const [keyword, setKeyword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<MetadataSuggestions | null>(null);
    const [applied, setApplied] = useState<Record<string, string>>({});

    if (!ai_assistant) return null;

    const openPanel = () => {
        if (!keyword) setKeyword(focusKeyword(input.metadata));
        setOpen(true);
    };

    const suggest = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await apiClient.post<MetadataSuggestions>(route('ai.metadata'), {
                module,
                keyword: keyword.trim() || null,
                id: input.id,
                lang_id: input.lang_id,
                title: input.title,
                content: input.content,
                blocks: input.blocks,
                metadata: input.metadata,
            });
            setSuggestions(data);
            setApplied({});
        } catch (e) {
            setError((isAxiosError(e) && e.response?.data?.message) || t('No se pudieron generar sugerencias. Inténtalo de nuevo.'));
        } finally {
            setLoading(false);
        }
    };

    const apply = (field: AiMetadataField, value: string) => {
        onApply(field, value);
        setApplied({ ...applied, [field]: value });
    };

    const groups: { field: AiMetadataField; label: string; options: string[]; max?: number }[] = suggestions
        ? [
              { field: 'seo_title', label: t('Título SEO'), options: suggestions.titles, max: 60 },
              { field: 'seo_description', label: t('Meta descripción'), options: suggestions.descriptions, max: 155 },
              { field: 'slug', label: t('URL'), options: suggestions.slugs },
          ]
        : [];

    return (
        <>
            <Button type="button" variant="outline" size="sm" onClick={openPanel} className={cn('gap-1.5', className)}>
                <Sparkles className="text-primary h-3.5 w-3.5" />
                <span>{t('Asistente IA')}</span>
            </Button>

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
                    <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                            <Sparkles className="text-primary h-4 w-4" />
                            {t('Asistente IA')}
                        </SheetTitle>
                        <SheetDescription>
                            {t('Se envían el título, el texto y los campos SEO de esta página. Revisa cada sugerencia antes de guardar.')}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="space-y-5 px-4 pb-6">
                        <AiDraftPanel
                            module={module}
                            langId={input.lang_id}
                            schemaId={input.schema_id}
                            hasContent={Array.isArray(input.blocks) && input.blocks.length > 0}
                            onDraft={(draft, mode) => {
                                onDraft(draft, mode);
                                setOpen(false);
                            }}
                        />

                        <div className="border-border/70 bg-card space-y-3 rounded-2xl border p-4">
                            <h3 className="text-foreground flex items-center gap-1.5 text-sm font-bold">
                                <Wand2 className="h-4 w-4" />
                                {t('Sugerir metadatos')}
                            </h3>
                            <p className="text-muted-foreground text-xs">
                                {t('Tres opciones de título SEO, meta descripción y URL para una palabra clave.')}
                            </p>
                            <Input
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                placeholder={t('Palabra clave (opcional)')}
                                aria-label={t('Palabra clave')}
                                className="h-9 text-sm"
                            />
                            <Button type="button" onClick={suggest} disabled={loading} className="w-full gap-1.5">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                {suggestions ? t('Generar otras') : t('Sugerir metadatos')}
                            </Button>
                            {error && <p className="text-destructive text-xs">{error}</p>}
                        </div>

                        {groups.map((group) => (
                            <div key={group.field} className="space-y-2">
                                <h4 className="text-muted-foreground text-xs font-bold tracking-wider uppercase">{group.label}</h4>
                                {group.options.length === 0 && <p className="text-muted-foreground text-xs">{t('Sin sugerencias.')}</p>}
                                {group.options.map((option) => {
                                    const isApplied = applied[group.field] === option;

                                    return (
                                        <div key={option} className="border-border/70 flex items-start gap-2 rounded-xl border p-3">
                                            <div className="min-w-0 flex-1">
                                                <p
                                                    className={cn(
                                                        'text-foreground text-sm break-words',
                                                        group.field === 'slug' && 'font-mono text-xs',
                                                    )}
                                                >
                                                    {option}
                                                </p>
                                                {group.max && (
                                                    <p
                                                        className={cn(
                                                            'mt-1 text-[11px] tabular-nums',
                                                            option.length > group.max ? 'text-warning' : 'text-muted-foreground',
                                                        )}
                                                    >
                                                        {t(':count caracteres', { count: option.length })}
                                                    </p>
                                                )}
                                            </div>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant={isApplied ? 'secondary' : 'outline'}
                                                onClick={() => apply(group.field, option)}
                                                className="shrink-0 gap-1"
                                            >
                                                {isApplied && <Check className="h-3.5 w-3.5" />}
                                                {isApplied ? t('Aplicado') : t('Aplicar')}
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
