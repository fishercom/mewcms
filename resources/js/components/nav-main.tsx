import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { NavGroup } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { DynamicIcon, IconName } from 'lucide-react/dynamic';
import { useEffect, useState } from 'react';

/** Which menu sections the user left open or closed, kept between visits */
const STORAGE_KEY = 'admin-menu-sections';

type SectionState = Record<string, boolean>;

function readSections(): SectionState {
    if (typeof window === 'undefined') return {};
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') ?? {};
    } catch {
        return {};
    }
}

function writeSections(state: SectionState) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        // Private mode or blocked storage: the menu still works, it just forgets
    }
}

export function NavMain({ items = [] }: { items: NavGroup[] }) {
    const page = usePage();
    const currentUrl = page.url.split('?')[0];
    const { state, isMobile } = useSidebar();
    // With the sidebar folded to icons there are no section titles to click, so every icon stays visible
    const iconOnly = state === 'collapsed' && !isMobile;

    const isItemActive = (itemUrl: string) => {
        if (itemUrl === '/admin') {
            return currentUrl === '/admin' || currentUrl === '/admin/';
        }
        return currentUrl === itemUrl || currentUrl.startsWith(itemUrl + '/');
    };

    const activeGroupId = items.find((menu) => menu.items?.some((item) => isItemActive(item.url)))?.id;

    // Sections start closed, except the one holding the current page and any the user opened before
    const [sections, setSections] = useState<SectionState>(() => {
        const saved = readSections();
        return activeGroupId != null ? { ...saved, [activeGroupId]: true } : saved;
    });

    // Moving to a page in another section opens that section
    useEffect(() => {
        if (activeGroupId == null) return;
        setSections((prev) => (prev[activeGroupId] ? prev : { ...prev, [activeGroupId]: true }));
    }, [activeGroupId]);

    const toggleSection = (id: NavGroup['id'], open: boolean) => {
        setSections((prev) => ({ ...prev, [id]: open }));
        // Only what the user clicks is remembered; the section opened for the current page is not
        writeSections({ ...readSections(), [id]: open });
    };

    return (
        <div className="space-y-2 px-2 py-2">
            {items.map((menu) => (
                <Collapsible
                    key={menu.id}
                    open={iconOnly || !!sections[menu.id]}
                    onOpenChange={(open) => toggleSection(menu.id, open)}
                    className="group/section"
                >
                    <SidebarGroup className="p-0">
                        <SidebarGroupLabel
                            asChild
                            className="text-muted-foreground/70 hover:text-foreground hover:bg-muted/50 w-full cursor-pointer px-2 text-[11px] font-semibold tracking-wider uppercase"
                        >
                            <CollapsibleTrigger disabled={iconOnly}>
                                <span className="truncate">{menu.title}</span>
                                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/section:rotate-90" />
                            </CollapsibleTrigger>
                        </SidebarGroupLabel>
                        {menu.items && (
                            <CollapsibleContent>
                                <SidebarMenu className="mt-1 space-y-0.5">
                                    {menu.items.map((item) => {
                                        const active = isItemActive(item.url);
                                        return (
                                            <SidebarMenuItem key={item.id}>
                                                <SidebarMenuButton
                                                    asChild
                                                    isActive={active}
                                                    tooltip={item.title}
                                                    className={`group relative flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-xs font-medium transition-all duration-150 ${
                                                        active
                                                            ? 'bg-primary-soft text-primary font-semibold shadow-2xs'
                                                            : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                                                    }`}
                                                >
                                                    <Link href={item.url} prefetch>
                                                        {active && (
                                                            <span className="bg-primary absolute top-1.5 bottom-1.5 left-0 w-1 rounded-r-full" />
                                                        )}
                                                        {item.icon && (
                                                            <DynamicIcon
                                                                name={item.icon as IconName}
                                                                className={`size-4 transition-colors ${
                                                                    active ? 'text-primary' : 'text-muted-foreground/80 group-hover:text-foreground'
                                                                }`}
                                                            />
                                                        )}
                                                        <span className="truncate">{item.title}</span>
                                                    </Link>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        );
                                    })}
                                </SidebarMenu>
                            </CollapsibleContent>
                        )}
                    </SidebarGroup>
                </Collapsible>
            ))}
        </div>
    );
}
