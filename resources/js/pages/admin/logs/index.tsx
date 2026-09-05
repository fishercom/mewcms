import { deleteLog, getLogs } from '@/services/logs';
import { router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

import { Icon } from '@/components/icon';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PaginationNav } from '@/components/ui/pagination-nav';
import ModuleLayout from '@/layouts/module/layout';
import { AdmLog, Pagination } from '@/types';
import { Input } from '@headlessui/react';
import { format } from 'date-fns';
import { ChevronDown, Search } from 'lucide-react';

export default function Index() {
    const { items } = usePage<{ items: Pagination<AdmLog> }>().props;
    const [query, setQuery] = useState({ s: '' });

    useEffect(() => {
        if (query.s) {
            getLogs(query);
        }
    }, [query]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setQuery({ s: value });
    };

    const deleteLogHandler = (id: number) => {
        deleteLog(id);
    };

    return (
        <ModuleLayout>
            <div className="relative overflow-hidden">
                <div className="flex flex-col items-center justify-between space-y-3 pb-4 md:flex-row md:space-y-0 md:space-x-4">
                    <div className="w-full">
                        <form className="flex items-center">
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
                        </form>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                        <thead className="bg-gray-100 text-sm text-xs text-gray-700 uppercase dark:bg-gray-800 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="rounded-l-md px-4 py-3">
                                    Comment
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
                            {items.data.map((item: AdmLog) => {
                                return (
                                    <tr key={item.id} className="border-b dark:border-gray-700">
                                        <th scope="row" className="px-4 py-3 font-medium whitespace-nowrap text-gray-900 dark:text-white">
                                            {item.comment}
                                        </th>
                                        <td className="px-4 py-3">{format(item.created_at, 'dd/MM/yyyy HH:mm')}</td>
                                        <td className="px-4 py-3">{format(item.updated_at, 'dd/MM/yyyy HH:mm')}</td>
                                        <td className="flex items-center justify-end px-4 py-3">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="p-3">
                                                        Actions
                                                        <Icon iconNode={ChevronDown} className="h-5 w-5" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="w-56" align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Button
                                                            className="block w-full"
                                                            onClick={() => router.visit(route('logs.edit', item.id))}
                                                            variant="ghost"
                                                        >
                                                            Edit
                                                        </Button>
                                                    </DropdownMenuItem>{' '}
                                                    <DropdownMenuItem asChild>
                                                        <Button className="block w-full" onClick={() => deleteLogHandler(item.id)} variant="ghost">
                                                            Delete
                                                        </Button>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
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
