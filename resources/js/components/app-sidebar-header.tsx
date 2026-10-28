import AppearanceToggleDropdown from '@/components/appearance-dropdown';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { CommandPalette } from '@/components/command-palette';
import { SiteSwitcher, type SiteSummary } from '@/components/site-switcher';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { t } from '@/lib/i18n';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { usePage } from '@inertiajs/react';
import { ExternalLink, Globe, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    const [commandOpen, setCommandOpen] = useState(false);
    const { site } = usePage<{ site: SiteSummary | null }>().props;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setCommandOpen((prev) => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <>
            <header className="border-sidebar-border/60 bg-background/80 sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b px-4 backdrop-blur-md transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                <div className="flex items-center gap-3">
                    <SidebarTrigger className="text-muted-foreground hover:text-foreground -ml-1" />
                    <div className="bg-border/60 hidden h-4 w-px sm:block" />
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>

                <div className="flex items-center gap-2">
                    {/* Command Palette Trigger */}
                    <button
                        type="button"
                        onClick={() => setCommandOpen(true)}
                        className="border-border/70 bg-muted/40 text-muted-foreground hover:border-border hover:bg-muted/70 hover:text-foreground hidden cursor-pointer items-center gap-2 rounded-xl border px-2.5 py-1 text-xs shadow-2xs transition-all sm:inline-flex"
                    >
                        <Search className="text-muted-foreground h-3.5 w-3.5" />
                        <span>{t('Buscar o saltar a...')}</span>
                        <kbd className="border-border/80 bg-background text-muted-foreground pointer-events-none ml-2 inline-flex h-4.5 items-center gap-0.5 rounded-md border px-1.5 font-mono text-[10px] font-medium select-none">
                            <span>⌘</span>K
                        </kbd>
                    </button>

                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setCommandOpen(true)}
                        className="text-muted-foreground hover:text-foreground h-8 w-8 sm:hidden"
                    >
                        <Search className="h-4 w-4" />
                        <span className="sr-only">{t('Buscar')}</span>
                    </Button>

                    <SiteSwitcher />

                    <Button
                        variant="outline"
                        size="sm"
                        className="border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/50 h-8 gap-1.5 text-xs font-medium shadow-2xs transition-colors"
                        asChild
                    >
                        <a href={site?.url || '/'} target="_blank" rel="noopener noreferrer">
                            <span className="relative flex h-2 w-2">
                                <span className="bg-success absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
                                <span className="bg-success relative inline-flex h-2 w-2 rounded-full" />
                            </span>
                            <Globe className="h-3.5 w-3.5" />
                            <span className="hidden md:inline">{t('Ver Sitio Web')}</span>
                            <ExternalLink className="h-3 w-3 opacity-60" />
                        </a>
                    </Button>

                    <AppearanceToggleDropdown className="text-muted-foreground hover:text-foreground" />
                </div>
            </header>

            <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
        </>
    );
}
