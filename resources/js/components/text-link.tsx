import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { ComponentProps } from 'react';

type LinkProps = ComponentProps<typeof Link>;

export default function TextLink({ className = '', children, ...props }: LinkProps) {
    return (
        <Link
            className={cn(
                'text-foreground decoration-border-strong hover:text-primary hover:decoration-primary underline underline-offset-4 transition-colors duration-300 ease-out',
                className,
            )}
            {...props}
        >
            {children}
        </Link>
    );
}
