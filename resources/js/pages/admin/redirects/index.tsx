import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PaginationNav } from '@/components/ui/pagination-nav';
import ModuleLayout from '@/layouts/module/layout';
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

const selectClass = 'h-9 rounded-md border border-gray-300 bg-transparent px-2 text-sm text-zinc-800 dark:border-zinc-800 dark:text-zinc-200';

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

    const showErrors = (errors: Record<string, string>) => setError(Object.values(errors)[0] ?? 'Ocurrió un error.');

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
        if (window.confirm(`¿Eliminar la redirección de "${item.from_path}"?`)) {
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
                                <Search className="h-4 w-4 text-zinc-400" />
                            </div>
                            <Input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="block w-full rounded-md border border-gray-300 bg-transparent p-2 pl-10 text-sm text-zinc-800 dark:border-zinc-800 dark:text-zinc-200"
                                placeholder="Buscar dirección..."
                            />
                        </div>
                    </div>
                </div>

                <form onSubmit={create} className="flex flex-col gap-2 pb-4 md:flex-row md:items-center">
                    <Input
                        value={draft.from_path}
                        onChange={(e) => setDraft({ ...draft, from_path: e.target.value })}
                        placeholder="Desde: /direccion-antigua"
                        className="font-mono text-sm md:flex-1"
                        aria-label="Desde"
                    />
                    <ArrowRight className="hidden h-4 w-4 shrink-0 text-zinc-400 md:block" />
                    <Input
                        value={draft.to_path}
                        onChange={(e) => setDraft({ ...draft, to_path: e.target.value })}
                        placeholder="Hacia: /direccion-nueva o https://..."
                        className="font-mono text-sm md:flex-1"
                        aria-label="Hacia"
                    />
                    <select
                        value={draft.status_code}
                        onChange={(e) => setDraft({ ...draft, status_code: Number(e.target.value) })}
                        className={selectClass}
                        aria-label="Tipo"
                    >
                        <option value={301}>301 Permanente</option>
                        <option value={302}>302 Temporal</option>
                    </select>
                    <Button
                        type="submit"
                        disabled={!draft.from_path.trim() || !draft.to_path.trim()}
                        className="flex items-center gap-1.5 bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Crear Redirección</span>
                    </Button>
                </form>

                {error && <p className="text-destructive pb-3 text-sm">{error}</p>}

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                        <thead className="bg-gray-100 text-xs text-gray-700 uppercase dark:bg-gray-800 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="rounded-l-md px-4 py-3">
                                    Desde
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    Hacia
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    Tipo
                                </th>
                                <th scope="col" className="px-4 py-3 text-center">
                                    Visitas
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    Última visita
                                </th>
                                <th scope="col" className="rounded-r-md px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.data.length > 0 ? (
                                items.data.map((item) => {
                                    const isEditing = editing?.id === item.id;
                                    return (
                                        <tr key={item.id} className="border-b hover:bg-gray-50/50 dark:border-gray-700 dark:hover:bg-gray-800/20">
                                            <td className="px-4 py-3 font-mono text-xs text-gray-900 dark:text-white">
                                                {isEditing ? (
                                                    <Input
                                                        autoFocus
                                                        value={editing.from_path}
                                                        onChange={(e) => setEditing({ ...editing, from_path: e.target.value })}
                                                        onKeyDown={handleEditKey}
                                                        className="h-8 font-mono text-xs"
                                                        aria-label="Desde"
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
                                                        aria-label="Hacia"
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
                                                        aria-label="Tipo"
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
                                                                Guardar
                                                            </Button>
                                                            <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditing(null)}>
                                                                Cancelar
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
                                                                <span>Editar</span>
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="flex h-8 items-center gap-1 px-2.5 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/20 dark:hover:text-red-300"
                                                                onClick={() => destroy(item)}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                                <span>Eliminar</span>
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
                                    <td colSpan={6} className="px-4 py-8 text-center text-zinc-400 italic">
                                        {search
                                            ? `No hay redirecciones que coincidan con "${search}".`
                                            : 'Aún no hay redirecciones. Se crean solas cuando cambias la dirección de una página.'}
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
