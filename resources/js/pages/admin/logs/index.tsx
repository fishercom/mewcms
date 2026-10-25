import { getLogs } from '@/services/logs';
import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

import { PaginationNav } from '@/components/ui/pagination-nav';
import ModuleLayout from '@/layouts/module/layout';
import { AdmLog, Pagination } from '@/types';
import { Input } from '@headlessui/react';
import { format } from 'date-fns';
import { Search } from 'lucide-react';

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

    return (
        <ModuleLayout>
            <div className="relative">
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
                                    className="border-border-strong data-focus:border-ring data-focus:ring-ring/50 block w-full rounded-md border p-2 pl-10 text-sm outline-none data-focus:ring-[3px]"
                                    placeholder="Buscar"
                                />
                            </div>
                        </form>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="text-muted-foreground w-full text-left text-sm">
                        <thead className="bg-table-header text-muted-foreground text-xs uppercase">
                            <tr>
                                <th scope="col" className="rounded-l-md px-4 py-3">
                                    Usuario
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    Actividad
                                </th>
                                <th scope="col" className="rounded-r-md px-4 py-3">
                                    Fecha
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.data.map((item: AdmLog) => {
                                return (
                                    <tr key={item.id} className="border-b">
                                        <td className="px-4 py-3 whitespace-nowrap">{item.user?.name ?? 'Sistema'}</td>
                                        <th scope="row" className="text-foreground px-4 py-3 font-medium">
                                            {item.comment}
                                        </th>
                                        <td className="px-4 py-3 whitespace-nowrap">{format(item.created_at, 'dd/MM/yyyy HH:mm')}</td>
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
