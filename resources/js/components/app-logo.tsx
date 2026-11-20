import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { type AdminBrand, type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import AppLogoIcon from './app-logo-icon';

/** The client's logo (Configuración > Marca), or null when the panel shows MewCMS's */
export function useBrand(): AdminBrand | null {
    return usePage<SharedData>().props.brand ?? null;
}

/** The name the panel goes by: the client's, or MewCMS */
export function useBrandName(): string {
    return useBrand()?.name ?? 'MewCMS';
}

/** "MewCMS" set in Sora, with "CMS" lighter (public/brand/wordmark-*.svg is the same, as paths) */
export function AppWordmark({ className }: { className?: string }) {
    return (
        <span className={cn('font-brand font-bold tracking-tight', className)}>
            Mew
            <span className="font-medium opacity-60">CMS</span>
        </span>
    );
}

/** The client's wide logo, with its dark-mode version when there is one. Height comes from className. */
export function ClientLogo({ brand, className }: { brand: AdminBrand & { logo: string }; className?: string }) {
    const img = 'block w-auto max-w-full object-contain';

    return (
        <>
            <img src={brand.logo} alt={brand.name} className={cn(img, className, brand.logo_dark && 'dark:hidden')} />
            {brand.logo_dark && <img src={brand.logo_dark} alt={brand.name} className={cn(img, className, 'hidden dark:block')} />}
        </>
    );
}

/** The square mark: the client's icon, the first letter of its name, or MewCMS's cat */
export function BrandIcon({ className }: { className?: string }) {
    const brand = useBrand();
    if (!brand) {
        return <AppLogoIcon className={cn('text-primary', className)} />;
    }
    if (brand.icon) {
        return <img src={brand.icon} alt="" className={cn('object-contain', className)} />;
    }

    return (
        <span
            aria-hidden="true"
            className={cn('bg-primary text-primary-foreground flex items-center justify-center rounded-lg text-sm font-bold', className)}
        >
            {brand.name.trim().charAt(0).toUpperCase()}
        </span>
    );
}

/**
 * The mark with the name to its right and the subtitle under it: the client's icon, name and
 * subtitle when set, or MewCMS's cat, wordmark and "Content Studio". The sidebar and the
 * login screen both use it, at two sizes.
 */
export function NameLockup({ size = 'md', className }: { size?: 'md' | 'lg'; className?: string }) {
    const brand = useBrand();
    const lg = size === 'lg';
    const mark = lg ? 'size-11' : 'size-8';
    const name = lg ? 'text-xl leading-none' : 'text-[15px] leading-none';
    const sub = lg ? 'mt-1.5 text-xs leading-none' : 'mt-1 text-[11px] leading-none';

    return (
        <span className={cn('flex min-w-0 items-center', lg ? 'gap-3' : 'gap-2.5', className)}>
            {brand ? (
                <BrandIcon className={cn('shrink-0', mark, lg && 'rounded-xl text-lg')} />
            ) : (
                <AppLogoIcon className={cn('text-iris dark:text-iris-dark shrink-0', mark)} />
            )}
            <span className="grid min-w-0 text-left leading-none">
                {brand ? (
                    <span className={cn('text-foreground truncate font-bold tracking-tight', name)}>{brand.name}</span>
                ) : (
                    <AppWordmark className={cn('text-foreground', name)} />
                )}
                {(brand ? brand.tagline : t('Content Studio')) && (
                    <span className={cn('text-muted-foreground truncate font-medium', sub)}>{brand ? brand.tagline : t('Content Studio')}</span>
                )}
            </span>
        </span>
    );
}

/** The logo on the auth screens: the client's wide logo when set, else the same lockup as the sidebar */
export function BrandLockup({ className }: { className?: string }) {
    const brand = useBrand();
    if (brand?.logo) {
        return (
            <span className={cn('flex justify-center', className)}>
                <ClientLogo brand={{ ...brand, logo: brand.logo }} className="max-h-14 max-w-56" />
            </span>
        );
    }

    return <NameLockup size="lg" className={cn('inline-flex', className)} />;
}

/** Small "Powered by MewCMS" line, shown when the client's logo replaces MewCMS's */
export function PoweredByMewCMS({ className }: { className?: string }) {
    return (
        <a
            href="https://mewcms.com"
            target="_blank"
            rel="noopener noreferrer"
            className={cn('text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs transition-colors', className)}
        >
            <span>{t('Con tecnología de')}</span>
            <AppLogoIcon className="text-iris dark:text-iris-dark size-4" />
            <AppWordmark className="text-foreground/80 text-xs" />
        </a>
    );
}

/** The sidebar's logo: the client's when set (its icon when the sidebar is collapsed), or MewCMS's */
export default function AppLogo() {
    const brand = useBrand();

    if (brand?.logo) {
        return (
            <div className="flex min-w-0 flex-1 items-center">
                <BrandIcon className="hidden size-8 shrink-0 group-data-[collapsible=icon]:flex" />
                <span className="flex h-10 min-w-0 flex-1 items-center group-data-[collapsible=icon]:hidden">
                    <ClientLogo brand={{ ...brand, logo: brand.logo }} className="max-h-10" />
                </span>
            </div>
        );
    }
    // A square or tall logo goes in as the icon, next to the name set as text; or MewCMS's own
    return <NameLockup className="flex-1" />;
}
