import { NavGroup, NavItem, SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react';
import * as Dialog from '@radix-ui/react-dialog';
import {
    ArrowRight,
    ExternalLink,
    FilePlus,
    Globe,
    Menu as MenuIcon,
    PenTool,
    PlusCircle,
    Search,
    Sliders,
    X,
} from 'lucide-react';
import { DynamicIcon, IconName } from 'lucide-react/dynamic';
import React, { useEffect, useMemo, useRef, useState } from 'react';

interface QuickAction {
    id: string;
    title: string;
    description: string;
    url: string;
    icon: React.ComponentType<{ className?: string }>;
    external?: boolean;
}

const defaultActions: QuickAction[] = [
    {
        id: 'create-article',
        title: 'Crear nueva Página',
        description: 'Redactar una nueva página en el CMS',
        url: '/admin/articles/create',
        icon: FilePlus,
    },
    {
        id: 'create-post',
        title: 'Crear nuevo Post',
        description: 'Publicar una nueva entrada de blog o noticia',
        url: '/admin/posts/create',
        icon: PenTool,
    },
    {
        id: 'create-menu',
        title: 'Crear nuevo Menú',
        description: 'Configurar un nuevo menú de navegación',
        url: '/admin/menus/create',
        icon: MenuIcon,
    },
    {
        id: 'customize-layout',
        title: 'Personalizar Layout',
        description: 'Ajustar logos, colores, redes sociales y footer',
        url: '/admin/layout',
        icon: Sliders,
    },
    {
        id: 'view-site',
        title: 'Ver Sitio Web',
        description: 'Abrir el sitio público en una nueva pestaña',
        url: '/',
        icon: Globe,
        external: true,
    },
];

interface CommandPaletteProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
    const page = usePage<SharedData>();
    const pagePropsMenu = page.props.adm_menu;
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    // Extract all navigation items across all groups
    const allModules: (NavItem & { groupTitle: string })[] = useMemo(() => {
        const admMenu = (pagePropsMenu as NavGroup[]) || [];
        const list: (NavItem & { groupTitle: string })[] = [];
        for (const group of admMenu) {
            if (group.items) {
                for (const item of group.items) {
                    list.push({ ...item, groupTitle: group.title });
                }
            }
        }
        return list;
    }, [pagePropsMenu]);

    // Filter items based on query
    const filteredActions = useMemo(() => {
        if (!query.trim()) return defaultActions;
        const q = query.toLowerCase();
        return defaultActions.filter(
            (act) => act.title.toLowerCase().includes(q) || act.description.toLowerCase().includes(q),
        );
    }, [query]);

    const filteredModules = useMemo(() => {
        if (!query.trim()) return allModules;
        const q = query.toLowerCase();
        return allModules.filter(
            (mod) =>
                mod.title.toLowerCase().includes(q) ||
                (mod.description && mod.description.toLowerCase().includes(q)) ||
                mod.url.toLowerCase().includes(q) ||
                mod.groupTitle.toLowerCase().includes(q),
        );
    }, [query, allModules]);

    const totalResults = filteredActions.length + filteredModules.length;

    // Reset selected index when query changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    // Focus input on open
    useEffect(() => {
        if (open) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [open]);

    const handleSelect = (item: { url: string; external?: boolean }) => {
        onOpenChange(false);
        if (item.external) {
            window.open(item.url, '_blank');
        } else {
            router.visit(item.url);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => (totalResults > 0 ? (prev + 1) % totalResults : 0));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => (totalResults > 0 ? (prev - 1 + totalResults) % totalResults : 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex < filteredActions.length) {
                handleSelect(filteredActions[selectedIndex]);
            } else {
                const modIndex = selectedIndex - filteredActions.length;
                if (filteredModules[modIndex]) {
                    handleSelect(filteredModules[modIndex]);
                }
            }
        }
    };

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-opacity duration-150 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
                <Dialog.Content
                    onKeyDown={handleKeyDown}
                    className="fixed left-1/2 top-[16%] z-50 w-full max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border border-border/70 bg-background/95 p-0 shadow-2xl backdrop-blur-xl transition-all duration-150 focus:outline-hidden data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
                >
                    <Dialog.Title className="sr-only">Paleta de Comandos</Dialog.Title>
                    <Dialog.Description className="sr-only">Buscar páginas, posts, menús y acciones en MewCMS</Dialog.Description>

                    {/* Search Input Box */}
                    <div className="relative flex items-center border-b border-border/60 px-4 py-3">
                        <Search className="mr-3 h-5 w-5 text-muted-foreground" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar sección, acción o atajo en MewCMS..."
                            className="w-full bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground/70 focus:outline-hidden"
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={() => setQuery('')}
                                className="mr-2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                        <span className="rounded-md border border-border/70 bg-muted/60 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                            ESC
                        </span>
                    </div>

                    {/* Results List */}
                    <div className="max-h-80 overflow-y-auto p-2">
                        {totalResults === 0 ? (
                            <div className="py-10 text-center text-xs text-muted-foreground">
                                No se encontraron resultados para &ldquo;<span className="text-foreground font-medium">{query}</span>&rdquo;
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {/* Quick Actions */}
                                {filteredActions.length > 0 && (
                                    <div>
                                        <div className="px-2 py-1 text-[10px] font-bold tracking-wider text-muted-foreground/70 uppercase">
                                            Acciones Rápidas
                                        </div>
                                        <div className="mt-1 space-y-0.5">
                                            {filteredActions.map((action, idx) => {
                                                const isSelected = selectedIndex === idx;
                                                const ActionIcon = action.icon;
                                                return (
                                                    <div
                                                        key={action.id}
                                                        onClick={() => handleSelect(action)}
                                                        onMouseEnter={() => setSelectedIndex(idx)}
                                                        className={`flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-xs transition-colors ${
                                                            isSelected
                                                                ? 'bg-violet-600 text-white shadow-xs'
                                                                : 'text-foreground hover:bg-muted/60'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2.5">
                                                            <div
                                                                className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                                                                    isSelected
                                                                        ? 'bg-white/20 text-white'
                                                                        : 'bg-muted text-muted-foreground'
                                                                }`}
                                                            >
                                                                <ActionIcon className="h-3.5 w-3.5" />
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold">{action.title}</p>
                                                                <p
                                                                    className={`text-[11px] ${
                                                                        isSelected ? 'text-white/80' : 'text-muted-foreground'
                                                                    }`}
                                                                >
                                                                    {action.description}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {action.external ? (
                                                            <ExternalLink
                                                                className={`h-3.5 w-3.5 opacity-60 ${
                                                                    isSelected ? 'text-white' : 'text-muted-foreground'
                                                                }`}
                                                            />
                                                        ) : (
                                                            <ArrowRight
                                                                className={`h-3.5 w-3.5 ${
                                                                    isSelected ? 'text-white' : 'text-muted-foreground/50'
                                                                }`}
                                                            />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Navigation Modules */}
                                {filteredModules.length > 0 && (
                                    <div>
                                        <div className="px-2 py-1 text-[10px] font-bold tracking-wider text-muted-foreground/70 uppercase">
                                            Módulos del Sistema
                                        </div>
                                        <div className="mt-1 space-y-0.5">
                                            {filteredModules.map((mod, idx) => {
                                                const globalIndex = filteredActions.length + idx;
                                                const isSelected = selectedIndex === globalIndex;
                                                return (
                                                    <div
                                                        key={`${mod.id}-${mod.url}`}
                                                        onClick={() => handleSelect(mod)}
                                                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                                                        className={`flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-xs transition-colors ${
                                                            isSelected
                                                                ? 'bg-violet-600 text-white shadow-xs'
                                                                : 'text-foreground hover:bg-muted/60'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2.5">
                                                            <div
                                                                className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                                                                    isSelected
                                                                        ? 'bg-white/20 text-white'
                                                                        : 'bg-muted text-muted-foreground'
                                                                }`}
                                                            >
                                                                {mod.icon ? (
                                                                    <DynamicIcon
                                                                        name={mod.icon as IconName}
                                                                        className="h-3.5 w-3.5"
                                                                    />
                                                                ) : (
                                                                    <PlusCircle className="h-3.5 w-3.5" />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold">{mod.title}</p>
                                                                <p
                                                                    className={`text-[11px] ${
                                                                        isSelected ? 'text-white/80' : 'text-muted-foreground'
                                                                    }`}
                                                                >
                                                                    {mod.groupTitle} &bull; {mod.url}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <ArrowRight
                                                            className={`h-3.5 w-3.5 ${
                                                                isSelected ? 'text-white' : 'text-muted-foreground/50'
                                                            }`}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer shortcuts hint */}
                    <div className="flex items-center justify-between border-t border-border/60 bg-muted/30 px-4 py-2 text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                                <kbd className="rounded bg-background px-1.5 py-0.5 border border-border/70 font-mono text-[10px]">
                                    ↑
                                </kbd>
                                <kbd className="rounded bg-background px-1.5 py-0.5 border border-border/70 font-mono text-[10px]">
                                    ↓
                                </kbd>
                                Navegar
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="rounded bg-background px-1.5 py-0.5 border border-border/70 font-mono text-[10px]">
                                    ↵
                                </kbd>
                                Seleccionar
                            </span>
                        </div>
                        <span>MewCMS Quick Navigator</span>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
