import { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { deleteSchema } from '@/services/schemas';

import ModuleLayout from '@/layouts/module/layout';
import { format } from 'date-fns'
import { CmsSchema } from '@/types/models/cms-schema';
import { CmsSchemaGroup } from '@/types/models/cms-schema-group';
import { Pagination } from '@/types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, Check, Search, Plus, ChevronLeft, Edit, Trash2 } from 'lucide-react';
import { Icon } from '@/components/icon';
import { Input } from '@headlessui/react';
import { PaginationNav } from '@/components/ui/pagination-nav';

export default function Index() {

    const { items, groups, parent, group_id, parent_id, errors } = usePage<{ 
        items: Pagination<CmsSchema>, 
        groups: CmsSchemaGroup[], 
        parent: CmsSchema, 
        group_id: number, 
        parent_id: number,
        errors: Record<string, string>
    }>().props;
    const [ query, setQuery ] = useState({s: ''});

    useEffect(() => {
        if(query.s){
            router.get(route('schemas.index'), query, {
                preserveState: true,
                replace: true,
            });
        }
    }, [query]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>)=>{
        const {value} = e.target;
        setQuery({s: value});
    }

    const deleteSchemaHandler = (id: number) => {
        deleteSchema(id);
    }

    return (
        <ModuleLayout>
            <div className="relative overflow-hidden">
                {errors?.error && (
                    <div className="p-3 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/50">
                        {errors.error}
                    </div>
                )}
                <div className="flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0 md:space-x-4 pb-4">
                    <div className="w-full md:w-3/4">
                        <form className="flex items-center space-y-3 md:space-y-0 md:space-x-4">
                            <label htmlFor="simple-search" className="sr-only">Search</label>
                            <div className="relative w-full">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                                    <Search/>
                                </div>
                                <Input type='text' autoFocus value={query.s??''} onChange={handleSearch} className="focus-within:outline-2 focus-within:outline-gray-400 border border-gray-500 text-sm rounded-md block w-full pl-10 p-2" placeholder="Buscar" />
                            </div>
                            <label htmlFor="simple-search" className="sr-only">Group</label>
                            <div className="focus-within:outline-2 focus-within:outline-gray-400 border border-gray-500 text-sm rounded-md block">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="p-3">
                                            {group_id && groups.length>0? groups.filter(e=>e.id==group_id)[0].name: 'Group'}
                                            <Icon iconNode={ChevronDown} className="h-5 w-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56" align="end">
                                        {groups.map(e=>
                                        <DropdownMenuItem key={e.id} asChild>
                                            <Button className="block w-full" onClick={() => router.visit(route('schemas.index', {'group_id': e.id}))} variant="ghost">
                                                {e.name}
                                            </Button>
                                        </DropdownMenuItem>                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </form>
                    </div>
                    <div className="w-full md:w-auto flex justify-end">
                        <Button
                            onClick={() => router.visit(route('schemas.create', { parent_id: parent_id, group_id: group_id }))}
                            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white dark:bg-red-500 dark:hover:bg-red-600"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Agregar Campo Personalizado</span>
                        </Button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-sm text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-800 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-4 py-3 rounded-l-md">Name</th>
                                <th scope="col" className="px-4 py-3">Active</th>
                                <th scope="col" className="px-4 py-3">Created Date</th>
                                <th scope="col" className="px-4 py-3">Updated Date</th>
                                <th scope="col" className="px-4 py-3 rounded-r-md"></th>
                            </tr>
                        </thead>
                        <tbody>
                        {items.data.map((item: CmsSchema)=>{
                            return(
                            <tr key={ item.id } className="border-b dark:border-gray-700">
                                <th scope="row" className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                    <a href={route('schemas.index', {parent_id: item.id, group_id: item.group_id})}>{ item.name }</a>
                                </th>
                                <td className="px-4 py-3">{ item.active? <Check/>: <></> }</td>
                                <td className="px-4 py-3">{ format(item.created_at, 'dd/MM/yyyy HH:mm') }</td>
                                <td className="px-4 py-3">{ format(item.updated_at, 'dd/MM/yyyy HH:mm') }</td>
                                <td className="px-4 py-3 flex items-center justify-end gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex items-center gap-1 h-8 px-2.5"
                                        onClick={() => router.visit(route('schemas.edit', item.id))}
                                    >
                                        <Edit className="h-3.5 w-3.5" />
                                        <span>Editar</span>
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={item.articles_count !== undefined && item.articles_count > 0}
                                        className="flex items-center gap-1 h-8 px-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:text-gray-400 dark:disabled:text-gray-600"
                                        onClick={() => deleteSchemaHandler(item.id)}
                                        title={item.articles_count !== undefined && item.articles_count > 0 ? "No se puede eliminar porque está asignado a uno o más artículos" : "Eliminar campo personalizado"}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        <span>Eliminar</span>
                                    </Button>
                                </td>
                            </tr>
                            )}
                        )}
                        </tbody>
                    </table>
                </div>
                {items.links &&
                <PaginationNav data={items}/>
                }
                {parent &&
                <a href={route('schemas.index', {parent_id: parent.parent_id, group_id: group_id})} className='flex'><ChevronLeft/>Regresar</a>
                }
            </div>
        </ModuleLayout>
    );
}
