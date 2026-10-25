import { SidebarInset } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import * as React from 'react';

interface AppContentProps extends React.ComponentProps<'main'> {
    variant?: 'header' | 'sidebar';
}

export function AppContent({ variant = 'header', children, ...props }: AppContentProps) {
    if (variant === 'sidebar') {
        // min-w-0 lets wide tables scroll inside their own wrapper instead of widening the page
        return (
            <SidebarInset {...props} className={cn('min-w-0', props.className)}>
                {children}
            </SidebarInset>
        );
    }

    return (
        <main className="mx-auto flex h-full w-full max-w-7xl min-w-0 flex-1 flex-col gap-4 rounded-xl" {...props}>
            {children}
        </main>
    );
}
