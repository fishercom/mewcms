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

/** Mark + wordmark, for places outside the admin shell (auth screens): the client's logo when set */
export function BrandLockup({ className, stacked = false }: { className?: string; stacked?: boolean }) {
    const brand = useBrand();
    if (brand?.logo) {
        return (
            <span className={cn('flex justify-center', className)}>
                <ClientLogo brand={{ ...brand, logo: brand.logo }} className={stacked ? 'max-h-16 max-w-56' : 'max-h-10 max-w-48'} />
            </span>
        );
    }
    if (brand) {
        // A square or tall logo: the icon, with the name set as text
        return (
            <span className={cn('inline-flex items-center', stacked ? 'flex-col gap-3' : 'gap-2.5', className)}>
                <BrandIcon className={cn('shrink-0', stacked ? 'size-16 rounded-xl text-2xl' : 'size-9')} />
                <span className={cn('text-foreground font-bold tracking-tight', stacked ? 'text-xl' : 'text-lg')}>{brand.name}</span>
            </span>
        );
    }

    return (
        <span className={cn('inline-flex items-center', stacked ? 'flex-col gap-2' : 'gap-2', className)}>
            <AppLogoIcon className={cn('text-iris dark:text-iris-dark shrink-0', stacked ? 'size-12' : 'size-8')} />
            <AppWordmark className={stacked ? 'text-xl' : 'text-lg'} />
        </span>
    );
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
    if (brand) {
        // A square or tall logo goes in as the icon, next to the name set as text
        return (
            <div className="flex min-w-0 items-center gap-2.5">
                <BrandIcon className="size-8 shrink-0" />
                <div className="grid min-w-0 flex-1 text-left leading-none">
                    <span className="text-foreground truncate text-[15px] font-bold tracking-tight">{brand.name}</span>
                    {brand.tagline && <span className="text-muted-foreground mt-1 truncate text-[11px] font-medium">{brand.tagline}</span>}
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2.5">
            {/* Collapsed sidebar shows only this */}
            <AppLogoIcon className="text-primary size-8 shrink-0 transition-transform duration-200 group-hover:scale-105" />
            <div className="grid flex-1 text-left leading-none">
                <div className="flex items-center gap-1.5">
                    <AppWordmark className="text-foreground text-[15px]" />
                    <span className="bg-primary-soft text-primary ring-primary/20 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ring-1">
                        PRO
                    </span>
                </div>
                <span className="text-muted-foreground mt-0.5 text-[11px] font-medium">{t('Content Studio')}</span>
            </div>
        </div>
    );
}
