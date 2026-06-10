import { useState, useEffect } from 'react';
import { usePage, Link } from '@inertiajs/react';
import ModuleLayout from '@/layouts/module/layout';
import FormLayout from '@/layouts/module/Form';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { updateMenu, createMenuItem, deleteMenuItem } from '@/services/menus';
import { CmsMenu, CmsMenuItem, CmsMenuItemForm } from '@/types/models/cms-menu';
import { CmsArticle } from '@/types/models/cms-article';
import MenuFormFields from './partials/fields';
import { ReactSortable } from 'react-sortablejs';
import axios from 'axios';
import { Edit2, Trash2, GripVertical, Settings, Layers, PlusCircle, Check } from 'lucide-react';

interface PageProps {
    item: CmsMenu;
    articles: CmsArticle[];
    [key: string]: unknown;
}

export default function Edit() {
    const { item, articles = [] } = usePage<PageProps>().props;

    // Tabs state
    const [activeTab, setActiveTab] = useState<'details' | 'builder'>('builder');

    // Menu details form state
    const [menuData, setMenuData] = useState<import('@/types/models/cms-menu').CmsMenuForm>({
        id: item.id,
        name: item.name,
        slug: item.slug,
        description: item.description || '',
        active: item.active,
    });
    const [menuErrors, setMenuErrors] = useState<Record<string, string>>({});
    const [menuProcessing, setMenuProcessing] = useState(false);

    // Menu items list state
    const [menuItems, setMenuItems] = useState<CmsMenuItem[]>([]);
    useEffect(() => {
        if (item.items) {
            setMenuItems(item.items);
        }
    }, [item.items]);

    // Active item form state for adding/editing a link
    const initialItemForm: CmsMenuItemForm = {
        id: null,
        parent_id: null,
        title: '',
        url: '',
        article_id: null,
        target: '_self',
        active: true,
    };
    const [itemData, setItemData] = useState<CmsMenuItemForm>(initialItemForm);
    const [itemErrors, setItemErrors] = useState<Record<string, string>>({});
    const [itemProcessing, setItemProcessing] = useState(false);
    const [linkType, setLinkType] = useState<'custom' | 'article'>('custom');

    // Sort status notice
    const [sortNotice, setSortNotice] = useState<string | null>(null);

    // Filter Top Level menu items
    const topLevelItems = menuItems
        .filter((i) => i.parent_id === null)
        .sort((a, b) => a.position - b.position);

    // Get subitems group by parent ID
    const getSubItems = (parentId: number) => {
        return menuItems
            .filter((i) => i.parent_id === parentId)
            .sort((a, b) => a.position - b.position);
    };

    const handleMenuSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setMenuProcessing(true);
        setMenuErrors({});

        updateMenu(item.id, menuData, {
            onSuccess: () => setMenuProcessing(false),
            onError: (err) => {
                setMenuErrors(err);
                setMenuProcessing(false);
            },
        });
    };

    const handleItemSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setItemProcessing(true);
        setItemErrors({});

        // Prepare request details
        const payload = {
            ...itemData,
            url: linkType === 'custom' ? itemData.url : null,
            article_id: linkType === 'article' ? itemData.article_id : null,
        };

        createMenuItem(item.id, payload, {
            onSuccess: () => {
                setItemProcessing(false);
                setItemData(initialItemForm);
                setLinkType('custom');
            },
            onError: (err) => {
                setItemErrors(err);
                setItemProcessing(false);
            },
        });
    };

    const handleEditItem = (menuItem: CmsMenuItem) => {
        setItemData({
            id: menuItem.id,
            parent_id: menuItem.parent_id,
            title: menuItem.title,
            url: menuItem.url || '',
            article_id: menuItem.article_id,
            target: menuItem.target,
            active: menuItem.active,
        });
        setLinkType(menuItem.article_id ? 'article' : 'custom');
    };

    const handleDeleteItem = (id: number) => {
        deleteMenuItem(id);
    };

    // Sort handlers
    const saveSortOrder = (newItemsList: CmsMenuItem[]) => {
        setSortNotice('Guardando orden...');
        axios
            .post(route('menus.items.sort', item.id), {
                items: newItemsList.map((it, idx) => ({
                    id: it.id,
                    parent_id: it.parent_id,
                    position: idx,
                })),
            })
            .then(() => {
                setSortNotice('Orden guardado con éxito!');
                setTimeout(() => setSortNotice(null), 3000);
            })
            .catch((err) => {
                console.error(err);
                setSortNotice('Error al guardar el orden.');
            });
    };

    const handleSortTopLevel = (sorted: CmsMenuItem[]) => {
        // Re-align positions
        const otherItems = menuItems.filter((i) => i.parent_id !== null);
        const nextList = [
            ...sorted.map((item, idx) => ({ ...item, position: idx, parent_id: null })),
            ...otherItems,
        ];
        setMenuItems(nextList);
        saveSortOrder(nextList);
    };

    const handleSortSubItems = (parentId: number, sortedSub: CmsMenuItem[]) => {
        const otherItems = menuItems.filter((i) => i.parent_id !== parentId);
        const nextList = [
            ...otherItems,
            ...sortedSub.map((item, idx) => ({ ...item, position: idx, parent_id: parentId })),
        ];
        setMenuItems(nextList);
        saveSortOrder(nextList);
    };

    return (
        <ModuleLayout view={`Editar Menú: ${item.name}`}>
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 dark:border-gray-800 mb-6 gap-6">
                <button
                    onClick={() => setActiveTab('builder')}
                    className={`flex items-center gap-1.5 pb-3 text-sm font-semibold border-b-2 transition-colors ${
                        activeTab === 'builder'
                            ? 'border-primary-700 text-primary-700'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Layers className="h-4 w-4" />
                    <span>Constructor de Ítems</span>
                </button>
                <button
                    onClick={() => setActiveTab('details')}
                    className={`flex items-center gap-1.5 pb-3 text-sm font-semibold border-b-2 transition-colors ${
                        activeTab === 'details'
                            ? 'border-primary-700 text-primary-700'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Settings className="h-4 w-4" />
                    <span>Detalles del Menú</span>
                </button>
            </div>

            {activeTab === 'details' && (
                <FormLayout>
                    <form onSubmit={handleMenuSubmit} className="space-y-6">
                        <MenuFormFields
                            data={menuData}
                            setData={setMenuData}
                            errors={menuErrors}
                            processing={menuProcessing}
                        />
                        <div className="flex items-center gap-4">
                            <Button disabled={menuProcessing}>Guardar Detalles</Button>
                            <Link href="/admin/menus" className="text-sm text-gray-600 hover:underline">
                                Cancelar
                            </Link>
                        </div>
                    </form>
                </FormLayout>
            )}

            {activeTab === 'builder' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left side: Drag-and-Drop Structure */}
                    <div className="lg:col-span-7 space-y-4">
                        <div className="flex justify-between items-center bg-gray-50 dark:bg-[#161615] p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                            <div>
                                <h3 className="font-semibold text-sm">Estructura del Menú</h3>
                                <p className="text-xs text-gray-500">
                                    Arrastra y suelta los ítems para ordenarlos.
                                </p>
                            </div>
                            {sortNotice && (
                                <span className="text-xs bg-primary-50 text-primary-700 dark:bg-primary-950/30 dark:text-primary-400 px-2.5 py-1 rounded-md border border-primary-200/50 flex items-center gap-1">
                                    <Check className="h-3 w-3" />
                                    {sortNotice}
                                </span>
                            )}
                        </div>

                        {topLevelItems.length > 0 ? (
                            <div className="space-y-3">
                                <ReactSortable
                                    list={topLevelItems}
                                    setList={handleSortTopLevel}
                                    handle=".handle"
                                    animation={150}
                                    className="space-y-3"
                                >
                                    {topLevelItems.map((parent) => {
                                        const subItems = getSubItems(parent.id);
                                        return (
                                            <div
                                                key={parent.id}
                                                className="bg-white dark:bg-[#161615] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm"
                                            >
                                                {/* Top Level Item Bar */}
                                                <div className="flex items-center justify-between p-3.5 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            type="button"
                                                            className="handle cursor-grab hover:text-gray-700 text-gray-400"
                                                        >
                                                            <GripVertical className="h-4.5 w-4.5" />
                                                        </button>
                                                        <div>
                                                            <span className="font-medium text-sm">{parent.title}</span>
                                                            <span className="ml-2.5 text-[10px] text-gray-400 uppercase tracking-wider bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                                                                {parent.article_id ? 'Artículo' : 'Enlace'}
                                                            </span>
                                                            <span className="ml-1.5 text-xs text-gray-400 max-w-[200px] truncate block sm:inline">
                                                                {parent.resolved_url}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 text-gray-500 hover:text-gray-800"
                                                            onClick={() => handleEditItem(parent)}
                                                        >
                                                            <Edit2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 text-red-500 hover:text-red-700"
                                                            onClick={() => handleDeleteItem(parent.id)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* Nested Sub-Items Area */}
                                                <div className="pl-8 pr-4 pb-3 bg-gray-50/30 dark:bg-black/5 border-t border-gray-100 dark:border-gray-900/50 space-y-2">
                                                    <ReactSortable
                                                        list={subItems}
                                                        setList={(sortedSub) =>
                                                            handleSortSubItems(parent.id, sortedSub)
                                                        }
                                                        handle=".subhandle"
                                                        animation={150}
                                                        className="space-y-2 pt-3"
                                                    >
                                                        {subItems.map((sub) => (
                                                            <div
                                                                key={sub.id}
                                                                className="flex items-center justify-between p-2.5 bg-white dark:bg-[#1f1f1e] rounded-lg border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 shadow-sm"
                                                            >
                                                                <div className="flex items-center gap-2.5">
                                                                    <button
                                                                        type="button"
                                                                        className="subhandle cursor-grab hover:text-gray-700 text-gray-400"
                                                                    >
                                                                        <GripVertical className="h-4 w-4" />
                                                                    </button>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="text-xs font-medium">
                                                                            {sub.title}
                                                                        </span>
                                                                        <span className="text-[9px] text-gray-400 bg-gray-50 dark:bg-gray-800 px-1 py-0.2 rounded border">
                                                                            {sub.resolved_url}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-0.5">
                                                                    <Button
                                                                        size="icon"
                                                                        variant="ghost"
                                                                        className="h-7 w-7 text-gray-500"
                                                                        onClick={() => handleEditItem(sub)}
                                                                    >
                                                                        <Edit2 className="h-3 w-3" />
                                                                    </Button>
                                                                    <Button
                                                                        size="icon"
                                                                        variant="ghost"
                                                                        className="h-7 w-7 text-red-500"
                                                                        onClick={() => handleDeleteItem(sub.id)}
                                                                    >
                                                                        <Trash2 className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </ReactSortable>
                                                    {subItems.length === 0 && (
                                                        <div className="text-[11px] text-gray-400 italic pt-2">
                                                            No hay sub-elementos. Arrastra aquí para anidar o cambia su ítem padre.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </ReactSortable>
                            </div>
                        ) : (
                            <div className="text-center py-16 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/20">
                                <p className="text-sm text-gray-400 italic">No hay ítems en este menú.</p>
                            </div>
                        )}
                    </div>

                    {/* Right side: Add / Edit Link Form */}
                    <div className="lg:col-span-5">
                        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-6 bg-white dark:bg-[#161615] space-y-5 shadow-sm">
                            <h3 className="flex items-center gap-1.5 text-sm font-semibold border-b border-gray-100 dark:border-gray-900 pb-3">
                                <PlusCircle className="h-4.5 w-4.5 text-primary-700" />
                                <span>{itemData.id ? 'Editar Ítem de Menú' : 'Agregar Ítem de Menú'}</span>
                            </h3>

                            <form onSubmit={handleItemSubmit} className="space-y-4">
                                {/* Link Type Selector */}
                                <div className="grid gap-2">
                                    <Label>Tipo de Enlace</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setLinkType('custom')}
                                            className={`px-3 py-2 rounded-lg text-xs font-semibold border text-center transition-colors ${
                                                linkType === 'custom'
                                                    ? 'border-primary-700 bg-primary-50/30 text-primary-700 dark:bg-primary-950/20'
                                                    : 'border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-800'
                                            }`}
                                        >
                                            Enlace Personalizado
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setLinkType('article')}
                                            className={`px-3 py-2 rounded-lg text-xs font-semibold border text-center transition-colors ${
                                                linkType === 'article'
                                                    ? 'border-primary-700 bg-primary-50/30 text-primary-700 dark:bg-primary-950/20'
                                                    : 'border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-800'
                                            }`}
                                        >
                                            Artículo de CMS
                                        </button>
                                    </div>
                                </div>

                                {/* Title Label */}
                                <div className="grid gap-1.5">
                                    <Label htmlFor="item-title">Etiqueta / Label</Label>
                                    <Input
                                        id="item-title"
                                        type="text"
                                        required
                                        placeholder="Ej. Acerca de"
                                        value={itemData.title}
                                        onChange={(e) => setItemData({ ...itemData, title: e.target.value })}
                                        disabled={itemProcessing}
                                    />
                                    {itemErrors.title && <span className="text-xs text-red-500">{itemErrors.title}</span>}
                                </div>

                                {/* Custom URL input */}
                                {linkType === 'custom' && (
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="item-url">URL</Label>
                                        <Input
                                            id="item-url"
                                            type="text"
                                            placeholder="Ej. /servicios o https://google.com"
                                            value={itemData.url ?? ''}
                                            onChange={(e) => setItemData({ ...itemData, url: e.target.value })}
                                            disabled={itemProcessing}
                                        />
                                        {itemErrors.url && <span className="text-xs text-red-500">{itemErrors.url}</span>}
                                    </div>
                                )}

                                {/* CMS Article Dropdown */}
                                {linkType === 'article' && (
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="item-article">Selecciona Artículo</Label>
                                        <select
                                            id="item-article"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-gray-900 dark:text-white bg-white dark:bg-[#1f1f1e]"
                                            value={itemData.article_id ?? ''}
                                            onChange={(e) =>
                                                setItemData({
                                                    ...itemData,
                                                    article_id: e.target.value ? Number(e.target.value) : null,
                                                })
                                            }
                                            disabled={itemProcessing}
                                        >
                                            <option value="">-- Selecciona --</option>
                                            {articles.map((art) => (
                                                <option key={art.id} value={art.id}>
                                                    {art.title} ({art.slug})
                                                </option>
                                            ))}
                                        </select>
                                        {itemErrors.article_id && (
                                            <span className="text-xs text-red-500">{itemErrors.article_id}</span>
                                        )}
                                    </div>
                                )}

                                {/* Parent Item selection (Level 2 nesting) */}
                                <div className="grid gap-1.5">
                                    <Label htmlFor="item-parent">Nivel Padre (Opcional)</Label>
                                    <select
                                        id="item-parent"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-gray-900 dark:text-white bg-white dark:bg-[#1f1f1e]"
                                        value={itemData.parent_id ?? ''}
                                        onChange={(e) =>
                                            setItemData({
                                                ...itemData,
                                                parent_id: e.target.value ? Number(e.target.value) : null,
                                            })
                                        }
                                        disabled={itemProcessing}
                                    >
                                        <option value="">Ninguno (Ítem de Nivel Superior)</option>
                                        {/* List top level items that are not the current item itself to prevent self-parenting */}
                                        {topLevelItems
                                            .filter((parent) => parent.id !== itemData.id)
                                            .map((parent) => (
                                                <option key={parent.id} value={parent.id}>
                                                    {parent.title}
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                {/* Target/Open details */}
                                <div className="grid gap-1.5">
                                    <Label htmlFor="item-target">Destino / Target</Label>
                                    <select
                                        id="item-target"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-gray-900 dark:text-white bg-white dark:bg-[#1f1f1e]"
                                        value={itemData.target}
                                        onChange={(e) =>
                                            setItemData({
                                                ...itemData,
                                                target: e.target.value as '_self' | '_blank',
                                            })
                                        }
                                        disabled={itemProcessing}
                                    >
                                        <option value="_self">Misma Pestaña (_self)</option>
                                        <option value="_blank">Nueva Pestaña (_blank)</option>
                                    </select>
                                </div>

                                {/* Active Checkbox */}
                                <div className="flex items-center space-x-3 pt-2">
                                    <Checkbox
                                        id="item-active"
                                        checked={Boolean(itemData.active)}
                                        onClick={() => setItemData({ ...itemData, active: !itemData.active })}
                                    />
                                    <Label htmlFor="item-active">Ítem Activo</Label>
                                </div>

                                {/* Save Button */}
                                <div className="flex items-center gap-3 pt-4">
                                    <Button className="w-full" disabled={itemProcessing}>
                                        {itemData.id ? 'Guardar Cambios' : 'Agregar al Menú'}
                                    </Button>
                                    {itemData.id && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setItemData(initialItemForm)}
                                        >
                                            Cancelar
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </ModuleLayout>
    );
}
