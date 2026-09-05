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
            <div className="space-y-4">
                {/* Search, Status Filter & Actions Toolbar */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="text"
                            value={query.s ?? ''}
                            onChange={handleSearch}
                            className="h-10 w-full rounded-xl border border-border/70 bg-card pl-10 pr-4 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground shadow-2xs transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-hidden"
                            placeholder="Buscar por título o slug..."
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <Button
                            variant="outline"
                            onClick={() => setSortableModalOpen(true)}
                            className="h-10 gap-1.5 rounded-xl border-border/70 text-xs font-medium text-foreground hover:bg-muted/60 shadow-2xs"
                        >
                            <ListOrdered className="h-4 w-4 text-muted-foreground" />
                            <span>Reordenar</span>
                        </Button>

                        <Button
                            onClick={handleCreateClick}
                            className="h-10 gap-1.5 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white shadow-sm shadow-violet-500/25 transition-all hover:bg-violet-700 active:scale-95"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Crear Página</span>
                        </Button>
                    </div>
                </div>

                {/* Modern Data Table Card */}
                <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-2xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-muted-foreground">
                            <thead className="border-b border-border/60 bg-muted/40 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                                <tr>
                                    <th scope="col" className="px-5 py-3.5">
                                        Nombre / Título
                                    </th>
                                    <th scope="col" className="px-4 py-3.5">
                                        Plantilla
                                    </th>
                                    <th scope="col" className="px-4 py-3.5">
                                        Página Superior
                                    </th>
                                    <th scope="col" className="px-4 py-3.5">
                                        Estado
                                    </th>
                                    <th scope="col" className="px-4 py-3.5">
                                        Activo
                                    </th>
                                    <th scope="col" className="px-4 py-3.5">
                                        Fecha
                                    </th>
                                    <th scope="col" className="px-5 py-3.5 text-right">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                                {paging.data.length > 0 ? (
                                    paging.data.map((item: CmsArticle) => {
                                        if (!isRowVisible(item)) {
                                            return null;
                                        }
                                        const hasChildren = items.some((p) => p.parent_id === item.id);
                                        const isCollapsed = collapsedPageIds.includes(item.id);

                                        return (
                                            <tr key={item.id} className="group transition-colors hover:bg-muted/30">
                                                <th scope="row" className="px-5 py-3.5 font-medium whitespace-nowrap text-foreground">
                                                    <div style={{ paddingLeft: `${(item.depth || 0) * 1.5}rem` }} className="flex items-center gap-2">
                                                        {hasChildren ? (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleCollapse(item.id);
                                                                }}
                                                                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                                            >
                                                                {isCollapsed ? (
                                                                    <ChevronRight className="h-3.5 w-3.5" />
                                                                ) : (
                                                                    <ChevronDown className="h-3.5 w-3.5" />
                                                                )}
                                                            </button>
                                                        ) : (
                                                            <div className="w-5" />
                                                        )}
                                                        {(item.depth || 0) > 0 && <span className="mr-1 text-muted-foreground/50">└</span>}
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-foreground text-sm leading-snug group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                                                                {item.title}
                                                            </span>
                                                            <span className="text-[11px] font-mono text-muted-foreground/70">
                                                                /{item.slug}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </th>
                                                <td className="px-4 py-3.5">
                                                    {item.schema ? (
                                                        <span className="inline-flex items-center rounded-md border border-border/60 bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-foreground">
                                                            {item.schema.name}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground/60 italic">Por defecto</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5 text-muted-foreground">
                                                    {item.parent ? item.parent.title : <span className="text-muted-foreground/40 italic">Raíz (Ninguna)</span>}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${
                                                            item.status === 'published' || !item.status
                                                                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                                : 'border-border/60 bg-muted text-muted-foreground'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`h-1.5 w-1.5 rounded-full ${
                                                                item.status === 'published' || !item.status ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'
                                                            }`}
                                                        />
                                                        {item.status === 'published' || !item.status ? 'Publicado' : 'Borrador'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    {item.active ? (
                                                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                                            <Check className="h-3 w-3" />
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground/60 text-[10px]">
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5 text-muted-foreground text-[11px]">
                                                    {item.created_at ? format(new Date(item.created_at), 'dd/MM/yyyy HH:mm') : '—'}
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 gap-1 rounded-lg px-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                                                            onClick={() => router.visit(route('articles.edit', item.id))}
                                                        >
                                                            <Edit className="h-3.5 w-3.5" />
                                                            <span className="hidden sm:inline">Editar</span>
                                                        </Button>

                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 gap-1 rounded-lg px-2 text-xs font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/20"
                                                            onClick={() => deleteArticleHandler(item.id)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                            <span className="hidden sm:inline">Eliminar</span>
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-muted-foreground italic">
                                            No se encontraron páginas que coincidan con la búsqueda.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {paging.links && <PaginationNav data={paging} />}
            </div>
            <SortableArticlesModal isOpen={isSortableModalOpen} onClose={handleCloseSortableModal} articles={items} />
        </ModuleLayout>
    );
}

