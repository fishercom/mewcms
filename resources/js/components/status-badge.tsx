import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

type Status = 'published' | 'draft' | 'scheduled';

const STYLES: Record<Status, { label: string; className: string; dot: string }> = {
    published: { label: t('Publicado'), className: 'bg-success-soft text-success', dot: 'bg-success' },
    draft: { label: t('Borrador'), className: 'bg-warning-soft text-warning', dot: 'bg-warning' },
    scheduled: { label: t('Programado'), className: 'bg-primary-soft text-primary-soft-foreground', dot: 'bg-primary' },
};

/**
 * Publication state of a page or post, the same everywhere in the admin.
 */
export function StatusBadge({ status, title, className }: { status: Status; title?: string; className?: string }) {
    const style = STYLES[status];

    return (
        <span
            title={title}
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
                style.className,
                className,
            )}
        >
            <span className={cn('h-1.5 w-1.5 rounded-full', style.dot)} aria-hidden />
            {style.label}
        </span>
    );
}
