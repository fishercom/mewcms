import { Button } from '@/components/ui/button';
import { PaginationNav } from '@/components/ui/pagination-nav';
import ModuleLayout from '@/layouts/module/layout';
import { deleteTranslate, getTranslates } from '@/services/translates';
import { Pagination } from '@/types';
import { CmsTranslate } from '@/types/models/cms-translate';
import { Input } from '@headlessui/react';
import { router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { Edit, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Index() {
    const { items } = usePage<{ items: Pagination<CmsTranslate> }>().props;
    const [query, setQuery] = useState({ s: '' });

    useEffect(() => {
        if (query.s) {
            getTranslates(query);
        }
    }, [query]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setQuery({ s: value });
    };

    const deleteTranslateHandler = (id: number) => {
        deleteTranslate(id);
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
                                    className="border-border-strong block w-full rounded-md border p-2 pl-10 text-sm"
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
                                    Alias
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    Values
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
                            {items.data.map((item: CmsTranslate) => {
                                return (
                                    <tr key={item.id} className="border-b">
                                        <th scope="row" className="text-foreground px-4 py-3 font-medium whitespace-nowrap">
                                            {item.alias}
                                        </th>
                                        <td className="px-4 py-3">{item.metadata}</td>
                                        <td className="px-4 py-3">{format(item.created_at, 'dd/MM/yyyy HH:mm')}</td>
                                        <td className="px-4 py-3">{format(item.updated_at, 'dd/MM/yyyy HH:mm')}</td>
                                        <td className="flex items-center justify-end gap-2 px-4 py-3">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex h-8 items-center gap-1 px-2.5"
                                                onClick={() => router.visit(route('translates.edit', item.id))}
                                            >
                                                <Edit className="h-3.5 w-3.5" />
                                                <span>Editar</span>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:bg-destructive/10 hover:text-destructive flex h-8 items-center gap-1 px-2.5"
                                                onClick={() => deleteTranslateHandler(item.id)}
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
