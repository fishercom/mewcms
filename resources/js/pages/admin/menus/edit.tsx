import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import FormLayout from '@/layouts/module/Form';
import ModuleLayout from '@/layouts/module/layout';
import { createMenuItem, deleteMenuItem, updateMenu } from '@/services/menus';
import { CmsArticle } from '@/types/models/cms-article';
import { CmsMenu, CmsMenuItem, CmsMenuItemForm } from '@/types/models/cms-menu';
import { Link, usePage } from '@inertiajs/react';
import axios from 'axios';
import { Check, Edit2, GripVertical, Layers, PlusCircle, Settings, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ReactSortable } from 'react-sortablejs';
import MenuFormFields from './partials/fields';

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
    const topLevelItems = menuItems.filter((i) => i.parent_id === null).sort((a, b) => a.position - b.position);

    // Get subitems group by parent ID
    const getSubItems = (parentId: number) => {
        return menuItems.filter((i) => i.parent_id === parentId).sort((a, b) => a.position - b.position);
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
        const nextList = [...sorted.map((item, idx) => ({ ...item, position: idx, parent_id: null })), ...otherItems];
        setMenuItems(nextList);
        saveSortOrder(nextList);
    };

    const handleSortSubItems = (parentId: number, sortedSub: CmsMenuItem[]) => {
        const otherItems = menuItems.filter((i) => i.parent_id !== parentId);
        const nextList = [...otherItems, ...sortedSub.map((item, idx) => ({ ...item, position: idx, parent_id: parentId }))];
        setMenuItems(nextList);
        saveSortOrder(nextList);
    };

    return (
        <ModuleLayout view={`Editar Menú: ${item.name}`}>
            {/* Tab Navigation */}
            <div className="mb-6 flex gap-6 border-b border-gray-200 dark:border-gray-800">
                <button
                    onClick={() => setActiveTab('builder')}
                    className={`flex items-center gap-1.5 border-b-2 pb-3 text-sm font-semibold transition-colors ${
                        activeTab === 'builder' ? 'border-primary-700 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Layers className="h-4 w-4" />
                    <span>Constructor de Ítems</span>
                </button>
                <button
                    onClick={() => setActiveTab('details')}
                    className={`flex items-center gap-1.5 border-b-2 pb-3 text-sm font-semibold transition-colors ${
                        activeTab === 'details' ? 'border-primary-700 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Settings className="h-4 w-4" />
                    <span>Detalles del Menú</span>
                </button>
            </div>

            {activeTab === 'details' && (
                <FormLayout>
                    <form onSubmit={handleMenuSubmit} className="space-y-6">
                        <MenuFormFields data={menuData} setData={setMenuData} errors={menuErrors} processing={menuProcessing} />
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
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                    {/* Left side: Drag-and-Drop Structure */}
                    <div className="space-y-4 lg:col-span-7">
                        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-[#161615]">
                            <div>
                                <h3 className="text-sm font-semibold">Estructura del Menú</h3>
                                <p className="text-xs text-gray-500">Arrastra y suelta los ítems para ordenarlos.</p>
                            </div>
                            {sortNotice && (
                                <span className="bg-primary-50 text-primary-700 dark:bg-primary-950/30 dark:text-primary-400 border-primary-200/50 flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs">
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
                                                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-[#161615]"
                                            >
                                                {/* Top Level Item Bar */}
                                                <div className="flex items-center justify-between p-3.5 transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/20">
                                                    <div className="flex items-center gap-3">
                                                        <button type="button" className="handle cursor-grab text-gray-400 hover:text-gray-700">
                                                            <GripVertical className="h-4.5 w-4.5" />
                                                        </button>
                                                        <div>
                                                            <span className="text-sm font-medium">{parent.title}</span>
                                                            <span className="ml-2.5 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] tracking-wider text-gray-400 uppercase dark:bg-gray-800">
                                                                {parent.article_id ? 'Artículo' : 'Enlace'}
                                                            </span>
                                                            <span className="ml-1.5 block max-w-[200px] truncate text-xs text-gray-400 sm:inline">
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
                                                <div className="space-y-2 border-t border-gray-100 bg-gray-50/30 pr-4 pb-3 pl-8 dark:border-gray-900/50 dark:bg-black/5">
                                                    <ReactSortable
                                                        list={subItems}
                                                        setList={(sortedSub) => handleSortSubItems(parent.id, sortedSub)}
                                                        handle=".subhandle"
                                                        animation={150}
                                                        className="space-y-2 pt-3"
                                                    >
                                                        {subItems.map((sub) => (
                                                            <div
                                                                key={sub.id}
                                                                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm hover:border-gray-300 dark:border-gray-800 dark:bg-[#1f1f1e] dark:hover:border-gray-700"
                                                            >
                                                                <div className="flex items-center gap-2.5">
                                                                    <button
                                                                        type="button"
                                                                        className="subhandle cursor-grab text-gray-400 hover:text-gray-700"
                                                                    >
                                                                        <GripVertical className="h-4 w-4" />
                                                                    </button>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="text-xs font-medium">{sub.title}</span>
                                                                        <span className="py-0.2 rounded border bg-gray-50 px-1 text-[9px] text-gray-400 dark:bg-gray-800">
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
                                                        <div className="pt-2 text-[11px] text-gray-400 italic">
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
                            <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/20 py-16 text-center dark:border-gray-800">
                                <p className="text-sm text-gray-400 italic">No hay ítems en este menú.</p>
                            </div>
                        )}
                    </div>

                    {/* Right side: Add / Edit Link Form */}
                    <div className="lg:col-span-5">
                        <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-[#161615]">
                            <h3 className="flex items-center gap-1.5 border-b border-gray-100 pb-3 text-sm font-semibold dark:border-gray-900">
                                <PlusCircle className="text-primary-700 h-4.5 w-4.5" />
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
                                            className={`rounded-lg border px-3 py-2 text-center text-xs font-semibold transition-colors ${
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
                                            className={`rounded-lg border px-3 py-2 text-center text-xs font-semibold transition-colors ${
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
                                            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-900 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#1f1f1e] dark:text-white"
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
                                        {itemErrors.article_id && <span className="text-xs text-red-500">{itemErrors.article_id}</span>}
                                    </div>
                                )}

                                {/* Parent Item selection (Level 2 nesting) */}
                                <div className="grid gap-1.5">
                                    <Label htmlFor="item-parent">Nivel Padre (Opcional)</Label>
                                    <select
                                        id="item-parent"
                                        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-900 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#1f1f1e] dark:text-white"
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
                                        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-900 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#1f1f1e] dark:text-white"
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
                                        <Button type="button" variant="outline" onClick={() => setItemData(initialItemForm)}>
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
