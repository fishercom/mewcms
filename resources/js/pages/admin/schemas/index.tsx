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
import { ChevronDown, Check, Search, Plus, ChevronLeft } from 'lucide-react';
import { Icon } from '@/components/icon';
import { Input } from '@headlessui/react';
import { PaginationNav } from '@/components/ui/pagination-nav';

export default function Index() {

    const { items, groups, parent, group_id, parent_id } = usePage<{ items: Pagination<CmsSchema>, groups: CmsSchemaGroup[], parent: CmsSchema, group_id: number, parent_id: number }>().props;
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
                    <div className="w-full md:w-auto flex flex-col md:flex-row space-y-2 md:space-y-0 items-stretch md:items-center justify-end md:space-x-3 flex-shrink-0">
                        <button type="button" className="flex items-center justify-center bg-primary-700 font-medium text-sm px-4 py-2" onClick={() => router.visit(route('schemas.create', {parent_id: parent_id, group_id: group_id}))}>
                            <Plus/>
                            Agrgar Esquema
                        </button>                    </div>
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
                                <td className="px-4 py-3 flex items-center justify-end">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="p-3">
                                                Actions
                                                <Icon iconNode={ChevronDown} className="h-5 w-5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-56" align="end">
                                            <DropdownMenuItem asChild>
                                                <Button className="block w-full" onClick={() => router.visit(route('schemas.edit', item.id))} variant="ghost">
                                                    Edit
                                                </Button>
                                            </DropdownMenuItem>                                            {item.type=='PAGE' &&
                                            <DropdownMenuItem asChild>
                                                <Button className="block w-full" onClick={()=>deleteSchemaHandler(item.id)} variant="ghost">
                                                    Delete
                                                </Button>
                                            </DropdownMenuItem>                                            }
                                        </DropdownMenuContent>
                                    </DropdownMenu>
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
