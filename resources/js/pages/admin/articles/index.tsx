import { useEffect, useState } from 'react';

import { deleteArticle, getArticles } from '@/services/articles';
import { router, usePage } from '@inertiajs/react';

import {
    BulkActionsBar,
    RowCheckbox,
    ScheduledBadge,
    SelectAllCheckbox,
    TrashRowActions,
    TrashToggle,
    useRowSelection,
} from '@/components/content-bulk-actions';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PaginationNav } from '@/components/ui/pagination-nav';
import ModuleLayout from '@/layouts/module/layout';
import { Pagination } from '@/types';
import { CmsArticle } from '@/types/models/cms-article';
import { Input } from '@headlessui/react';
import { format } from 'date-fns';
import { Check, ChevronDown, ChevronRight, Edit, FileText, ListOrdered, Plus, Search, Trash2 } from 'lucide-react';
import SortableArticlesModal from './partials/SortableArticlesModal';

export default function Index() {
    const { items, paging, filters, trashCount } = usePage<{
        items: CmsArticle[];
        paging: Pagination<CmsArticle>;
        filters: { s?: string; trash?: string };
        trashCount: number;
    }>().props;
    const trash = filters.trash === '1';
    const [query, setQuery] = useState({ s: filters.s ?? '' });
    const selection = useRowSelection(paging.data.map((item) => item.id));
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
        getArticles({ ...query, trash: trash ? 1 : undefined });
    };

    useEffect(() => {
        if (query.s) {
            getArticles({ ...query, trash: trash ? 1 : undefined });
        }
    }, [query, trash]);

    const handleTrashToggle = (showTrash: boolean) => {
        selection.clear();
        getArticles({ s: query.s || undefined, trash: showTrash ? 1 : undefined });
    };

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
                    <div className="relative max-w-md flex-1">
                        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2" />
                        <Input
                            type="text"
                            value={query.s ?? ''}
                            onChange={handleSearch}
                            className="border-border/70 bg-card text-foreground placeholder:text-muted-foreground h-10 w-full rounded-xl border pr-4 pl-10 text-xs shadow-2xs transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-hidden sm:text-sm"
                            placeholder="Buscar por título o slug..."
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <TrashToggle trash={trash} count={trashCount} onChange={handleTrashToggle} />

                        {!trash && (
                            <Button
                                variant="outline"
                                onClick={() => setSortableModalOpen(true)}
                                className="border-border/70 text-foreground hover:bg-muted/60 h-10 gap-1.5 rounded-xl text-xs font-medium shadow-2xs"
                            >
                                <ListOrdered className="text-muted-foreground h-4 w-4" />
                                <span>Reordenar</span>
                            </Button>
                        )}

                        <Button
                            onClick={handleCreateClick}
                            className="h-10 gap-1.5 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white shadow-sm shadow-violet-500/25 transition-all hover:bg-violet-700 active:scale-95"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Crear Página</span>
                        </Button>
                    </div>
                </div>

                <BulkActionsBar routeName="articles.bulk" selected={selection.selected} trash={trash} onClear={selection.clear} />

                {/* Modern Data Table Card */}
                <div className="border-border/70 bg-card overflow-hidden rounded-2xl border shadow-2xs">
                    <div className="overflow-x-auto">
                        <table className="text-muted-foreground w-full text-left text-xs">
                            <thead className="border-border/60 bg-muted/40 text-muted-foreground border-b text-[11px] font-semibold tracking-wider uppercase">
                                <tr>
                                    <th scope="col" className="w-10 py-3.5 pl-5">
                                        <SelectAllCheckbox state={selection.allState} onToggle={selection.toggleAll} />
                                    </th>
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
                                        {trash ? 'Eliminado' : 'Fecha'}
                                    </th>
                                    <th scope="col" className="px-5 py-3.5 text-right">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-border/40 divide-y">
                                {paging.data.length > 0 ? (
                                    paging.data.map((item: CmsArticle) => {
                                        if (!trash && !isRowVisible(item)) {
                                            return null;
                                        }
                                        const hasChildren = items.some((p) => p.parent_id === item.id);
                                        const isCollapsed = collapsedPageIds.includes(item.id);

                                        return (
                                            <tr key={item.id} className="group hover:bg-muted/30 transition-colors">
                                                <td className="py-3.5 pl-5">
                                                    <RowCheckbox
                                                        checked={selection.isSelected(item.id)}
                                                        onToggle={() => selection.toggle(item.id)}
                                                        label={item.title}
                                                    />
                                                </td>
                                                <th scope="row" className="text-foreground px-5 py-3.5 font-medium whitespace-nowrap">
                                                    <div style={{ paddingLeft: `${(item.depth || 0) * 1.5}rem` }} className="flex items-center gap-2">
                                                        {hasChildren && !trash ? (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleCollapse(item.id);
                                                                }}
                                                                className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-md p-1 transition-colors"
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
                                                        {(item.depth || 0) > 0 && <span className="text-muted-foreground/50 mr-1">└</span>}
                                                        <div className="flex flex-col">
                                                            <span className="text-foreground text-sm leading-snug font-semibold transition-colors group-hover:text-violet-600 dark:group-hover:text-violet-400">
                                                                {item.title}
                                                            </span>
                                                            <span className="text-muted-foreground/70 font-mono text-[11px]">/{item.slug}</span>
                                                        </div>
                                                    </div>
                                                </th>
                                                <td className="px-4 py-3.5">
                                                    {item.schema ? (
                                                        <span className="border-border/60 bg-muted/50 text-foreground inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium">
                                                            {item.schema.name}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground/60 italic">Por defecto</span>
                                                    )}
                                                </td>
                                                <td className="text-muted-foreground px-4 py-3.5">
                                                    {item.parent ? (
                                                        item.parent.title
                                                    ) : (
                                                        <span className="text-muted-foreground/40 italic">Raíz (Ninguna)</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    {item.is_scheduled ? (
                                                        <ScheduledBadge date={item.published_at} />
                                                    ) : (
                                                        <span
                                                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${
                                                                item.status === 'published' || !item.status
                                                                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                                    : 'border-border/60 bg-muted text-muted-foreground'
                                                            }`}
                                                        >
                                                            <span
                                                                className={`h-1.5 w-1.5 rounded-full ${
                                                                    item.status === 'published' || !item.status
                                                                        ? 'animate-pulse bg-emerald-500'
                                                                        : 'bg-muted-foreground'
                                                                }`}
                                                            />
                                                            {item.status === 'published' || !item.status ? 'Publicado' : 'Borrador'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    {item.active ? (
                                                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                                            <Check className="h-3 w-3" />
                                                        </span>
                                                    ) : (
                                                        <span className="bg-muted text-muted-foreground/60 inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px]">
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="text-muted-foreground px-4 py-3.5 text-[11px]">
                                                    {(() => {
                                                        const date = trash ? item.deleted_at : (item.published_at ?? item.created_at);
                                                        return date ? format(new Date(date), 'dd/MM/yyyy HH:mm') : '—';
                                                    })()}
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    {trash ? (
                                                        <TrashRowActions routeName="articles.bulk" id={item.id} />
                                                    ) : (
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-muted-foreground hover:bg-muted hover:text-foreground h-8 gap-1 rounded-lg px-2 text-xs font-medium"
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
                                                                <span className="hidden sm:inline">Papelera</span>
                                                            </Button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="p-8">
                                            {trash ? (
                                                <EmptyState
                                                    icon={Trash2}
                                                    title="La papelera está vacía"
                                                    description="Las páginas que muevas a la papelera aparecerán aquí hasta que las restaures o las elimines definitivamente."
                                                />
                                            ) : (
                                                <EmptyState
                                                    icon={FileText}
                                                    title={query.s ? 'No se encontraron páginas' : 'Aún no hay páginas creadas'}
                                                    description={
                                                        query.s
                                                            ? `No hay ninguna página que coincida con "${query.s}". Intenta con otro término de búsqueda.`
                                                            : 'Comienza creando tu primera página para estructurar el contenido de tu sitio web.'
                                                    }
                                                    action={
                                                        !query.s
                                                            ? {
                                                                  label: 'Crear Primera Página',
                                                                  href: route('articles.create'),
                                                                  icon: Plus,
                                                              }
                                                            : undefined
                                                    }
                                                />
                                            )}
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
