import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <div className="flex items-center gap-3">
            <div className="from-primary via-primary to-primary shadow-primary/20 flex aspect-square size-8.5 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md ring-1 ring-white/20 transition-transform duration-200 group-hover:scale-105">
                <AppLogoIcon className="size-4.5 fill-current text-white drop-shadow-xs" />
            </div>
            <div className="grid flex-1 text-left leading-none">
                <div className="flex items-center gap-1.5">
                    <span className="text-foreground text-sm font-bold tracking-tight">MewCMS</span>
                    <span className="bg-primary-soft text-primary ring-primary/20 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ring-1">
                        PRO
                    </span>
                </div>
                <span className="text-muted-foreground text-[11px] font-medium">Content Studio</span>
            </div>
        </div>
    );
}
