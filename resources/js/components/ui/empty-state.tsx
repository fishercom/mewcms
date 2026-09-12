import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { type LucideIcon } from 'lucide-react';
import React from 'react';

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description: string;
    action?: {
        label: string;
        href?: string;
        onClick?: () => void;
        icon?: LucideIcon;
    };
    className?: string;
    children?: React.ReactNode;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    className,
    children,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/20 p-8 text-center transition-all sm:p-12',
                className,
            )}
        >
            {Icon && (
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground shadow-2xs dark:bg-muted/30">
                    <Icon className="h-7 w-7 stroke-[1.5]" />
                </div>
            )}

            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">{description}</p>

            {action && (
                <div className="mt-6">
                    {action.href ? (
                        <Button asChild size="sm" className="h-9 gap-1.5 rounded-xl px-4 text-xs font-semibold shadow-2xs">
                            <Link href={action.href}>
                                {action.icon && <action.icon className="h-3.5 w-3.5" />}
                                <span>{action.label}</span>
                            </Link>
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            onClick={action.onClick}
                            className="h-9 gap-1.5 rounded-xl px-4 text-xs font-semibold shadow-2xs"
                        >
                            {action.icon && <action.icon className="h-3.5 w-3.5" />}
                            <span>{action.label}</span>
                        </Button>
                    )}
                </div>
            )}

            {children}
        </div>
    );
}
