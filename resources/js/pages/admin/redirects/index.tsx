import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PaginationNav } from '@/components/ui/pagination-nav';
import ModuleLayout from '@/layouts/module/layout';
import { t } from '@/lib/i18n';
import { Pagination } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { ArrowRight, Edit, ExternalLink, Plus, Search, Trash2 } from 'lucide-react';
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';

interface CmsRedirect {
    id: number;
    from_path: string;
    to_path: string;
    status_code: number;
    hits: number;
    last_hit_at: string | null;
}

interface Draft {
    from_path: string;
    to_path: string;
    status_code: number;
}

const emptyDraft: Draft = { from_path: '', to_path: '', status_code: 301 };

const selectClass = 'h-9 rounded-md border border-border bg-transparent px-2 text-sm text-foreground  ';

export default function Index() {
    const { items, filters } = usePage<{ items: Pagination<CmsRedirect>; filters: { s?: string } }>().props;
    const [search, setSearch] = useState(filters.s ?? '');
    const [draft, setDraft] = useState<Draft>(emptyDraft);
    const [editing, setEditing] = useState<(Draft & { id: number }) | null>(null);
    const [error, setError] = useState<string | null>(null);
    const firstRender = useRef(true);

    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }
        const timer = setTimeout(() => {
            router.get(route('redirects.index'), search ? { s: search } : {}, { preserveState: true, replace: true });
        }, 250);
        return () => clearTimeout(timer);
    }, [search]);

    const showErrors = (errors: Record<string, string>) => setError(Object.values(errors)[0] ?? t('Ocurrió un error.'));

    const create = (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        router.post(route('redirects.store'), { ...draft }, { preserveScroll: true, onSuccess: () => setDraft(emptyDraft), onError: showErrors });
    };

    const saveEdit = () => {
        if (!editing) return;
        setError(null);
        router.put(
            route('redirects.update', editing.id),
            { from_path: editing.from_path, to_path: editing.to_path, status_code: editing.status_code },
            { preserveScroll: true, onSuccess: () => setEditing(null), onError: showErrors },
        );
    };

    const handleEditKey = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveEdit();
        } else if (e.key === 'Escape') {
            setEditing(null);
        }
    };

    const destroy = (item: CmsRedirect) => {
        if (window.confirm(t('¿Eliminar la redirección de ":path"?', { path: item.from_path }))) {
            router.delete(route('redirects.destroy', item.id), { preserveScroll: true, onError: showErrors });
        }
    };

    return (
        <ModuleLayout>
            <div className="relative">
                <div className="flex flex-col items-center justify-between space-y-3 pb-4 md:flex-row md:space-y-0 md:space-x-4">
                    <div className="w-full md:w-3/4">
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <Search className="text-muted-foreground h-4 w-4" />
                            </div>
                            <Input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="border-border text-foreground block w-full rounded-md border bg-transparent p-2 pl-10 text-sm"
                                placeholder={t('Buscar dirección...')}
                            />
                        </div>
                    </div>
                </div>

                <form onSubmit={create} className="flex flex-col gap-2 pb-4 md:flex-row md:items-center">
                    <Input
                        value={draft.from_path}
                        onChange={(e) => setDraft({ ...draft, from_path: e.target.value })}
                        placeholder={t('Desde: /direccion-antigua')}
                        className="font-mono text-sm md:flex-1"
                        aria-label={t('Desde')}
                    />
                    <ArrowRight className="text-muted-foreground hidden h-4 w-4 shrink-0 md:block" />
                    <Input
                        value={draft.to_path}
                        onChange={(e) => setDraft({ ...draft, to_path: e.target.value })}
                        placeholder={t('Hacia: /direccion-nueva o https://...')}
                        className="font-mono text-sm md:flex-1"
                        aria-label={t('Hacia')}
                    />
                    <select
                        value={draft.status_code}
                        onChange={(e) => setDraft({ ...draft, status_code: Number(e.target.value) })}
                        className={selectClass}
                        aria-label={t('Tipo')}
                    >
                        <option value={301}>{t('301 Permanente')}</option>
                        <option value={302}>{t('302 Temporal')}</option>
                    </select>
                    <Button
                        type="submit"
                        disabled={!draft.from_path.trim() || !draft.to_path.trim()}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5"
                    >
                        <Plus className="h-4 w-4" />
                        <span>{t('Crear Redirección')}</span>
                    </Button>
                </form>

                {error && <p className="text-destructive pb-3 text-sm">{error}</p>}

                <div className="overflow-x-auto">
                    <table className="text-muted-foreground w-full text-left text-sm">
                        <thead className="bg-table-header text-muted-foreground text-xs uppercase">
                            <tr>
                                <th scope="col" className="rounded-l-md px-4 py-3">
                                    {t('Desde')}
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    {t('Hacia')}
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    {t('Tipo')}
                                </th>
                                <th scope="col" className="px-4 py-3 text-center">
                                    {t('Visitas')}
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    {t('Última visita')}
                                </th>
                                <th scope="col" className="rounded-r-md px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.data.length > 0 ? (
                                items.data.map((item) => {
                                    const isEditing = editing?.id === item.id;
                                    return (
                                        <tr key={item.id} className="hover:bg-muted/50 border-b">
                                            <td className="text-foreground px-4 py-3 font-mono text-xs">
                                                {isEditing ? (
                                                    <Input
                                                        autoFocus
                                                        value={editing.from_path}
                                                        onChange={(e) => setEditing({ ...editing, from_path: e.target.value })}
                                                        onKeyDown={handleEditKey}
                                                        className="h-8 font-mono text-xs"
                                                        aria-label={t('Desde')}
                                                    />
                                                ) : (
                                                    item.from_path
                                                )}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs">
                                                {isEditing ? (
                                                    <Input
                                                        value={editing.to_path}
                                                        onChange={(e) => setEditing({ ...editing, to_path: e.target.value })}
                                                        onKeyDown={handleEditKey}
                                                        className="h-8 font-mono text-xs"
                                                        aria-label={t('Hacia')}
                                                    />
                                                ) : (
                                                    <a
                                                        href={item.to_path}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1 hover:underline"
                                                    >
                                                        {item.to_path}
                                                        <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {isEditing ? (
                                                    <select
                                                        value={editing.status_code}
                                                        onChange={(e) => setEditing({ ...editing, status_code: Number(e.target.value) })}
                                                        className={selectClass}
                                                        aria-label={t('Tipo')}
                                                    >
                                                        <option value={301}>301</option>
                                                        <option value={302}>302</option>
                                                    </select>
                                                ) : (
                                                    item.status_code
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">{item.hits}</td>
                                            <td className="px-4 py-3">
                                                {item.last_hit_at ? format(new Date(item.last_hit_at), 'dd/MM/yyyy HH:mm') : '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    {isEditing ? (
                                                        <>
                                                            <Button size="sm" className="h-8" onClick={saveEdit}>
                                                                {t('Guardar')}
                                                            </Button>
                                                            <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditing(null)}>
                                                                {t('Cancelar')}
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="flex h-8 items-center gap-1 px-2.5"
                                                                onClick={() =>
                                                                    setEditing({
                                                                        id: item.id,
                                                                        from_path: item.from_path,
                                                                        to_path: item.to_path,
                                                                        status_code: item.status_code,
                                                                    })
                                                                }
                                                            >
                                                                <Edit className="h-3.5 w-3.5" />
                                                                <span>{t('Editar')}</span>
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-destructive hover:bg-destructive/10 hover:text-destructive flex h-8 items-center gap-1 px-2.5"
                                                                onClick={() => destroy(item)}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                                <span>{t('Eliminar')}</span>
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6} className="text-muted-foreground px-4 py-8 text-center italic">
                                        {search
                                            ? t('No hay redirecciones que coincidan con ":search".', { search })
                                            : t('Aún no hay redirecciones. Se crean solas cuando cambias la dirección de una página.')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {items.links && <PaginationNav data={items} />}
            </div>
        </ModuleLayout>
    );
}
