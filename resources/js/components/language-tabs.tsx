import { changeLocale, getLocale, Locale, LOCALES } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

export default function LanguageTabs({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
    const current = getLocale();

    return (
        <div className={cn('bg-muted inline-flex gap-1 rounded-lg p-1', className)} {...props}>
            {(Object.entries(LOCALES) as [Locale, string][]).map(([value, label]) => (
                <button
                    key={value}
                    onClick={() => value !== current && changeLocale(value)}
                    className={cn(
                        'flex items-center rounded-md px-3.5 py-1.5 transition-colors',
                        current === value ? 'bg-card shadow-xs' : 'text-muted-foreground hover:bg-muted/60 hover:text-black',
                    )}
                >
                    <span className="text-sm">{label}</span>
                </button>
            ))}
        </div>
    );
}
