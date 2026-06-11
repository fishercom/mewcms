
import { useState, useEffect } from 'react';

import { router, usePage } from '@inertiajs/react';
import { getArticles, deleteArticle } from '@/services/articles';

import ModuleLayout from '@/layouts/module/layout';
import { format } from 'date-fns'
import { CmsArticle } from '@/types/models/cms-article';
import { Pagination } from '@/types';
import { Button } from '@/components/ui/button';
import { Check, Search, Plus, ListOrdered, Edit, Trash2 } from 'lucide-react';
import { Input } from '@headlessui/react';
import { PaginationNav } from '@/components/ui/pagination-nav';
import SortableArticlesModal from './partials/SortableArticlesModal';

export default function Index() {

    const { items, paging } = usePage<{ items: CmsArticle[], paging: Pagination<CmsArticle> }>().props;
    const [ query, setQuery ] = useState({s: ''});
    const [isSortableModalOpen, setSortableModalOpen] = useState(false);

    const handleCloseSortableModal = () => {
        setSortableModalOpen(false);
        getArticles(query);
    }

    useEffect(() => {
        if(query.s){
            getArticles(query);
        }
    }, [query]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>)=>{
        const {value} = e.target;
        setQuery({s: value});
    }

    const deleteArticleHandler = (id: number) => {
        deleteArticle(id);
    }

    const handleCreateClick = () => {
        router.visit(route('articles.create'));
    }

    return (
        <ModuleLayout>
            <div className="relative overflow-hidden">
                <div className="flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0 md:space-x-4 pb-4">
                    <div className="w-full md:w-3/4">
                        <form className="flex items-center">
                            <label htmlFor="simple-search" className="sr-only">Buscar</label>
                            <div className="relative w-full">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                                    <Search/>
                                </div>
                                <Input type='text' autoFocus value={query.s??''} onChange={handleSearch} className="focus-within:outline-2 focus-within:outline-gray-400 border border-gray-500 text-sm rounded-md block w-full pl-10 p-2" placeholder="Buscar" />
                            </div>
                        </form>
                    </div>
                    <div className="w-full md:w-auto flex items-center justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setSortableModalOpen(true)}
                            className="flex items-center gap-1.5 h-10 px-4"
                        >
                            <ListOrdered className="h-4 w-4" />
                            <span>Ordenar Artículos</span>
                        </Button>
                        <Button
                            onClick={handleCreateClick}
                            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white dark:bg-red-500 dark:hover:bg-red-600"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Crear Artículo</span>
                        </Button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-sm text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-800 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-4 py-3 rounded-l-md">Nombre</th>
                                <th scope="col" className="px-4 py-3">Activo</th>
                                <th scope="col" className="px-4 py-3">Fecha de Creación</th>
                                <th scope="col" className="px-4 py-3">Fecha de Actualización</th>
                                <th scope="col" className="px-4 py-3 rounded-r-md"></th>
                            </tr>
                        </thead>
                        <tbody>
                        {paging.data.map((item: CmsArticle)=>{
                            return(
                            <tr key={ item.id } className="border-b dark:border-gray-700">
                                <th scope="row" className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white">{ item.title }</th>
                                <td className="px-4 py-3">{ item.active? <Check/>: <></> }</td>
                                <td className="px-4 py-3">{ format(item.created_at, 'dd/MM/yyyy HH:mm') }</td>
                                <td className="px-4 py-3">{ format(item.updated_at, 'dd/MM/yyyy HH:mm') }</td>
                                <td className="px-4 py-3 flex items-center justify-end gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex items-center gap-1 h-8 px-2.5"
                                        onClick={() => router.visit(route('articles.edit', item.id))}
                                    >
                                        <Edit className="h-3.5 w-3.5" />
                                        <span>Editar</span>
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="flex items-center gap-1 h-8 px-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/20"
                                        onClick={() => deleteArticleHandler(item.id)}
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
                {paging.links &&
                <PaginationNav data={paging}/>
                }
            </div>
            <SortableArticlesModal
                isOpen={isSortableModalOpen}
                onClose={handleCloseSortableModal}
                articles={items}
            />
        </ModuleLayout>
    );
}
