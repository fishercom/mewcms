import { BLOCK_RENDERERS } from '@/blocks/registry';
import { type BlockData, type BlockDefinition, type BlockValues } from '@/blocks/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { t } from '@/lib/i18n';
import apiClient from '@/services/api';
import { usePage } from '@inertiajs/react';
import { isAxiosError } from 'axios';
import { Languages, Loader2, Maximize2, Minimize2, PenLine, RefreshCw, Sparkles, SpellCheck, Wand2 } from 'lucide-react';
import { useState } from 'react';

const TEXT_TYPES = ['text', 'textarea', 'html_editor'];

const TONES = [
    { value: 'formal', label: 'Formal' },
    { value: 'friendly', label: 'Cercano' },
    { value: 'persuasive', label: 'Persuasivo' },
    { value: 'neutral', label: 'Neutral' },
];

const LANGUAGES = [
    { value: 'es', label: 'Español' },
    { value: 'en', label: 'Inglés' },
    { value: 'pt', label: 'Portugués' },
    { value: 'fr', label: 'Francés' },
    { value: 'it', label: 'Italiano' },
    { value: 'de', label: 'Alemán' },
];

interface Request {
    action: string;
    option?: string;
    label: string;
}

/** Whether a block type has text the assistant can rewrite */
export function hasAiText(type: BlockDefinition | undefined): boolean {
    return Boolean(
        type?.fields.some(
            (field) =>
                TEXT_TYPES.includes(field.type) || (field.type === 'repeater' && (field.fields ?? []).some((sub) => TEXT_TYPES.includes(sub.type))),
        ),
    );
}

/**
 * Sparkle menu of a block's toolbar: rewrite, shorten, expand, fix, change tone or
 * translate its texts. The answer is shown as a preview; "Aplicar" replaces the block's
 * data in the form, and nothing is stored until the editor saves.
 */
export default function AiBlockMenu({ block, onApply }: { block: BlockData; onApply: (data: BlockValues) => void }) {
    const { ai_assistant } = usePage<{ ai_assistant?: boolean }>().props;
    const [request, setRequest] = useState<Request | null>(null);
    const [result, setResult] = useState<BlockValues | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!ai_assistant) return null;

    const run = async (next: Request) => {
        setRequest(next);
        setResult(null);
        setError(null);
        setLoading(true);
        try {
            const { data } = await apiClient.post<{ data: BlockValues }>(route('ai.improve-block'), {
                block: { type: block.type, data: block.data },
                action: next.action,
                option: next.option ?? null,
            });
            setResult(data.data);
        } catch (e) {
            setError((isAxiosError(e) && e.response?.data?.message) || t('No se pudo mejorar el bloque. Inténtalo de nuevo.'));
        } finally {
            setLoading(false);
        }
    };

    const close = () => {
        setRequest(null);
        setResult(null);
        setError(null);
    };

    const apply = () => {
        if (result) onApply(result);
        close();
    };

    const Render = BLOCK_RENDERERS[block.type];

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-primary h-7 w-7"
                        aria-label={t('Mejorar con IA')}
                        title={t('Mejorar con IA')}
                    >
                        <Sparkles className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem onSelect={() => run({ action: 'rewrite', label: t('Reescribir') })}>
                        <PenLine className="h-4 w-4" />
                        {t('Reescribir')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => run({ action: 'shorten', label: t('Acortar') })}>
                        <Minimize2 className="h-4 w-4" />
                        {t('Acortar')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => run({ action: 'expand', label: t('Ampliar') })}>
                        <Maximize2 className="h-4 w-4" />
                        {t('Ampliar')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => run({ action: 'fix', label: t('Corregir ortografía') })}>
                        <SpellCheck className="h-4 w-4" />
                        {t('Corregir ortografía')}
                    </DropdownMenuItem>
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                            <Wand2 className="text-muted-foreground mr-2 h-4 w-4" />
                            {t('Cambiar tono')}
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                            {TONES.map((tone) => (
                                <DropdownMenuItem
                                    key={tone.value}
                                    onSelect={() => run({ action: 'tone', option: tone.value, label: t('Tono: :tone', { tone: t(tone.label) }) })}
                                >
                                    {t(tone.label)}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                            <Languages className="text-muted-foreground mr-2 h-4 w-4" />
                            {t('Traducir')}
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                            {LANGUAGES.map((language) => (
                                <DropdownMenuItem
                                    key={language.value}
                                    onSelect={() =>
                                        run({
                                            action: 'translate',
                                            option: language.value,
                                            label: t('Traducir al :language', { language: t(language.label) }),
                                        })
                                    }
                                >
                                    {t(language.label)}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={request !== null} onOpenChange={(open) => !open && close()}>
                <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="text-primary h-4 w-4" />
                            {request?.label}
                        </DialogTitle>
                        <DialogDescription>
                            {t('Revisa la propuesta. Al aplicarla reemplaza el texto del bloque; nada se guarda hasta que pulses Guardar.')}
                        </DialogDescription>
                    </DialogHeader>

                    {loading && (
                        <div className="text-muted-foreground flex items-center justify-center gap-2 py-12 text-sm">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {t('El asistente está escribiendo...')}
                        </div>
                    )}
                    {error && <p className="text-destructive text-sm">{error}</p>}
                    {result && Render && (
                        <div className="border-border pointer-events-none rounded-xl border p-3">
                            <Render data={result} editing />
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        <Button type="button" variant="ghost" onClick={close}>
                            {t('Descartar')}
                        </Button>
                        {request && (
                            <Button type="button" variant="outline" onClick={() => run(request)} disabled={loading} className="gap-1.5">
                                <RefreshCw className="h-4 w-4" />
                                {t('Otra versión')}
                            </Button>
                        )}
                        <Button type="button" onClick={apply} disabled={!result || loading}>
                            {t('Aplicar')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
