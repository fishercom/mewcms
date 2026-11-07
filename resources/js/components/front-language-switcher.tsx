import { useTexts } from '@/lib/theme-texts';
import { cn } from '@/lib/utils';
import { usePage } from '@inertiajs/react';

export interface Alternate {
    iso: string;
    name: string;
    url: string;
    current: boolean;
    /** The page has no version in that language: the link goes to that language's home */
    missing: boolean;
}

/**
 * Links to the page being shown in the site's other languages (or to their home page
 * when it has no version there). Shows nothing on a site with a single language.
 *
 * Plain links, not Inertia visits: each language is a full page load, with its own
 * <html lang> and texts.
 */
export function LanguageSwitcher({ className, linkClassName }: { className?: string; linkClassName?: string }) {
    const { alternates = [] } = usePage<{ alternates?: Alternate[] }>().props;
    const { t } = useTexts();

    if (alternates.length < 2) {
        return null;
    }

    return (
        <nav aria-label={t('nav.language')} className={cn('flex items-center gap-1 text-xs font-semibold tracking-wide uppercase', className)}>
            {alternates.map((alternate, index) => (
                <span key={alternate.iso} className="flex items-center gap-1">
                    {index > 0 && (
                        <span aria-hidden="true" className="opacity-40">
                            /
                        </span>
                    )}
                    {alternate.current ? (
                        <span aria-current="true" title={alternate.name} className={cn('px-0.5', linkClassName)}>
                            {alternate.iso}
                        </span>
                    ) : (
                        <a
                            href={alternate.url}
                            hrefLang={alternate.iso}
                            lang={alternate.iso}
                            title={alternate.name}
                            className={cn('px-0.5 opacity-60 transition-opacity hover:opacity-100', linkClassName)}
                        >
                            {alternate.iso}
                        </a>
                    )}
                </span>
            ))}
        </nav>
    );
}
