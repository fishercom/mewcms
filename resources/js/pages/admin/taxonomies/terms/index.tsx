import { useState, useEffect } from 'react';
import { router, Link, usePage } from '@inertiajs/react';
import { getTerms, deleteTerm } from '@/services/taxonomies';

import ModuleLayout from '@/layouts/module/layout';
import { format } from 'date-fns'
import { CmsTaxonomy, CmsTaxonomyTerm } from '@/types/models/cms-taxonomy';
import { Pagination } from '@/types';
import { Button } from '@/components/ui/button';
import { Check, Search, Plus, ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { Input } from '@headlessui/react';
import { PaginationNav } from '@/components/ui/pagination-nav';

export default function Index() {
    const { items, taxonomy } = usePage<{ items: Pagination<CmsTaxonomyTerm>, taxonomy: CmsTaxonomy }>().props;
    const [ query, setQuery ] = useState({s: ''});

    useEffect(() => {
        if(query.s){
            getTerms(taxonomy.id, query);
        }
    }, [query, taxonomy.id]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>)=>{
        const {value} = e.target;
        setQuery({s: value});
    }

    const deleteTermHandler = (id: number) => {
        deleteTerm(id);
    }

    return (
        <ModuleLayout view={`Términos de ${taxonomy.name}`}>
            <div className="relative overflow-hidden">
                <div className="flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0 md:space-x-4 pb-4">
                    <div className="w-full md:w-3/4 flex items-center space-x-3">
                        <Link href="/admin/taxonomies" className="flex items-center text-sm text-gray-500 hover:text-gray-700">
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Volver
                        </Link>
                        <form className="flex-1">
                            <div className="relative w-full">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                                    <Search/>
                                </div>
                                <Input type='text' autoFocus value={query.s??''} onChange={handleSearch} className="focus-within:outline-2 focus-within:outline-gray-400 border border-gray-500 text-sm rounded-md block w-full pl-10 p-2" placeholder="Buscar término" />
                            </div>
                        </form>
                    </div>
                    <div className="w-full md:w-auto flex justify-end">
                        <Button asChild className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white dark:bg-red-500 dark:hover:bg-red-600">
                            <Link href={`/admin/taxonomies/${taxonomy.id}/terms/create`}>
                                <Plus className="h-4 w-4" />
                                <span>Agregar Término</span>
                            </Link>
                        </Button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-sm text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-800 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-4 py-3 rounded-l-md">Nombre / Name</th>
                                <th scope="col" className="px-4 py-3">Slug</th>
                                <th scope="col" className="px-4 py-3">Padre / Parent</th>
                                <th scope="col" className="px-4 py-3">Descripción</th>
                                <th scope="col" className="px-4 py-3">Activo</th>
                                <th scope="col" className="px-4 py-3">Creado</th>
                                <th scope="col" className="px-4 py-3 rounded-r-md"></th>
                            </tr>
                        </thead>
                        <tbody>
                        {items.data.map((item: CmsTaxonomyTerm)=>{
                            return(
                            <tr key={ item.id } className="border-b dark:border-gray-700">
                                <th scope="row" className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                    <span style={{ paddingLeft: item.parent_id ? '1.5rem' : '0' }} className="flex items-center">
                                        {item.parent_id && <span className="text-gray-400 mr-1">—</span>}
                                        { item.name }
                                    </span>
                                </th>
                                <td className="px-4 py-3">{ item.slug }</td>
                                <td className="px-4 py-3 text-gray-400">
                                    { item.parent ? item.parent.name : <span className="text-gray-300">Ninguno</span> }
                                </td>
                                <td className="px-4 py-3 max-w-xs truncate">{ item.description }</td>
                                <td className="px-4 py-3">{ item.active? <Check/>: <></> }</td>
                                <td className="px-4 py-3">{ format(new Date(item.created_at), 'dd/MM/yyyy HH:mm') }</td>
                                <td className="px-4 py-3 flex items-center justify-end gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex items-center gap-1 h-8 px-2.5"
                                        onClick={() => router.visit(`/admin/terms/${item.id}/edit`)}
                                    >
                                        <Edit className="h-3.5 w-3.5" />
                                        <span>Editar</span>
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="flex items-center gap-1 h-8 px-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/20"
                                        onClick={() => deleteTermHandler(item.id)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        <span>Eliminar</span>
                                    </Button>
                                </td>
                            </tr>
                            )}
                        )}
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
                {items.links &&
                <PaginationNav data={items}/>
                }
            </div>
        </ModuleLayout>
    );
}
