import { useEffect, useState } from 'react';

import { deleteArticle, getArticles } from '@/services/articles';
import { router, usePage } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import { PaginationNav } from '@/components/ui/pagination-nav';
import ModuleLayout from '@/layouts/module/layout';
import { Pagination } from '@/types';
import { CmsArticle } from '@/types/models/cms-article';
import { Input } from '@headlessui/react';
import { format } from 'date-fns';
import { Check, ChevronDown, ChevronRight, Edit, ListOrdered, Plus, Search, Trash2 } from 'lucide-react';
import SortableArticlesModal from './partials/SortableArticlesModal';

export default function Index() {
    const { items, paging } = usePage<{ items: CmsArticle[]; paging: Pagination<CmsArticle> }>().props;
    const [query, setQuery] = useState({ s: '' });
    const [isSortableModalOpen, setSortableModalOpen] = useState(false);
    const [collapsedPageIds, setCollapsedPageIds] = useState<number[]>([]);

    const toggleCollapse = (id: number) => {
        setCollapsedPageIds((prev) => (prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]));
    };

    const isRowVisible = (item: CmsArticle) => {
        let current = item;
        while (current.parent_id) {
            if (collapsedPageIds.includes(current.parent_id)) {
                return false;
            }
            const parent = items.find((p) => p.id === current.parent_id);
            if (!parent) break;
            current = parent;
        }
        return true;
    };

    const handleCloseSortableModal = () => {
        setSortableModalOpen(false);
        getArticles(query);
    };

    useEffect(() => {
        if (query.s) {
            getArticles(query);
        }
    }, [query]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setQuery({ s: value });
    };

    const deleteArticleHandler = (id: number) => {
        deleteArticle(id);
    };

    const handleCreateClick = () => {
        router.visit(route('articles.create'));
    };

    return (
        <ModuleLayout>
            <div className="relative overflow-hidden">
                <div className="flex flex-col items-center justify-between space-y-3 pb-4 md:flex-row md:space-y-0 md:space-x-4">
                    <div className="w-full md:w-3/4">
                        <form className="flex items-center">
                            <label htmlFor="simple-search" className="sr-only">
                                Buscar
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
                                    className="block w-full rounded-md border border-gray-500 p-2 pl-10 text-sm focus-within:outline-2 focus-within:outline-gray-400"
                                    placeholder="Buscar"
                                />
                            </div>
                        </form>
                    </div>
                    <div className="flex w-full items-center justify-end gap-3 md:w-auto">
                        <Button variant="outline" onClick={() => setSortableModalOpen(true)} className="flex h-10 items-center gap-1.5 px-4">
                            <ListOrdered className="h-4 w-4" />
                            <span>Ordenar Artículos</span>
                        </Button>
                        <Button
                            onClick={handleCreateClick}
                            className="flex items-center gap-1.5 bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Crear Artículo</span>
                        </Button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                        <thead className="bg-gray-100 text-sm text-xs text-gray-700 uppercase dark:bg-gray-800 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="rounded-l-md px-4 py-3">
                                    Nombre
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    Plantilla
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    Página Superior
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    Estado
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    Activo
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    Fecha de Creación
                                </th>
                                <th scope="col" className="rounded-r-md px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {paging.data.map((item: CmsArticle) => {
                                if (!isRowVisible(item)) {
                                    return null;
                                }
                                const hasChildren = items.some((p) => p.parent_id === item.id);
                                const isCollapsed = collapsedPageIds.includes(item.id);

                                return (
                                    <tr key={item.id} className="border-b dark:border-gray-700">
                                        <th scope="row" className="px-4 py-3 font-medium whitespace-nowrap text-gray-900 dark:text-white">
                                            <span style={{ paddingLeft: `${(item.depth || 0) * 1.5}rem` }} className="flex items-center gap-1.5">
                                                {hasChildren ? (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleCollapse(item.id);
                                                        }}
                                                        className="rounded p-1 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
                                                    >
                                                        {isCollapsed ? (
                                                            <ChevronRight className="h-3.5 w-3.5" />
                                                        ) : (
                                                            <ChevronDown className="h-3.5 w-3.5" />
                                                        )}
                                                    </button>
                                                ) : (
                                                    <div className="w-6" />
                                                )}
                                                {(item.depth || 0) > 0 && <span className="mr-1.5 text-gray-400">{'—'.repeat(item.depth || 0)}</span>}
                                                {item.title}
                                            </span>
                                        </th>
                                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                                            {item.schema ? item.schema.name : <span className="text-zinc-400 italic">Ninguna</span>}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                                            {item.parent ? item.parent.title : <span className="text-gray-300 dark:text-gray-600">Ninguna</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                                    item.status === 'published' || !item.status
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400'
                                                        : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                                                }`}
                                            >
                                                {item.status === 'published' || !item.status ? 'Publicado' : 'Borrador'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">{item.active ? <Check /> : <></>}</td>
                                        <td className="px-4 py-3">{format(item.created_at, 'dd/MM/yyyy HH:mm')}</td>
                                        <td className="flex items-center justify-end gap-2 px-4 py-3">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex h-8 items-center gap-1 px-2.5"
                                                onClick={() => router.visit(route('articles.edit', item.id))}
                                            >
                                                <Edit className="h-3.5 w-3.5" />
                                                <span>Editar</span>
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="flex h-8 items-center gap-1 px-2.5 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/20 dark:hover:text-red-300"
                                                onClick={() => deleteArticleHandler(item.id)}
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
                {paging.links && <PaginationNav data={paging} />}
            </div>
            <SortableArticlesModal isOpen={isSortableModalOpen} onClose={handleCloseSortableModal} articles={items} />
        </ModuleLayout>
    );
}
