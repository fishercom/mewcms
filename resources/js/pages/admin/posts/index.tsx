import { useState, useEffect } from 'react';
import { router, Link, usePage } from '@inertiajs/react';
import ModuleLayout from '@/layouts/module/layout';
import { format } from 'date-fns';
import { CmsPost, CmsPostType } from '@/types/models/cms-post';
import { Pagination } from '@/types';
import { Button } from '@/components/ui/button';
import { Search, Plus, Edit, Trash2, Calendar } from 'lucide-react';
import { Input } from '@headlessui/react';
import { PaginationNav } from '@/components/ui/pagination-nav';

export default function Index() {
    const { items, cpt, post_type, lang_id } = usePage<{
        items: Pagination<CmsPost>;
        cpt: CmsPostType | null;
        post_type: string;
        lang_id: number;
    }>().props;

    const [filters, setFilters] = useState({
        s: '',
        status: '',
    });

    useEffect(() => {
        router.get(route('posts.index'), {
            post_type,
            lang_id,
            s: filters.s,
            status: filters.status
        }, {
            preserveState: true,
            replace: true,
        });
    }, [filters, post_type, lang_id]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters(prev => ({ ...prev, s: e.target.value }));
    };

    const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, status: e.target.value }));
    };

    const handleDelete = (id: number, title: string) => {
        if (window.confirm(`¿Estás seguro de que deseas eliminar "${title}"?`)) {
            router.delete(route('posts.destroy', id), {
                data: { post_type, lang_id },
                preserveScroll: true,
                onError: () => alert('Ocurrió un error al eliminar la entrada.')
            });
        }
    };

    const singularName = cpt ? cpt.singular_name : 'Entrada';
    const pluralName = cpt ? cpt.name : 'Entradas (Blog)';

    return (
        <ModuleLayout>
            <div className="relative overflow-hidden">
                <div className="flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0 md:space-x-4 pb-4">
                    <div className="w-full md:w-3/4 flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Search className="h-4 w-4 text-zinc-400" />
                            </div>
                            <Input
                                type="text"
                                autoFocus
                                value={filters.s}
                                onChange={handleSearch}
                                className="focus-within:outline-2 focus-within:outline-gray-400 border border-gray-300 dark:border-zinc-800 text-sm rounded-md block w-full pl-10 p-2 bg-transparent text-zinc-800 dark:text-zinc-200"
                                placeholder={`Buscar ${singularName.toLowerCase()}...`}
                            />
                        </div>

                        <select
                            value={filters.status}
                            onChange={handleStatusFilter}
                            className="h-10 px-3 rounded-md border border-gray-300 dark:border-zinc-800 bg-transparent text-sm text-zinc-800 dark:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
                        >
                            <option value="">Todos los estados</option>
                            <option value="draft">Borradores</option>
                            <option value="published">Publicados</option>
                        </select>
                    </div>

                    <div className="w-full md:w-auto flex justify-end">
                        <Button asChild className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white dark:bg-red-500 dark:hover:bg-red-600">
                            <Link href={`/admin/posts/create?post_type=${post_type}&lang_id=${lang_id}`}>
                                <Plus className="h-4 w-4" />
                                <span>Crear {singularName}</span>
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-sm text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-800 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-4 py-3 rounded-l-md">Título</th>
                                <th scope="col" className="px-4 py-3">Autor</th>
                                <th scope="col" className="px-4 py-3">Taxonomías / Términos</th>
                                <th scope="col" className="px-4 py-3 text-center">Estado</th>
                                <th scope="col" className="px-4 py-3 text-center">Fecha Publicación</th>
                                <th scope="col" className="px-4 py-3 rounded-r-md"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.data.length > 0 ? (
                                items.data.map((item: CmsPost) => (
                                    <tr key={item.id} className="border-b dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-800/20">
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-gray-900 dark:text-white">
                                                <Link href={`/admin/posts/${item.id}/edit?post_type=${post_type}&lang_id=${lang_id}`} className="hover:underline">
                                                    {item.title}
                                                </Link>
                                            </div>
                                            <div className="text-[11px] font-mono text-zinc-400">/{item.slug}</div>
                                        </td>
                                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                                            {item.user ? item.user.name : <span className="italic text-zinc-400 text-xs">Desconocido</span>}
                                        </td>
                                        <td className="px-4 py-3 max-w-xs">
                                            {item.terms && item.terms.length > 0 ? (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {item.terms.map((t) => (
                                                        <span key={t.id} className="inline-flex items-center text-[10px] bg-zinc-100 hover:bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 px-2 py-0.5 rounded">
                                                            {t.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="italic text-zinc-400 text-xs">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {item.status === 'published' ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
                                                    Publicado
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
                                                    Borrador
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center text-zinc-500 whitespace-nowrap">
                                            <div className="flex items-center justify-center gap-1 text-xs">
                                                <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                                                <span>{format(new Date(item.published_at), 'dd/MM/yyyy HH:mm')}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex items-center gap-1 h-8 px-2.5"
                                                    onClick={() => router.visit(`/admin/posts/${item.id}/edit?post_type=${post_type}&lang_id=${lang_id}`)}
                                                >
                                                    <Edit className="h-3.5 w-3.5" />
                                                    <span>Editar</span>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg"
                                                    onClick={() => handleDelete(item.id, item.title)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-zinc-400 italic">
                                        No se encontraron entradas de {pluralName.toLowerCase()}.
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
