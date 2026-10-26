import { cn } from '@/lib/utils';
import { Pagination } from '@/types';
import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import * as React from 'react';

interface PaginationNavProps<T> extends React.ComponentPropsWithoutRef<'nav'> {
    data: Pagination<T>;
}

const itemClass =
    'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-primary/40 relative flex h-9 min-w-9 items-center justify-center border px-3 text-sm transition-colors focus-visible:z-10 focus-visible:ring-2 focus-visible:outline-none';

/**
 * Admin list pagination. Laravel's own "previous" and "next" entries are always the first
 * and last links (their labels depend on the locale), so they are replaced by the arrows.
 */
function PaginationNav<T>({ data: items, className, ...props }: PaginationNavProps<T>) {
    const pages = items.links.slice(1, -1);

    return (
        <nav
            className={cn('flex flex-col items-start justify-between gap-3 p-4 md:flex-row md:items-center', className)}
            aria-label="Paginación"
            {...props}
        >
            <span className="text-muted-foreground text-sm">
                Página <span className="text-foreground font-semibold">{items.current_page}</span> de{' '}
                <span className="text-foreground font-semibold">{items.last_page}</span>
            </span>
            <ul className="inline-flex items-stretch -space-x-px">
                <li>
                    <PageLink href={items.prev_page_url} className="rounded-l-lg px-2.5" label="Página anterior">
                        <ChevronLeft className="h-4 w-4" />
                    </PageLink>
                </li>
                {pages.map((link, index) => (
                    <li key={index}>
                        {link.url ? (
                            <Link
                                href={link.url}
                                preserveScroll
                                aria-current={link.active ? 'page' : undefined}
                                className={cn(
                                    itemClass,
                                    link.active && 'border-primary bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground z-10',
                                )}
                            >
                                {link.label}
                            </Link>
                        ) : (
                            // "…" between page ranges
                            <span className={cn(itemClass, 'hover:bg-card hover:text-muted-foreground')}>{link.label}</span>
                        )}
                    </li>
                ))}
                <li>
                    <PageLink href={items.next_page_url} className="rounded-r-lg px-2.5" label="Página siguiente">
                        <ChevronRight className="h-4 w-4" />
                    </PageLink>
                </li>
            </ul>
        </nav>
    );
}

function PageLink({ href, className, label, children }: { href?: string | null; className: string; label: string; children: React.ReactNode }) {
    if (!href) {
        return (
            <span
                className={cn(itemClass, 'hover:bg-card hover:text-muted-foreground cursor-not-allowed opacity-50', className)}
                aria-disabled="true"
                aria-label={label}
            >
                {children}
            </span>
        );
    }

    return (
        <Link href={href} preserveScroll className={cn(itemClass, className)} aria-label={label}>
            {children}
        </Link>
    );
}

export { PaginationNav };
