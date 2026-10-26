import { deleteSchema } from '@/services/schemas';
import { router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

import { Icon } from '@/components/icon';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PaginationNav } from '@/components/ui/pagination-nav';
import ModuleLayout from '@/layouts/module/layout';
import { t } from '@/lib/i18n';
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
            <div className="relative">
                {errors?.error && (
                    <div className="border-destructive/30 bg-destructive-soft text-destructive mb-4 rounded-lg border p-3 text-sm">
                        {errors.error}
                    </div>
                )}
                <div className="flex flex-col items-center justify-between space-y-3 pb-4 md:flex-row md:space-y-0 md:space-x-4">
                    <div className="w-full md:w-3/4">
                        <form className="flex items-center space-y-3 md:space-y-0 md:space-x-4">
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
                            <label htmlFor="simple-search" className="sr-only">
                                {t('Group')}
                            </label>
                            <div className="border-border-strong block rounded-md border text-sm">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="p-3">
                                            {group_id && groups.length > 0 ? groups.filter((e) => e.id == group_id)[0].name : t('Group')}
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
                            className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5"
                        >
                            <Plus className="h-4 w-4" />
                            <span>{t('Agregar Campo Personalizado')}</span>
                        </Button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="text-muted-foreground w-full text-left text-sm">
                        <thead className="bg-table-header text-muted-foreground text-xs uppercase">
                            <tr>
                                <th scope="col" className="rounded-l-md px-4 py-3">
                                    {t('Nombre')}
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    {t('Plantilla')}
                                </th>
                                <th scope="col" className="px-4 py-3 text-center">
                                    {t('Campos')}
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    {t('Activo')}
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    {t('Actualizado')}
                                </th>
                                <th scope="col" className="rounded-r-md px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.data.map((item: CmsSchema) => {
                                return (
                                    <tr key={item.id} className="border-b">
                                        <th scope="row" className="text-foreground px-4 py-3 font-medium whitespace-nowrap">
                                            <a href={route('schemas.edit', item.id)} className="hover:underline">
                                                {item.name}
                                            </a>
                                        </th>
                                        <td className="px-4 py-3 font-mono text-xs">
                                            {item.front_view ? (
                                                `${item.front_view.split('/').pop()}.tsx`
                                            ) : (
                                                <span className="text-muted-foreground italic">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">{item.fields?.length ?? 0}</td>
                                        <td className="px-4 py-3">{item.active ? <Check /> : <></>}</td>
                                        <td className="px-4 py-3">{format(item.updated_at, 'dd/MM/yyyy HH:mm')}</td>
                                        <td className="flex items-center justify-end gap-2 px-4 py-3">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex h-8 items-center gap-1 px-2.5"
                                                onClick={() => router.visit(route('schemas.edit', item.id))}
                                            >
                                                <Edit className="h-3.5 w-3.5" />
                                                <span>{t('Editar')}</span>
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                disabled={item.articles_count !== undefined && item.articles_count > 0}
                                                className="text-destructive hover:bg-destructive/10 hover:text-destructive disabled:text-muted-foreground flex h-8 items-center gap-1 px-2.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                                                onClick={() => deleteSchemaHandler(item.id)}
                                                title={
                                                    item.articles_count !== undefined && item.articles_count > 0
                                                        ? t('No se puede eliminar porque está asignado a uno o más artículos')
                                                        : t('Eliminar campo personalizado')
                                                }
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
