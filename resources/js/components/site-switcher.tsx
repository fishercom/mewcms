import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { t } from '@/lib/i18n';
import { switchSite } from '@/services/sites';
import { usePage } from '@inertiajs/react';
import { Check, ChevronsUpDown, LayoutGrid } from 'lucide-react';

export interface SiteSummary {
    id: number;
    name: string;
    active?: boolean;
    url?: string;
}

/**
 * Picks the site the admin works on. Content lists and editors show only that site's
 * pages, posts, menus, forms, sliders, redirects and layout settings.
 */
export function SiteSwitcher() {
    const { site, sites } = usePage<{ site: SiteSummary | null; sites: SiteSummary[] }>().props;

    // Nothing to switch between on a single-site install
    if (!site || !sites || sites.length < 2) {
        return null;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="border-border/70 text-muted-foreground hover:text-foreground h-8 max-w-48 gap-1.5 text-xs font-medium shadow-2xs"
                >
                    <LayoutGrid className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{site.name}</span>
                    <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-60" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-52">
                <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">{t('Trabajar en el sitio')}</DropdownMenuLabel>
                {sites.map((item) => (
                    <DropdownMenuItem key={item.id} onClick={() => item.id !== site.id && switchSite(item.id)}>
                        <span className="flex w-full items-center gap-2">
                            <span className={item.active === false ? 'text-muted-foreground truncate line-through' : 'truncate'}>{item.name}</span>
                            {item.id === site.id && <Check className="ml-auto h-4 w-4" />}
                        </span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
