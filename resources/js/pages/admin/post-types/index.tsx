import { useState, useEffect } from 'react';
import { router, Link, usePage } from '@inertiajs/react';
import ModuleLayout from '@/layouts/module/layout';
import { format } from 'date-fns';
import { CmsPostType } from '@/types/models/cms-post';
import { Pagination } from '@/types';
import { Button } from '@/components/ui/button';
import { Check, Search, Plus, Edit, Trash2, BookOpen } from 'lucide-react';
import { Input } from '@headlessui/react';
import { PaginationNav } from '@/components/ui/pagination-nav';
import * as LucideIcons from 'lucide-react';

export default function Index() {
    const { items } = usePage<{ items: Pagination<CmsPostType> }>().props;
    const [query, setQuery] = useState({ s: '' });

    useEffect(() => {
        if (query.s !== undefined) {
            router.get(route('post-types.index'), { s: query.s }, {
                preserveState: true,
                replace: true,
            });
        }
    }, [query]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery({ s: e.target.value });
    };

    const handleDelete = (id: number, name: string) => {
        if (window.confirm(`¿Estás seguro de que deseas eliminar el tipo de contenido "${name}"? Se eliminarán todas las entradas y módulos del menú asociados.`)) {
            router.delete(route('post-types.destroy', id), {
                preserveScroll: true,
                onError: () => alert('Ocurrió un error al eliminar el tipo de contenido.')
            });
        }
    };

    // Helper to render Lucide icon by name
    const renderIcon = (iconName: string) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const IconComponent = (LucideIcons as any)[iconName];
        if (IconComponent) {
            return <IconComponent className="h-4 w-4 text-zinc-500" />;
        }
        return <BookOpen className="h-4 w-4 text-zinc-500" />;
    };

    return (
        <ModuleLayout>
            <div className="relative overflow-hidden">
                <div className="flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0 md:space-x-4 pb-4">
                    <div className="w-full md:w-3/4">
                        <form className="flex items-center" onSubmit={(e) => e.preventDefault()}>
                            <div className="relative w-full">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <Search className="h-4 w-4 text-zinc-400" />
                                </div>
                                <Input
                                    type="text"
                                    autoFocus
                                    value={query.s ?? ''}
                                    onChange={handleSearch}
                                    className="focus-within:outline-2 focus-within:outline-gray-400 border border-gray-300 dark:border-zinc-800 text-sm rounded-md block w-full pl-10 p-2 bg-transparent text-zinc-800 dark:text-zinc-200"
                                    placeholder="Buscar tipo de contenido..."
                                />
                            </div>
                        </form>
                    </div>
                    <div className="w-full md:w-auto flex justify-end">
                        <Button asChild className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white dark:bg-red-500 dark:hover:bg-red-600">
                            <Link href="/admin/post-types/create">
                                <Plus className="h-4 w-4" />
                                <span>Nuevo Tipo de Contenido</span>
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-sm text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-800 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-4 py-3 rounded-l-md">Nombre</th>
                                <th scope="col" className="px-4 py-3">Slug (Prefijo URL)</th>
                                <th scope="col" className="px-4 py-3">Plantilla Predefinida</th>
                                <th scope="col" className="px-4 py-3">Descripción</th>
                                <th scope="col" className="px-4 py-3 text-center">Activo</th>
                                <th scope="col" className="px-4 py-3 text-center">Creado</th>
                                <th scope="col" className="px-4 py-3 rounded-r-md"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.data.length > 0 ? (
                                items.data.map((item: CmsPostType) => (
                                    <tr key={item.id} className="border-b dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-800/20">
                                        <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white flex items-center gap-2.5">
                                            {renderIcon(item.icon)}
                                            <span>{item.name}</span>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-red-600 dark:text-red-400">/{item.slug}</td>
                                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                                            {item.default_schema ? item.default_schema.name : <em className="text-xs text-zinc-400">Ninguna</em>}
                                        </td>
                                        <td className="px-4 py-3 max-w-xs truncate text-zinc-500">{item.description || '-'}</td>
                                        <td className="px-4 py-3 text-center">
                                            {item.active ? (
                                                <span className="inline-flex items-center justify-center p-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
                                                    <Check className="h-3.5 w-3.5" />
                                                </span>
                                            ) : (
                                                <span className="text-xs text-zinc-400">Inactivo</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center text-zinc-500">
                                            {item.created_at ? format(new Date(item.created_at), 'dd/MM/yyyy') : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex items-center gap-1 h-8 px-2.5"
                                                    onClick={() => router.visit(route('post-types.edit', item.id))}
                                                >
                                                    <Edit className="h-3.5 w-3.5" />
                                                    <span>Editar</span>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg"
                                                    onClick={() => handleDelete(item.id, item.name)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-zinc-400 italic">
                                        No se encontraron tipos de contenido.
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
