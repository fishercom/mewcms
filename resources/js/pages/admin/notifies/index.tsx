import { deleteNotify, getNotifies } from '@/services/notifies';
import { router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { PaginationNav } from '@/components/ui/pagination-nav';
import ModuleLayout from '@/layouts/module/layout';
import { t } from '@/lib/i18n';
import { Pagination } from '@/types';
import { CmsNotify } from '@/types/models/cms-notify';
import { Input } from '@headlessui/react';
import { format } from 'date-fns';
import { Check, Edit, Plus, Search, Trash2 } from 'lucide-react';

export default function Index() {
    const { items } = usePage<{ items: Pagination<CmsNotify> }>().props;
    const [query, setQuery] = useState({ s: '' });

    useEffect(() => {
        if (query.s) {
            getNotifies(query);
        }
    }, [query]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setQuery({ s: value });
    };

    const deleteNotifyHandler = (id: number) => {
        deleteNotify(id);
    };

    return (
        <ModuleLayout>
            <div className="relative">
                <div className="flex flex-col items-center justify-between space-y-3 pb-4 md:flex-row md:space-y-0 md:space-x-4">
                    <div className="w-full md:w-3/4">
                        <form className="flex items-center">
                            <label htmlFor="simple-search" className="sr-only">
                                {t('Search')}
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
                                    className="border-border-strong block w-full rounded-md border p-2 pl-10 text-sm"
                                    placeholder={t('Buscar')}
                                />
                            </div>
                        </form>
                    </div>
                    <div className="flex w-full flex-shrink-0 flex-col items-stretch justify-end space-y-2 md:w-auto md:flex-row md:items-center md:space-y-0 md:space-x-3">
                        <button
                            type="button"
                            className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors"
                            onClick={() => router.visit('/admin/notifies/create')}
                        >
                            <Plus className="h-4 w-4" />
                            {t('Agregar Cuenta')}
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="text-muted-foreground w-full text-left text-sm">
                        <thead className="bg-table-header text-muted-foreground text-xs uppercase">
                            <tr>
                                <th scope="col" className="rounded-l-md px-4 py-3">
                                    {t('Name')}
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    {t('Active')}
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    {t('Created Date')}
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    {t('Updated Date')}
                                </th>
                                <th scope="col" className="rounded-r-md px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.data.map((item: CmsNotify) => {
                                return (
                                    <tr key={item.id} className="border-b">
                                        <th scope="row" className="text-foreground px-4 py-3 font-medium whitespace-nowrap">
                                            {item.user_id}
                                        </th>
                                        <td className="px-4 py-3">{item.active ? <Check className="text-success h-4 w-4" /> : <></>}</td>
                                        <td className="px-4 py-3">{format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')}</td>
                                        <td className="px-4 py-3">{format(new Date(item.updated_at), 'dd/MM/yyyy HH:mm')}</td>
                                        <td className="flex items-center justify-end gap-2 px-4 py-3">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex h-8 items-center gap-1 px-2.5"
                                                onClick={() => router.visit(route('notifies.edit', item.id))}
                                            >
                                                <Edit className="h-3.5 w-3.5" />
                                                <span>{t('Editar')}</span>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:bg-destructive/10 hover:text-destructive flex h-8 items-center gap-1 px-2.5"
                                                onClick={() => deleteNotifyHandler(item.id)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                <span>{t('Eliminar')}</span>
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
