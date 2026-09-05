import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <div className="flex items-center gap-3">
            <div className="flex aspect-square size-8.5 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 text-white shadow-md shadow-indigo-500/20 ring-1 ring-white/20 transition-transform duration-200 group-hover:scale-105">
                <AppLogoIcon className="size-4.5 fill-current text-white drop-shadow-xs" />
            </div>
            <div className="grid flex-1 text-left leading-none">
                <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm tracking-tight text-neutral-900 dark:text-neutral-100">MewCMS</span>
                    <span className="rounded-full bg-violet-100 dark:bg-violet-950/60 px-1.5 py-0.5 text-[9px] font-semibold text-violet-700 dark:text-violet-300 ring-1 ring-violet-500/20">
                        PRO
                    </span>
                </div>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">Content Studio</span>
            </div>
        </div>
    );
}

