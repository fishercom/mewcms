import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import AppLogoIcon from './app-logo-icon';

/** "MewCMS" set in Sora, with "CMS" lighter */
export function AppWordmark({ className }: { className?: string }) {
    return (
        <span className={cn('font-brand font-bold tracking-tight', className)}>
            Mew
            <span className="font-medium opacity-60">CMS</span>
        </span>
    );
}

/** Mark + wordmark, for places outside the admin shell (auth screens, public site) */
export function BrandLockup({ className, stacked = false }: { className?: string; stacked?: boolean }) {
    return (
        <span className={cn('inline-flex items-center', stacked ? 'flex-col gap-2' : 'gap-2', className)}>
            <AppLogoIcon className={cn('text-iris dark:text-iris-dark shrink-0', stacked ? 'size-12' : 'size-8')} />
            <AppWordmark className={stacked ? 'text-xl' : 'text-lg'} />
        </span>
    );
}

export default function AppLogo() {
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
