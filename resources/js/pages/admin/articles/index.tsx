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
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PaginationNav } from '@/components/ui/pagination-nav';
import ModuleLayout from '@/layouts/module/layout';
import { t } from '@/lib/i18n';
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
            <div className="relative space-y-4">
                {/* Search and actions */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative min-w-[14rem] flex-[1_1_18rem]">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Search className="text-muted-foreground h-4 w-4" />
                        </div>
                        <Input
                            type="text"
                            value={query.s ?? ''}
                            onChange={handleSearch}
                            className="border-border text-foreground block w-full rounded-md border bg-transparent p-2 pl-10 text-sm"
                            placeholder={t('Buscar por título o slug...')}
                        />
                    </div>

                    <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
                        <TrashToggle trash={trash} count={trashCount} onChange={handleTrashToggle} />

                        {!trash && (
                            <Button variant="outline" onClick={() => setSortableModalOpen(true)} className="flex items-center gap-1.5">
                                <ListOrdered className="h-4 w-4" />
                                <span>{t('Reordenar')}</span>
                            </Button>
                        )}

                        <Button
                            onClick={handleCreateClick}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5"
                        >
                            <Plus className="h-4 w-4" />
                            <span>{t('Crear Página')}</span>
                        </Button>
                    </div>
                </div>

                <BulkActionsBar routeName="articles.bulk" selected={selection.selected} trash={trash} onClear={selection.clear} />

                <div>
                    <div className="overflow-x-auto">
                        <table className="text-muted-foreground w-full text-left text-sm">
                            <thead className="bg-table-header text-muted-foreground text-xs uppercase">
                                <tr>
                                    <th scope="col" className="w-10 rounded-l-md py-3 pl-4">
                                        <SelectAllCheckbox state={selection.allState} onToggle={selection.toggleAll} />
                                    </th>
                                    <th scope="col" className="px-4 py-3">
                                        {t('Nombre / Título')}
                                    </th>
                                    <th scope="col" className="hidden px-4 py-3 xl:table-cell">
                                        {t('Plantilla')}
                                    </th>
                                    <th scope="col" className="hidden px-4 py-3 xl:table-cell">
                                        {t('Página Superior')}
                                    </th>
                                    <th scope="col" className="px-4 py-3">
                                        {t('Estado')}
                                    </th>
                                    <th scope="col" className="hidden px-4 py-3 xl:table-cell">
                                        {t('Activo')}
                                    </th>
                                    <th scope="col" className="px-4 py-3">
                                        {trash ? t('Eliminado') : t('Fecha')}
                                    </th>
                                    <th scope="col" className="rounded-r-md px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {paging.data.length > 0 ? (
                                    paging.data.map((item: CmsArticle) => {
                                        if (!trash && !isRowVisible(item)) {
                                            return null;
                                        }
                                        const hasChildren = items.some((p) => p.parent_id === item.id);
                                        const isCollapsed = collapsedPageIds.includes(item.id);

                                        return (
                                            <tr key={item.id} className="hover:bg-muted/50 border-b">
                                                <td className="py-3 pl-4">
                                                    <RowCheckbox
                                                        checked={selection.isSelected(item.id)}
                                                        onToggle={() => selection.toggle(item.id)}
                                                        label={item.title}
                                                    />
                                                </td>
                                                <th scope="row" className="text-foreground px-4 py-3 font-medium">
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
                                                            <span className="text-foreground text-sm leading-snug font-semibold">{item.title}</span>
                                                            <span className="text-muted-foreground/70 font-mono text-[11px] break-all">
                                                                /{item.uri ?? item.slug}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </th>
                                                <td className="hidden px-4 py-3 xl:table-cell">
                                                    {item.schema ? (
                                                        <span className="border-border/60 bg-muted/50 text-foreground inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium">
                                                            {item.schema.name}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground/60 italic">{t('Por defecto')}</span>
                                                    )}
                                                </td>
                                                <td className="text-muted-foreground hidden px-4 py-3 xl:table-cell">
                                                    {item.parent ? (
                                                        item.parent.title
                                                    ) : (
                                                        <span className="text-muted-foreground/40 italic">{t('Raíz (Ninguna)')}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {item.is_scheduled ? (
                                                        <ScheduledBadge date={item.published_at} />
                                                    ) : (
                                                        <StatusBadge status={item.status === 'draft' ? 'draft' : 'published'} />
                                                    )}
                                                </td>
                                                <td className="hidden px-4 py-3 xl:table-cell">
                                                    {item.active ? (
                                                        <span className="bg-success/10 text-success inline-flex h-5 w-5 items-center justify-center rounded-full">
                                                            <Check className="h-3 w-3" />
                                                        </span>
                                                    ) : (
                                                        <span className="bg-muted text-muted-foreground/60 inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px]">
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="text-muted-foreground px-4 py-3 text-[11px]">
                                                    {(() => {
                                                        const date = trash ? item.deleted_at : (item.published_at ?? item.created_at);
                                                        return date ? format(new Date(date), 'dd/MM/yyyy HH:mm') : '—';
                                                    })()}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {trash ? (
                                                        <TrashRowActions routeName="articles.bulk" id={item.id} />
                                                    ) : (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="flex h-8 items-center gap-1 px-2.5"
                                                                onClick={() => router.visit(route('articles.edit', item.id))}
                                                            >
                                                                <Edit className="h-3.5 w-3.5" />
                                                                <span>{t('Editar')}</span>
                                                            </Button>

                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-destructive hover:bg-destructive/10 hover:text-destructive flex h-8 items-center gap-1 px-2.5"
                                                                onClick={() => deleteArticleHandler(item.id)}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                                <span>{t('Eliminar')}</span>
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
                                                    title={t('La papelera está vacía')}
                                                    description={t(
                                                        'Las páginas que muevas a la papelera aparecerán aquí hasta que las restaures o las elimines definitivamente.',
                                                    )}
                                                />
                                            ) : (
                                                <EmptyState
                                                    icon={FileText}
                                                    title={query.s ? t('No se encontraron páginas') : t('Aún no hay páginas creadas')}
                                                    description={
                                                        query.s
                                                            ? t(
                                                                  'No hay ninguna página que coincida con ":search". Intenta con otro término de búsqueda.',
                                                                  { search: query.s },
                                                              )
                                                            : t('Comienza creando tu primera página para estructurar el contenido de tu sitio web.')
                                                    }
                                                    action={
                                                        !query.s
                                                            ? {
                                                                  label: t('Crear Primera Página'),
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
