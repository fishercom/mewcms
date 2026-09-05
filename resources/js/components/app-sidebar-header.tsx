import AppearanceToggleDropdown from '@/components/appearance-dropdown';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { ExternalLink, Globe } from 'lucide-react';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    return (
        <header className="border-sidebar-border/60 bg-background/80 backdrop-blur-md sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-3">
                <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
                <div className="h-4 w-px bg-border/60 hidden sm:block" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>

            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 border-border/70 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shadow-2xs"
                    asChild
                >
                    <a href="/" target="_blank" rel="noopener noreferrer">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        <Globe className="h-3.5 w-3.5" />
                        <span className="hidden md:inline">Ver Sitio Web</span>
                        <ExternalLink className="h-3 w-3 opacity-60" />
                    </a>
                </Button>

                <AppearanceToggleDropdown className="text-muted-foreground hover:text-foreground" />
            </div>
        </header>
    );
}

