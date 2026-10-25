import {
    BulkActionsBar,
    RowCheckbox,
    ScheduledBadge,
    SelectAllCheckbox,
    TrashRowActions,
    TrashToggle,
    useRowSelection,
} from '@/components/content-bulk-actions';
import { StatusBadge } from '@/components/status-badge';
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
                <div className="flex flex-wrap items-center gap-3 pb-4">
                    <div className="flex min-w-0 flex-[1_1_28rem] flex-wrap items-center gap-2">
                        <div className="relative min-w-[14rem] flex-[1_1_16rem]">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <Search className="text-muted-foreground h-4 w-4" />
                            </div>
                            <Input
                                type="text"
                                autoFocus
                                value={filters.s}
                                onChange={handleSearch}
                                className="border-border text-foreground block w-full rounded-md border bg-transparent p-2 pl-10 text-sm"
                                placeholder={`Buscar ${singularName.toLowerCase()}...`}
                            />
                        </div>

                        <select
                            value={filters.status}
                            onChange={handleStatusFilter}
                            className="border-border text-foreground focus-visible:ring-ring h-10 rounded-md border bg-transparent px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
                        >
                            <option value="">Todos los estados</option>
                            <option value="draft">Borradores</option>
                            <option value="published">Publicados</option>
                        </select>
                    </div>

                    <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
                        <TrashToggle trash={filters.trash} count={trashCount} onChange={handleTrashToggle} />
                        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5">
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
                    <table className="text-muted-foreground w-full text-left text-sm">
                        <thead className="bg-table-header text-muted-foreground text-xs uppercase">
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
                                    <tr key={item.id} className="hover:bg-muted/50 border-b">
                                        <td className="py-3 pl-4">
                                            <RowCheckbox
                                                checked={selection.isSelected(item.id)}
                                                onToggle={() => selection.toggle(item.id)}
                                                label={item.title}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-foreground font-semibold">
                                                <Link
                                                    href={`/admin/posts/${item.id}/edit?post_type=${post_type}&lang_id=${lang_id}`}
                                                    className="hover:underline"
                                                >
                                                    {item.title}
                                                </Link>
                                            </div>
                                            <div className="text-muted-foreground font-mono text-[11px]">/{item.slug}</div>
                                        </td>
                                        <td className="text-muted-foreground px-4 py-3">
                                            {item.user ? item.user.name : <span className="text-muted-foreground text-xs italic">Desconocido</span>}
                                        </td>
                                        <td className="max-w-xs px-4 py-3">
                                            {item.tags && item.tags.length > 0 ? (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {item.tags.map((t) => (
                                                        <span
                                                            key={t.id}
                                                            className="bg-muted text-foreground hover:bg-muted inline-flex items-center rounded px-2 py-0.5 text-[10px]"
                                                        >
                                                            {t.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-xs italic">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {item.is_scheduled ? (
                                                <ScheduledBadge date={item.published_at} />
                                            ) : (
                                                <StatusBadge status={item.status === 'published' ? 'published' : 'draft'} />
                                            )}
                                        </td>
                                        <td className="text-muted-foreground px-4 py-3 text-center whitespace-nowrap">
                                            <div className="flex items-center justify-center gap-1 text-xs">
                                                <Calendar className="text-muted-foreground h-3.5 w-3.5" />
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
                                                        size="sm"
                                                        className="text-destructive hover:bg-destructive/10 hover:text-destructive flex h-8 items-center gap-1 px-2.5"
                                                        onClick={() => handleDelete(item.id, item.title)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        <span>Eliminar</span>
                                                    </Button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="text-muted-foreground px-4 py-8 text-center italic">
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
