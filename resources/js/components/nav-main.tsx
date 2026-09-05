import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { NavGroup } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { DynamicIcon, IconName } from 'lucide-react/dynamic';

export function NavMain({ items = [] }: { items: NavGroup[] }) {
    const page = usePage();
    const currentUrl = page.url.split('?')[0];

    const isItemActive = (itemUrl: string) => {
        if (itemUrl === '/admin') {
            return currentUrl === '/admin' || currentUrl === '/admin/';
        }
        return currentUrl === itemUrl || currentUrl.startsWith(itemUrl + '/');
    };

    return (
        <div className="space-y-4 px-2 py-2">
            {items.map((menu) => (
                <SidebarGroup key={menu.id} className="p-0">
                    <SidebarGroupLabel className="px-2 text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
                        {menu.title}
                    </SidebarGroupLabel>
                    {menu.items && (
                        <SidebarMenu className="mt-1 space-y-0.5">
                            {menu.items.map((item) => {
                                const active = isItemActive(item.url);
                                return (
                                    <SidebarMenuItem key={item.id}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={active}
                                            className={`group relative flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-xs font-medium transition-all duration-150 ${
                                                active
                                                    ? 'bg-violet-50 text-violet-700 shadow-2xs font-semibold dark:bg-violet-950/40 dark:text-violet-300'
                                                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                                            }`}
                                        >
                                            <Link href={item.url} prefetch>
                                                {active && (
                                                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-violet-600 dark:bg-violet-400" />
                                                )}
                                                {item.icon && (
                                                    <DynamicIcon
                                                        name={item.icon as IconName}
                                                        className={`size-4 transition-colors ${
                                                            active
                                                                ? 'text-violet-600 dark:text-violet-400'
                                                                : 'text-muted-foreground/80 group-hover:text-foreground'
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
                    )}
                </SidebarGroup>
            ))}
        </div>
    );
}

