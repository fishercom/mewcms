import { useState, useEffect } from 'react';
import { router, Link, usePage } from '@inertiajs/react';
import { getMenus, deleteMenu } from '@/services/menus';
import ModuleLayout from '@/layouts/module/layout';
import { format } from 'date-fns';
import { CmsMenu } from '@/types/models/cms-menu';
import { Pagination } from '@/types';
import { Button } from '@/components/ui/button';
import { Check, Search, Plus, List, Edit, Trash2 } from 'lucide-react';
import { Input } from '@headlessui/react';
import { PaginationNav } from '@/components/ui/pagination-nav';

export default function Index() {
    const { items } = usePage<{ items: Pagination<CmsMenu> }>().props;
    const [query, setQuery] = useState({ s: '' });

    useEffect(() => {
        if (query.s) {
            getMenus(query);
        }
    }, [query]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setQuery({ s: value });
    };

    const deleteMenuHandler = (id: number) => {
        deleteMenu(id);
    };

    return (
        <ModuleLayout>
            <div className="relative overflow-hidden">
                <div className="flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0 md:space-x-4 pb-4">
                    <div className="w-full md:w-3/4">
                        <form className="flex items-center">
                            <div className="relative w-full">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                                    <Search className="h-4 w-4 text-gray-400" />
                                </div>
                                <Input
                                    type="text"
                                    autoFocus
                                    value={query.s ?? ''}
                                    onChange={handleSearch}
                                    className="focus-within:outline-2 focus-within:outline-gray-400 border border-gray-500 text-sm rounded-md block w-full pl-10 p-2 bg-transparent text-gray-900 dark:text-white"
                                    placeholder="Buscar menú"
                                />
                            </div>
                        </form>
                    </div>
                    <div className="w-full md:w-auto flex flex-col md:flex-row space-y-2 md:space-y-0 items-stretch md:items-center justify-end md:space-x-3 flex-shrink-0">
                        <Link
                            href="/admin/menus/create"
                            className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white dark:bg-red-500 dark:hover:bg-red-600 font-medium text-sm px-4 py-2 rounded-md transition-colors gap-1.5"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Agregar Menú</span>
                        </Link>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-800 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-4 py-3 rounded-l-md">Nombre / Name</th>
                                <th scope="col" className="px-4 py-3">Slug</th>
                                <th scope="col" className="px-4 py-3">Descripción</th>
                                <th scope="col" className="px-4 py-3">Activo</th>
                                <th scope="col" className="px-4 py-3">Creado</th>
                                <th scope="col" className="px-4 py-3 rounded-r-md"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.data.map((item: CmsMenu) => {
                                return (
                                    <tr key={item.id} className="border-b dark:border-gray-700">
                                        <th scope="row" className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                            <Link href={`/admin/menus/${item.id}/edit`} className="text-primary-700 hover:underline flex items-center gap-1.5">
                                                <List className="h-4 w-4" />
                                                {item.name}
                                            </Link>
                                        </th>
                                        <td className="px-4 py-3">{item.slug}</td>
                                        <td className="px-4 py-3 max-w-xs truncate">{item.description}</td>
                                        <td className="px-4 py-3">{item.active ? <Check className="h-4 w-4 text-green-500" /> : <></>}</td>
                                        <td className="px-4 py-3">{format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')}</td>
                                        <td className="px-4 py-3 flex items-center justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex items-center gap-1 h-8 px-2.5"
                                                onClick={() => router.visit(`/admin/menus/${item.id}/edit`)}
                                            >
                                                <List className="h-3.5 w-3.5" />
                                                <span>Gestionar</span>
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex items-center gap-1 h-8 px-2.5"
                                                onClick={() => router.visit(route('menus.edit', item.id))}
                                            >
                                                <Edit className="h-3.5 w-3.5" />
                                                <span>Editar</span>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="flex items-center gap-1 h-8 px-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/20"
                                                onClick={() => deleteMenuHandler(item.id)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                <span>Eliminar</span>
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {items.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                        No se encontraron menús.
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
