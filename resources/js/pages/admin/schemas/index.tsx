import { deleteSchema } from '@/services/schemas';
import { router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

import { Icon } from '@/components/icon';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PaginationNav } from '@/components/ui/pagination-nav';
import ModuleLayout from '@/layouts/module/layout';
import { Pagination } from '@/types';
import { CmsSchema } from '@/types/models/cms-schema';
import { CmsSchemaGroup } from '@/types/models/cms-schema-group';
import { Input } from '@headlessui/react';
import { format } from 'date-fns';
import { Check, ChevronDown, Edit, Plus, Search, Trash2 } from 'lucide-react';

export default function Index() {
    const { items, groups, group_id, errors } = usePage<{
        items: Pagination<CmsSchema>;
        groups: CmsSchemaGroup[];
        group_id: number;
        errors: Record<string, string>;
    }>().props;
    const [query, setQuery] = useState({ s: '' });

    useEffect(() => {
        if (query.s) {
            router.get(route('schemas.index'), query, {
                preserveState: true,
                replace: true,
            });
        }
    }, [query]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setQuery({ s: value });
    };

    const deleteSchemaHandler = (id: number) => {
        deleteSchema(id);
    };

    return (
        <ModuleLayout>
            <div className="relative overflow-hidden">
                {errors?.error && (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
                        {errors.error}
                    </div>
                )}
                <div className="flex flex-col items-center justify-between space-y-3 pb-4 md:flex-row md:space-y-0 md:space-x-4">
                    <div className="w-full md:w-3/4">
                        <form className="flex items-center space-y-3 md:space-y-0 md:space-x-4">
                            <label htmlFor="simple-search" className="sr-only">
                                Search
                            </label>
                            <div className="relative w-full">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
                                    <Search />
                                </div>
                                <Input
                                    type="text"
                                    autoFocus
                                    value={query.s ?? ''}
                                    onChange={handleSearch}
                                    className="block w-full rounded-md border border-gray-500 p-2 pl-10 text-sm focus-within:outline-2 focus-within:outline-gray-400"
                                    placeholder="Buscar"
                                />
                            </div>
                            <label htmlFor="simple-search" className="sr-only">
                                Group
                            </label>
                            <div className="block rounded-md border border-gray-500 text-sm focus-within:outline-2 focus-within:outline-gray-400">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="p-3">
                                            {group_id && groups.length > 0 ? groups.filter((e) => e.id == group_id)[0].name : 'Group'}
                                            <Icon iconNode={ChevronDown} className="h-5 w-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56" align="end">
                                        {groups.map((e) => (
                                            <DropdownMenuItem key={e.id} asChild>
                                                <Button
                                                    className="block w-full"
                                                    onClick={() => router.visit(route('schemas.index', { group_id: e.id }))}
                                                    variant="ghost"
                                                >
                                                    {e.name}
                                                </Button>
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </form>
                    </div>
                    <div className="flex w-full justify-end md:w-auto">
                        <Button
                            onClick={() => router.visit(route('schemas.create', { group_id: group_id }))}
                            className="flex items-center gap-1.5 bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Agregar Campo Personalizado</span>
                        </Button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                        <thead className="bg-gray-100 text-sm text-xs text-gray-700 uppercase dark:bg-gray-800 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="rounded-l-md px-4 py-3">
                                    Name
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    Active
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    Created Date
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    Updated Date
                                </th>
                                <th scope="col" className="rounded-r-md px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.data.map((item: CmsSchema) => {
                                return (
                                    <tr key={item.id} className="border-b dark:border-gray-700">
                                        <th scope="row" className="px-4 py-3 font-medium whitespace-nowrap text-gray-900 dark:text-white">
                                            <a href={route('schemas.edit', item.id)} className="hover:underline">
                                                {item.name}
                                            </a>
                                        </th>
                                        <td className="px-4 py-3">{item.active ? <Check /> : <></>}</td>
                                        <td className="px-4 py-3">{format(item.created_at, 'dd/MM/yyyy HH:mm')}</td>
                                        <td className="px-4 py-3">{format(item.updated_at, 'dd/MM/yyyy HH:mm')}</td>
                                        <td className="flex items-center justify-end gap-2 px-4 py-3">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex h-8 items-center gap-1 px-2.5"
                                                onClick={() => router.visit(route('schemas.edit', item.id))}
                                            >
                                                <Edit className="h-3.5 w-3.5" />
                                                <span>Editar</span>
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                disabled={item.articles_count !== undefined && item.articles_count > 0}
                                                className="flex h-8 items-center gap-1 px-2.5 text-red-600 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:text-gray-400 disabled:opacity-40 disabled:hover:bg-transparent dark:text-red-400 dark:hover:bg-red-950/20 dark:hover:text-red-300 dark:disabled:text-gray-600"
                                                onClick={() => deleteSchemaHandler(item.id)}
                                                title={
                                                    item.articles_count !== undefined && item.articles_count > 0
                                                        ? 'No se puede eliminar porque está asignado a uno o más artículos'
                                                        : 'Eliminar campo personalizado'
                                                }
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                <span>Eliminar</span>
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {items.links && <PaginationNav data={items} />}
            </div>
        </ModuleLayout>
    );
}
