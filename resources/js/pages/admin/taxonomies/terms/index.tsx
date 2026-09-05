import { deleteTerm, getTerms } from '@/services/taxonomies';
import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { PaginationNav } from '@/components/ui/pagination-nav';
import ModuleLayout from '@/layouts/module/layout';
import { Pagination } from '@/types';
import { CmsTaxonomy, CmsTaxonomyTerm } from '@/types/models/cms-taxonomy';
import { Input } from '@headlessui/react';
import { format } from 'date-fns';
import { ArrowLeft, Check, Edit, Plus, Search, Trash2 } from 'lucide-react';

export default function Index() {
    const { items, taxonomy } = usePage<{ items: Pagination<CmsTaxonomyTerm>; taxonomy: CmsTaxonomy }>().props;
    const [query, setQuery] = useState({ s: '' });

    useEffect(() => {
        if (query.s) {
            getTerms(taxonomy.id, query);
        }
    }, [query, taxonomy.id]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setQuery({ s: value });
    };

    const deleteTermHandler = (id: number) => {
        deleteTerm(id);
    };

    return (
        <ModuleLayout view={`Términos de ${taxonomy.name}`}>
            <div className="relative overflow-hidden">
                <div className="flex flex-col items-center justify-between space-y-3 pb-4 md:flex-row md:space-y-0 md:space-x-4">
                    <div className="flex w-full items-center space-x-3 md:w-3/4">
                        <Link href="/admin/taxonomies" className="flex items-center text-sm text-gray-500 hover:text-gray-700">
                            <ArrowLeft className="mr-1 h-4 w-4" />
                            Volver
                        </Link>
                        <form className="flex-1">
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
                                    placeholder="Buscar término"
                                />
                            </div>
                        </form>
                    </div>
                    <div className="flex w-full justify-end md:w-auto">
                        <Button
                            asChild
                            className="flex items-center gap-1.5 bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                        >
                            <Link href={`/admin/taxonomies/${taxonomy.id}/terms/create`}>
                                <Plus className="h-4 w-4" />
                                <span>Agregar Término</span>
                            </Link>
                        </Button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                        <thead className="bg-gray-100 text-sm text-xs text-gray-700 uppercase dark:bg-gray-800 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="rounded-l-md px-4 py-3">
                                    Nombre / Name
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    Slug
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    Padre / Parent
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
                            {items.data.map((item: CmsTaxonomyTerm) => {
                                return (
                                    <tr key={item.id} className="border-b dark:border-gray-700">
                                        <th scope="row" className="px-4 py-3 font-medium whitespace-nowrap text-gray-900 dark:text-white">
                                            <span style={{ paddingLeft: item.parent_id ? '1.5rem' : '0' }} className="flex items-center">
                                                {item.parent_id && <span className="mr-1 text-gray-400">—</span>}
                                                {item.name}
                                            </span>
                                        </th>
                                        <td className="px-4 py-3">{item.slug}</td>
                                        <td className="px-4 py-3 text-gray-400">
                                            {item.parent ? item.parent.name : <span className="text-gray-300">Ninguno</span>}
                                        </td>
                                        <td className="max-w-xs truncate px-4 py-3">{item.description}</td>
                                        <td className="px-4 py-3">{item.active ? <Check /> : <></>}</td>
                                        <td className="px-4 py-3">{format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')}</td>
                                        <td className="flex items-center justify-end gap-2 px-4 py-3">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex h-8 items-center gap-1 px-2.5"
                                                onClick={() => router.visit(`/admin/terms/${item.id}/edit`)}
                                            >
                                                <Edit className="h-3.5 w-3.5" />
                                                <span>Editar</span>
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="flex h-8 items-center gap-1 px-2.5 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/20 dark:hover:text-red-300"
                                                onClick={() => deleteTermHandler(item.id)}
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
                                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                        No se encontraron términos.
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
