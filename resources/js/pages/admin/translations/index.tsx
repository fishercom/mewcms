import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import ModuleLayout from '@/layouts/module/layout';
import { t } from '@/lib/i18n';
import { CmsTranslationItem } from '@/types/models/cms-translation';
import { router, usePage } from '@inertiajs/react';
import { RotateCcw, Save, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

type Filter = 'all' | 'changed' | 'missing';

interface Props {
    items: CmsTranslationItem[];
    theme: string;
    locale: string;
    fallback: string;
    site: string | null;
    [key: string]: unknown;
}

/**
 * The fixed texts of the site's theme, grouped by the first part of their key. Each row
 * shows the theme's text; typing a value replaces it on this site only.
 */
export default function Index() {
    const { items, theme, locale, fallback, site } = usePage<Props>().props;
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<Filter>('all');
    const [edits, setEdits] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    const visible = useMemo(() => {
        const term = search.trim().toLowerCase();

        return items.filter((item) => {
            if (filter === 'changed' && item.value === null) return false;
            if (filter === 'missing' && !item.missing) return false;
            if (!term) return true;

            return [item.key, item.default ?? '', item.value ?? ''].some((text) => text.toLowerCase().includes(term));
        });
    }, [items, search, filter]);

    const groups = useMemo(() => {
        const out: Record<string, CmsTranslationItem[]> = {};
        for (const item of visible) {
            (out[item.group] ??= []).push(item);
        }

        return out;
    }, [visible]);

    const dirty = Object.keys(edits).length;
    const missingCount = items.filter((item) => item.missing && !item.unused).length;

    const save = () => {
        setSaving(true);
        router.put(
            route('translations.update'),
            { texts: Object.entries(edits).map(([key, value]) => ({ key, value })) },
            {
                preserveScroll: true,
                onSuccess: () => setEdits({}),
                onFinish: () => setSaving(false),
            },
        );
    };

    const reset = (item: CmsTranslationItem) => {
        if (item.id && window.confirm(t('¿Volver al texto del tema para ":key"?', { key: item.key }))) {
            router.delete(route('translations.destroy', item.id), { preserveScroll: true });
        }
    };

    return (
        <ModuleLayout>
            <div className="space-y-4">
                <p className="text-muted-foreground text-sm">
                    {t('Textos fijos del tema :theme en :locale para :site. Lo que escribas aquí reemplaza el texto del tema solo en este sitio.', {
                        theme,
                        locale,
                        site: site ?? t('el sitio'),
                    })}
                </p>

                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <div className="relative flex-1">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Search className="text-muted-foreground h-4 w-4" />
                        </div>
                        <Input
                            type="text"
                            autoFocus
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                            placeholder={t('Buscar por clave o texto...')}
                        />
                    </div>
                    <div className="flex gap-1">
                        {(
                            [
                                ['all', t('Todos')],
                                ['changed', t('Cambiados')],
                                ['missing', t('Sin traducir (:count)', { count: missingCount })],
                            ] as [Filter, string][]
                        ).map(([value, label]) => (
                            <Button
                                key={value}
                                type="button"
                                size="sm"
                                variant={filter === value ? 'default' : 'outline'}
                                onClick={() => setFilter(value)}
                            >
                                {label}
                            </Button>
                        ))}
                    </div>
                    <Button type="button" onClick={save} disabled={dirty === 0 || saving} className="flex items-center gap-1.5">
                        <Save className="h-4 w-4" />
                        {dirty > 0 ? t('Guardar (:count)', { count: dirty }) : t('Guardar')}
                    </Button>
                </div>

                {visible.length === 0 && <p className="text-muted-foreground py-10 text-center text-sm">{t('No hay textos que coincidan.')}</p>}

                {Object.entries(groups).map(([group, rows]) => (
                    <section key={group} className="border-border overflow-hidden rounded-lg border">
                        <h2 className="bg-table-header text-muted-foreground px-4 py-2 text-xs font-semibold tracking-wide uppercase">{group}</h2>
                        <div className="divide-border divide-y">
                            {rows.map((item) => {
                                const value = edits[item.key] ?? item.value ?? '';
                                const long = (item.default ?? value).length > 80;

                                return (
                                    <div
                                        key={item.key}
                                        className="grid gap-2 px-4 py-3 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] md:items-start"
                                    >
                                        <div className="min-w-0 space-y-1">
                                            <code className="text-foreground block truncate text-xs" title={item.key}>
                                                {item.key}
                                            </code>
                                            <p className="text-muted-foreground text-sm break-words">
                                                {item.default ?? <span className="italic">{t('Sin texto en el tema')}</span>}
                                            </p>
                                            <div className="flex flex-wrap gap-1">
                                                {item.missing && !item.unused && (
                                                    <Badge
                                                        variant="outline"
                                                        title={t('El tema no trae este texto en :locale; se muestra en :fallback.', {
                                                            locale,
                                                            fallback,
                                                        })}
                                                    >
                                                        {t('Sin traducir')}
                                                    </Badge>
                                                )}
                                                {item.unused && <Badge variant="secondary">{t('No lo usa el tema')}</Badge>}
                                                {item.value !== null && <Badge>{t('Cambiado')}</Badge>}
                                            </div>
                                        </div>
                                        {long ? (
                                            <Textarea
                                                rows={3}
                                                value={value}
                                                placeholder={item.default ?? ''}
                                                onChange={(e) => setEdits({ ...edits, [item.key]: e.target.value })}
                                                aria-label={item.key}
                                            />
                                        ) : (
                                            <Input
                                                value={value}
                                                placeholder={item.default ?? ''}
                                                onChange={(e) => setEdits({ ...edits, [item.key]: e.target.value })}
                                                aria-label={item.key}
                                            />
                                        )}
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="justify-self-start"
                                            disabled={!item.id}
                                            onClick={() => reset(item)}
                                            title={t('Volver al texto del tema')}
                                        >
                                            <RotateCcw className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                ))}

                <p className="text-muted-foreground text-xs">
                    {t('Los valores como :price se reemplazan al mostrar la página: mantenlos en el texto.', { price: ':price' })}
                </p>
            </div>
        </ModuleLayout>
    );
}
