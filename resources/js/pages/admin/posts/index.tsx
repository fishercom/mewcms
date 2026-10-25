import {
    BulkActionsBar,
    RowCheckbox,
    ScheduledBadge,
    SelectAllCheckbox,
    TrashRowActions,
    TrashToggle,
    useRowSelection,
} from '@/components/content-bulk-actions';
import { Button } from '@/components/ui/button';
import { PaginationNav } from '@/components/ui/pagination-nav';
import ModuleLayout from '@/layouts/module/layout';
import { Pagination } from '@/types';
import { CmsPost, CmsPostType } from '@/types/models/cms-post';
import { Input } from '@headlessui/react';
import { Link, router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { Calendar, Edit, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Index() {
    const { items, cpt, post_type, lang_id, trash, trashCount } = usePage<{
        items: Pagination<CmsPost>;
        cpt: CmsPostType | null;
        post_type: string;
        lang_id: number;
        trash: boolean;
        trashCount: number;
    }>().props;

    const [filters, setFilters] = useState({
        s: '',
        status: '',
        trash,
    });
    const selection = useRowSelection(items.data.map((item) => item.id));

    useEffect(() => {
        router.get(
            route('posts.index'),
            {
                post_type,
                lang_id,
                s: filters.s,
                status: filters.status,
                trash: filters.trash ? 1 : undefined,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    }, [filters, post_type, lang_id]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters((prev) => ({ ...prev, s: e.target.value }));
    };

    const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilters((prev) => ({ ...prev, status: e.target.value }));
    };

    const handleTrashToggle = (showTrash: boolean) => {
        selection.clear();
        setFilters((prev) => ({ ...prev, trash: showTrash }));
    };

    const handleDelete = (id: number, title: string) => {
        if (window.confirm(`¿Mover "${title}" a la papelera?`)) {
            router.delete(route('posts.destroy', id), {
                data: { post_type, lang_id },
                preserveScroll: true,
                onError: () => alert('Ocurrió un error al mover la entrada a la papelera.'),
            });
        }
    };

    const singularName = cpt ? cpt.singular_name : 'Entrada';
    const pluralName = cpt ? cpt.name : 'Entradas (Blog)';

    return (
        <ModuleLayout>
            <div className="relative">
                <div className="flex flex-col items-center justify-between space-y-3 pb-4 md:flex-row md:space-y-0 md:space-x-4">
                    <div className="flex w-full flex-col gap-3 sm:flex-row md:w-3/4">
                        <div className="relative flex-1">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <Search className="h-4 w-4 text-zinc-400" />
                            </div>
                            <Input
                                type="text"
                                autoFocus
                                value={filters.s}
                                onChange={handleSearch}
                                className="block w-full rounded-md border border-gray-300 bg-transparent p-2 pl-10 text-sm text-zinc-800 dark:border-zinc-800 dark:text-zinc-200"
                                placeholder={`Buscar ${singularName.toLowerCase()}...`}
                            />
                        </div>

                        <select
                            value={filters.status}
                            onChange={handleStatusFilter}
                            className="h-10 rounded-md border border-gray-300 bg-transparent px-3 text-sm text-zinc-800 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:outline-none dark:border-zinc-800 dark:text-zinc-200"
                        >
                            <option value="">Todos los estados</option>
                            <option value="draft">Borradores</option>
                            <option value="published">Publicados</option>
                        </select>
                    </div>

                    <div className="flex w-full justify-end gap-2.5 md:w-auto">
                        <TrashToggle trash={filters.trash} count={trashCount} onChange={handleTrashToggle} />
                        <Button
                            asChild
                            className="flex items-center gap-1.5 bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                        >
                            <Link href={`/admin/posts/create?post_type=${post_type}&lang_id=${lang_id}`}>
                                <Plus className="h-4 w-4" />
                                <span>Crear {singularName}</span>
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="pb-4">
                    <BulkActionsBar routeName="posts.bulk" selected={selection.selected} trash={filters.trash} onClear={selection.clear} />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                        <thead className="bg-gray-100 text-sm text-xs text-gray-700 uppercase dark:bg-gray-800 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="w-10 rounded-l-md py-3 pl-4">
                                    <SelectAllCheckbox state={selection.allState} onToggle={selection.toggleAll} />
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    Título
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    Autor
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    Etiquetas
                                </th>
                                <th scope="col" className="px-4 py-3 text-center">
                                    Estado
                                </th>
                                <th scope="col" className="px-4 py-3 text-center">
                                    {filters.trash ? 'Eliminado' : 'Fecha Publicación'}
                                </th>
                                <th scope="col" className="rounded-r-md px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.data.length > 0 ? (
                                items.data.map((item: CmsPost) => (
                                    <tr key={item.id} className="border-b hover:bg-gray-50/50 dark:border-gray-700 dark:hover:bg-gray-800/20">
                                        <td className="py-3 pl-4">
                                            <RowCheckbox
                                                checked={selection.isSelected(item.id)}
                                                onToggle={() => selection.toggle(item.id)}
                                                label={item.title}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-gray-900 dark:text-white">
                                                <Link
                                                    href={`/admin/posts/${item.id}/edit?post_type=${post_type}&lang_id=${lang_id}`}
                                                    className="hover:underline"
                                                >
                                                    {item.title}
                                                </Link>
                                            </div>
                                            <div className="font-mono text-[11px] text-zinc-400">/{item.slug}</div>
                                        </td>
                                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                                            {item.user ? item.user.name : <span className="text-xs text-zinc-400 italic">Desconocido</span>}
                                        </td>
                                        <td className="max-w-xs px-4 py-3">
                                            {item.tags && item.tags.length > 0 ? (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {item.tags.map((t) => (
                                                        <span
                                                            key={t.id}
                                                            className="inline-flex items-center rounded bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                                                        >
                                                            {t.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-zinc-400 italic">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {item.is_scheduled ? (
                                                <ScheduledBadge date={item.published_at} />
                                            ) : item.status === 'published' ? (
                                                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
                                                    Publicado
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
                                                    Borrador
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center whitespace-nowrap text-zinc-500">
                                            <div className="flex items-center justify-center gap-1 text-xs">
                                                <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                                                <span>
                                                    {format(
                                                        new Date((filters.trash ? item.deleted_at : item.published_at) ?? item.created_at),
                                                        'dd/MM/yyyy HH:mm',
                                                    )}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {filters.trash ? (
                                                <TrashRowActions routeName="posts.bulk" id={item.id} />
                                            ) : (
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex h-8 items-center gap-1 px-2.5"
                                                        onClick={() =>
                                                            router.visit(`/admin/posts/${item.id}/edit?post_type=${post_type}&lang_id=${lang_id}`)
                                                        }
                                                    >
                                                        <Edit className="h-3.5 w-3.5" />
                                                        <span>Editar</span>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20"
                                                        onClick={() => handleDelete(item.id, item.title)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-zinc-400 italic">
                                        {filters.trash ? 'La papelera está vacía.' : `No se encontraron entradas de ${pluralName.toLowerCase()}.`}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {items.last_page > 1 && (
                    <div className="pt-4">
                        <PaginationNav data={items} />
                    </div>
                )}
            </div>
        </ModuleLayout>
    );
}
