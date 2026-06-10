import { useState, useEffect } from 'react';
import { router, Link, usePage } from '@inertiajs/react';
import { getMenus, deleteMenu } from '@/services/menus';
import ModuleLayout from '@/layouts/module/layout';
import { format } from 'date-fns';
import { CmsMenu } from '@/types/models/cms-menu';
import { Pagination } from '@/types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, Check, Search, Plus, List } from 'lucide-react';
import { Icon } from '@/components/icon';
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
                            className="flex items-center justify-center bg-primary-700 text-white font-medium text-sm px-4 py-2 rounded-md hover:bg-primary-800 transition-colors gap-1.5"
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
                                        <td className="px-4 py-3 flex items-center justify-end">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="p-3">
                                                        Acciones
                                                        <Icon iconNode={ChevronDown} className="h-5 w-5" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="w-56" align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Button
                                                            className="block w-full text-left"
                                                            onClick={() => router.visit(`/admin/menus/${item.id}/edit`)}
                                                            variant="ghost"
                                                        >
                                                            Gestionar Ítems / Manage Items
                                                        </Button>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Button
                                                            className="block w-full text-left"
                                                            onClick={() => router.visit(route('menus.edit', item.id))}
                                                            variant="ghost"
                                                        >
                                                            Editar / Edit
                                                        </Button>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Button
                                                            className="block w-full text-left text-red-600 hover:text-red-800"
                                                            onClick={() => deleteMenuHandler(item.id)}
                                                            variant="ghost"
                                                        >
                                                            Eliminar / Delete
                                                        </Button>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
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
