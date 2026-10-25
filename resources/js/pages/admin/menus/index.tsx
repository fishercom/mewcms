import { Button } from '@/components/ui/button';
import { PaginationNav } from '@/components/ui/pagination-nav';
import ModuleLayout from '@/layouts/module/layout';
import { deleteMenu, getMenus } from '@/services/menus';
import { Pagination } from '@/types';
import { CmsMenu } from '@/types/models/cms-menu';
import { Input } from '@headlessui/react';
import { Link, router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { Check, Edit, List, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

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
            <div className="relative">
                <div className="flex flex-col items-center justify-between space-y-3 pb-4 md:flex-row md:space-y-0 md:space-x-4">
                    <div className="w-full md:w-3/4">
                        <form className="flex items-center">
                            <div className="relative w-full">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
                                    <Search className="text-muted-foreground h-4 w-4" />
                                </div>
                                <Input
                                    type="text"
                                    autoFocus
                                    value={query.s ?? ''}
                                    onChange={handleSearch}
                                    className="border-border-strong text-foreground block w-full rounded-md border bg-transparent p-2 pl-10 text-sm"
                                    placeholder="Buscar menú"
                                />
                            </div>
                        </form>
                    </div>
                    <div className="flex w-full flex-shrink-0 flex-col items-stretch justify-end space-y-2 md:w-auto md:flex-row md:items-center md:space-y-0 md:space-x-3">
                        <Link
                            href="/admin/menus/create"
                            className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Agregar Menú</span>
                        </Link>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="text-muted-foreground w-full text-left text-sm">
                        <thead className="bg-table-header text-muted-foreground text-xs uppercase">
                            <tr>
                                <th scope="col" className="rounded-l-md px-4 py-3">
                                    Nombre / Name
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    Slug
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    Descripción
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    Activo
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    Creado
                                </th>
                                <th scope="col" className="rounded-r-md px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.data.map((item: CmsMenu) => {
                                return (
                                    <tr key={item.id} className="border-b">
                                        <th scope="row" className="text-foreground px-4 py-3 font-medium whitespace-nowrap">
                                            <Link
                                                href={`/admin/menus/${item.id}/edit`}
                                                className="text-primary-700 flex items-center gap-1.5 hover:underline"
                                            >
                                                <List className="h-4 w-4" />
                                                {item.name}
                                            </Link>
                                        </th>
                                        <td className="px-4 py-3">{item.slug}</td>
                                        <td className="max-w-xs truncate px-4 py-3">{item.description}</td>
                                        <td className="px-4 py-3">{item.active ? <Check className="text-success h-4 w-4" /> : <></>}</td>
                                        <td className="px-4 py-3">{format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')}</td>
                                        <td className="flex items-center justify-end gap-2 px-4 py-3">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex h-8 items-center gap-1 px-2.5"
                                                onClick={() => router.visit(`/admin/menus/${item.id}/edit`)}
                                            >
                                                <List className="h-3.5 w-3.5" />
                                                <span>Gestionar</span>
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex h-8 items-center gap-1 px-2.5"
                                                onClick={() => router.visit(route('menus.edit', item.id))}
                                            >
                                                <Edit className="h-3.5 w-3.5" />
                                                <span>Editar</span>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:bg-destructive/10 hover:text-destructive flex h-8 items-center gap-1 px-2.5"
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
                                    <td colSpan={6} className="text-muted-foreground px-4 py-8 text-center">
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
