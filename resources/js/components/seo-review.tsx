import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import apiClient from '@/services/api';
import { CheckCircle2, CircleDashed, Loader2, SearchCheck, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export interface SeoCheck {
    key: string;
    status: 'pass' | 'fail' | 'skip';
    label: string;
    message: string;
}

export interface SeoResult {
    score: number;
    keyword: string | null;
    words: number;
    checks: SeoCheck[];
}

interface ReviewInput {
    id?: number | null;
    lang_id?: number | null;
    title?: string | null;
    content?: string | null;
    blocks?: unknown;
    metadata?: unknown;
}

/**
 * SEO review of the item being edited, refreshed a moment after the last change.
 */
export function useSeoReview(module: 'articles' | 'posts', input: ReviewInput): { result: SeoResult | null; loading: boolean } {
    const [result, setResult] = useState<SeoResult | null>(null);
    const [loading, setLoading] = useState(false);
    const payload = useMemo(
        () =>
            JSON.stringify({
                id: input.id,
                lang_id: input.lang_id,
                title: input.title,
                content: input.content,
                blocks: input.blocks,
                metadata: input.metadata,
            }),
        [input.id, input.lang_id, input.title, input.content, input.blocks, input.metadata],
    );

    useEffect(() => {
        let cancelled = false;
        const timer = window.setTimeout(async () => {
            setLoading(true);
            try {
                const { data } = await apiClient.post<SeoResult>(route(`${module}.seo-review`), JSON.parse(payload));
                if (!cancelled) setResult(data);
            } catch {
                // Keep the last result; the review is advice, not a blocker
            } finally {
                if (!cancelled) setLoading(false);
            }
        }, 800);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [module, payload]);

    return { result, loading };
}

export function scoreTone(score: number): string {
    return score >= 80 ? 'text-success' : score >= 50 ? 'text-warning' : 'text-destructive';
}

/**
 * Small score pill for tab labels and headers.
 */
export function SeoScoreBadge({ result, className }: { result: SeoResult | null; className?: string }) {
    if (!result) return null;

    return (
        <span className={cn('bg-muted rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums', scoreTone(result.score), className)}>
            {result.score}
        </span>
    );
}

export default function SeoReview({ result, loading }: { result: SeoResult | null; loading: boolean }) {
    const fails = result?.checks.filter((check) => check.status === 'fail') ?? [];
    const others = result?.checks.filter((check) => check.status !== 'fail') ?? [];

    return (
        <div className="border-border/70 bg-card space-y-4 rounded-2xl border p-4 shadow-2xs">
            <div className="flex items-center gap-3">
                <div className="relative h-14 w-14 shrink-0">
                    <svg viewBox="0 0 36 36" className="h-14 w-14 -rotate-90">
                        <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-muted" strokeWidth="3" />
                        {result && (
                            <circle
                                cx="18"
                                cy="18"
                                r="15.5"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeDasharray={`${(result.score / 100) * 97.4} 97.4`}
                                className={scoreTone(result.score)}
                            />
                        )}
                    </svg>
                    <span
                        className={cn(
                            'absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums',
                            result ? scoreTone(result.score) : 'text-muted-foreground',
                        )}
                    >
                        {result ? result.score : <Loader2 className="h-4 w-4 animate-spin" />}
                    </span>
                </div>
                <div className="min-w-0">
                    <h3 className="text-foreground flex items-center gap-1.5 text-sm font-bold">
                        <SearchCheck className="h-4 w-4" />
                        {t('Revisión SEO')}
                        {loading && result && <Loader2 className="text-muted-foreground h-3.5 w-3.5 animate-spin" />}
                    </h3>
                    <p className="text-muted-foreground text-xs">
                        {result?.keyword
                            ? t('Palabra clave: «:keyword» · :count palabras', { keyword: result.keyword, count: result.words })
                            : t('Se actualiza mientras escribes. Sin IA: reglas fijas, mismo resultado siempre.')}
                    </p>
                </div>
            </div>

            {result && (
                <ul className="space-y-2">
                    {[...fails, ...others].map((check) => (
                        <li key={check.key} className="flex gap-2 text-xs">
                            {check.status === 'pass' ? (
                                <CheckCircle2 className="text-success mt-0.5 h-3.5 w-3.5 shrink-0" />
                            ) : check.status === 'fail' ? (
                                <XCircle className="text-destructive mt-0.5 h-3.5 w-3.5 shrink-0" />
                            ) : (
                                <CircleDashed className="text-muted-foreground mt-0.5 h-3.5 w-3.5 shrink-0" />
                            )}
                            <span>
                                <span className="text-foreground font-semibold">{check.label}:</span>{' '}
                                <span className="text-muted-foreground">{check.message}</span>
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
