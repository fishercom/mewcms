import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ModuleLayout from '@/layouts/module/layout';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import apiClient from '@/services/api';
import { useForm, usePage } from '@inertiajs/react';
import { isAxiosError } from 'axios';
import { format } from 'date-fns';
import { CheckCircle2, KeyRound, Loader2, PlugZap, Sparkles, Wallet, XCircle } from 'lucide-react';
import { FormEvent, useState } from 'react';

interface Price {
    name: string;
    input: number;
    output: number;
}

interface ModelSetup {
    id: string;
    price: Price | null;
}

type Props = {
    setup: {
        enabled: boolean;
        has_key: boolean;
        provider: string | null;
        model: ModelSetup;
        fast_model: ModelSetup | null;
        mixed_providers: boolean;
    };
    catalog: { name: string; models: (Price & { id: string })[] }[];
    settings: { monthly_budget: number; tone: string; audience: string };
    usage: {
        spent: number;
        calls: number;
        by_model: { model: string; calls: number; input_tokens: number; output_tokens: number; cost: number }[];
        recent: { id: number; model: string; action: string; cost: number; created_at: string; user: { name: string } | null }[];
    };
    can_configure: boolean;
};

const ACTIONS: Record<string, string> = {
    metadata: 'Sugerir metadatos',
    improve_block: 'Mejorar bloque',
    outline: 'Esquema',
    draft: 'Borrador',
    test: 'Prueba de conexión',
};

const usd = (value: number, digits = 2) => `$${Number(value).toFixed(digits)}`;

function ModelLine({ label, model }: { label: string; model: ModelSetup }) {
    return (
        <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="text-foreground">
                <code className="bg-muted rounded px-1.5 py-0.5 text-xs">{model.id}</code>
                <span className="text-muted-foreground ml-2 text-xs">
                    {model.price
                        ? t(':input / :output por millón de tokens', { input: usd(model.price.input), output: usd(model.price.output) })
                        : t('Precio desconocido: no cuenta en el presupuesto')}
                </span>
            </span>
        </div>
    );
}

export default function Index() {
    const { setup, catalog, settings, usage, can_configure } = usePage<Props>().props;
    const form = useForm({ monthly_budget: settings.monthly_budget, tone: settings.tone, audience: settings.audience });
    const [testing, setTesting] = useState(false);
    const [test, setTest] = useState<{ ok: boolean; message: string } | null>(null);
    const budgetUsed = settings.monthly_budget > 0 ? Math.min(100, (usage.spent / settings.monthly_budget) * 100) : 100;

    const save = (e: FormEvent) => {
        e.preventDefault();
        form.put(route('ai.update'), { preserveScroll: true });
    };

    const runTest = async () => {
        setTesting(true);
        setTest(null);
        try {
            const { data } = await apiClient.post<{ ok: boolean; message: string }>(route('ai.test'));
            setTest(data);
        } catch (e) {
            setTest({ ok: false, message: (isAxiosError(e) && e.response?.data?.message) || t('Ocurrió un error.') });
        } finally {
            setTesting(false);
        }
    };

    return (
        <ModuleLayout>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="space-y-6 lg:col-span-7">
                    {/* Model and key, from .env */}
                    <div className="border-border/70 bg-card space-y-4 rounded-2xl border p-5 shadow-2xs">
                        <div className="flex items-center justify-between gap-3">
                            <h3 className="text-foreground flex items-center gap-2 text-sm font-bold">
                                <KeyRound className="h-4 w-4" />
                                {t('Modelo y clave')}
                            </h3>
                            <span
                                className={cn(
                                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                                    setup.enabled ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive',
                                )}
                            >
                                {setup.enabled ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                {setup.enabled ? t('Activo') : t('Sin configurar')}
                            </span>
                        </div>

                        <div className="space-y-2">
                            <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                                <span className="text-muted-foreground">{t('Proveedor')}</span>
                                <span className="text-foreground font-semibold">{setup.provider ?? t('Desconocido')}</span>
                            </div>
                            <ModelLine label={t('Modelo')} model={setup.model} />
                            {setup.fast_model && <ModelLine label={t('Modelo rápido')} model={setup.fast_model} />}
                            <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                                <span className="text-muted-foreground">{t('Clave API')}</span>
                                <span className={setup.has_key ? 'text-success' : 'text-destructive'}>
                                    {setup.has_key ? t('Definida') : t('Falta')}
                                </span>
                            </div>
                        </div>

                        {setup.mixed_providers && (
                            <p className="text-warning text-xs">
                                {t('El modelo rápido es de otro proveedor: debe usar la misma clave que el modelo principal.')}
                            </p>
                        )}

                        <p className="text-muted-foreground text-xs">
                            {t('Se definen en .env: AI_MODEL, AI_API_KEY y, opcional, AI_FAST_MODEL para las tareas pequeñas.')}
                        </p>

                        {can_configure && (
                            <div className="flex flex-wrap items-center gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={runTest}
                                    disabled={testing || !setup.enabled}
                                    className="gap-1.5"
                                >
                                    {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlugZap className="h-3.5 w-3.5" />}
                                    {t('Probar conexión')}
                                </Button>
                                {test && <span className={cn('text-xs', test.ok ? 'text-success' : 'text-destructive')}>{test.message}</span>}
                            </div>
                        )}
                    </div>

                    {/* Budget, tone and audience */}
                    <form onSubmit={save} className="border-border/70 bg-card space-y-4 rounded-2xl border p-5 shadow-2xs">
                        <h3 className="text-foreground flex items-center gap-2 text-sm font-bold">
                            <Sparkles className="h-4 w-4" />
                            {t('Ajustes del asistente')}
                        </h3>

                        <div className="grid gap-2">
                            <Label htmlFor="monthly_budget">{t('Presupuesto mensual (USD)')}</Label>
                            <Input
                                id="monthly_budget"
                                type="number"
                                min={0}
                                step="1"
                                value={form.data.monthly_budget}
                                onChange={(e) => form.setData('monthly_budget', Number(e.target.value))}
                                disabled={!can_configure}
                            />
                            <p className="text-muted-foreground text-xs">
                                {t('Al llegar a este gasto en el mes, el asistente se desactiva hasta el mes siguiente.')}
                            </p>
                            <InputError message={form.errors.monthly_budget} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="tone">{t('Tono')}</Label>
                            <Input
                                id="tone"
                                value={form.data.tone}
                                onChange={(e) => form.setData('tone', e.target.value)}
                                disabled={!can_configure}
                            />
                            <InputError message={form.errors.tone} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="audience">{t('Público')}</Label>
                            <Input
                                id="audience"
                                value={form.data.audience}
                                onChange={(e) => form.setData('audience', e.target.value)}
                                placeholder={t('Por ejemplo: pequeñas empresas de Lima')}
                                disabled={!can_configure}
                            />
                            <InputError message={form.errors.audience} />
                        </div>

                        {can_configure ? (
                            <Button type="submit" disabled={form.processing}>
                                {t('Guardar')}
                            </Button>
                        ) : (
                            <p className="text-muted-foreground text-xs">{t('Solo quien administra Configuración puede cambiar estos ajustes.')}</p>
                        )}
                    </form>

                    {/* Known models and prices */}
                    <div className="border-border/70 bg-card space-y-3 rounded-2xl border p-5 shadow-2xs">
                        <h3 className="text-foreground text-sm font-bold">{t('Modelos con precio conocido')}</h3>
                        <div className="overflow-x-auto">
                            <table className="text-muted-foreground w-full text-left text-xs">
                                <thead className="bg-table-header text-muted-foreground uppercase">
                                    <tr>
                                        <th className="rounded-l-md px-3 py-2">{t('Proveedor')}</th>
                                        <th className="px-3 py-2">AI_MODEL</th>
                                        <th className="rounded-r-md px-3 py-2 text-right">{t('Entrada / salida')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {catalog.flatMap((provider) =>
                                        provider.models.map((model) => (
                                            <tr key={model.id} className="border-b">
                                                <td className="px-3 py-2">{provider.name}</td>
                                                <td className="text-foreground px-3 py-2 font-mono">{model.id}</td>
                                                <td className="px-3 py-2 text-right tabular-nums">
                                                    {usd(model.input)} / {usd(model.output)}
                                                </td>
                                            </tr>
                                        )),
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <p className="text-muted-foreground text-xs">{t('Precios en USD por millón de tokens.')}</p>
                    </div>
                </div>

                {/* Usage this month */}
                <div className="space-y-6 lg:col-span-5">
                    <div className="border-border/70 bg-card space-y-4 rounded-2xl border p-5 shadow-2xs">
                        <h3 className="text-foreground flex items-center gap-2 text-sm font-bold">
                            <Wallet className="h-4 w-4" />
                            {t('Consumo de este mes')}
                        </h3>
                        <div className="flex items-baseline justify-between">
                            <span className="text-foreground text-2xl font-bold tabular-nums">{usd(usage.spent)}</span>
                            <span className="text-muted-foreground text-xs">
                                {t('de :budget · :count llamadas', { budget: usd(settings.monthly_budget), count: usage.calls })}
                            </span>
                        </div>
                        <div className="bg-muted h-2 overflow-hidden rounded-full">
                            <div
                                className={cn(
                                    'h-full rounded-full',
                                    budgetUsed >= 90 ? 'bg-destructive' : budgetUsed >= 70 ? 'bg-warning' : 'bg-primary',
                                )}
                                style={{ width: `${budgetUsed}%` }}
                            />
                        </div>

                        {usage.by_model.length > 0 && (
                            <ul className="space-y-1.5 text-xs">
                                {usage.by_model.map((row) => (
                                    <li key={row.model} className="flex justify-between gap-2">
                                        <span className="text-foreground font-mono">{row.model}</span>
                                        <span className="text-muted-foreground tabular-nums">
                                            {t(':count llamadas', { count: row.calls })} · {usd(row.cost, 4)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="border-border/70 bg-card space-y-3 rounded-2xl border p-5 shadow-2xs">
                        <h3 className="text-foreground text-sm font-bold">{t('Últimas llamadas')}</h3>
                        {usage.recent.length === 0 ? (
                            <p className="text-muted-foreground text-xs">{t('Todavía no se ha usado el asistente.')}</p>
                        ) : (
                            <ul className="divide-border divide-y text-xs">
                                {usage.recent.map((row) => (
                                    <li key={row.id} className="flex justify-between gap-2 py-2">
                                        <span>
                                            <span className="text-foreground font-semibold">{t(ACTIONS[row.action] ?? row.action)}</span>
                                            <span className="text-muted-foreground"> · {row.user?.name ?? '—'}</span>
                                        </span>
                                        <span className="text-muted-foreground tabular-nums">
                                            {format(new Date(row.created_at), 'dd/MM HH:mm')} · {usd(row.cost, 4)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </ModuleLayout>
    );
}
