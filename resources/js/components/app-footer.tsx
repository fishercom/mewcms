import { t } from '@/lib/i18n';
import { useBrand } from './app-logo';

const link = 'hover:text-foreground underline-offset-4 hover:underline';

function MewCMSLink() {
    return (
        <a href="https://mewcms.com" target="_blank" rel="noopener noreferrer" className={link}>
            MewCMS
        </a>
    );
}

/**
 * The admin's footer, one short line. With the client's brand (Settings > Marca del panel):
 * "© 2026 Client · Powered by MewCMS"; without it: "© 2026 MewCMS · AGPL v3 License".
 * "MewCMS" links to the project site.
 */
export function AppFooter() {
    const brand = useBrand();
    const year = new Date().getFullYear();

    return (
        <footer className="text-muted-foreground mt-auto flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-t px-4 py-3 text-xs">
            {brand ? (
                <>
                    <span>
                        © {year} {brand.name}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                        {t('Con tecnología de')} <MewCMSLink />
                    </span>
                </>
            ) : (
                <>
                    <span>
                        © {year} <MewCMSLink />
                    </span>
                    <span aria-hidden="true">·</span>
                    <a href="https://github.com/fishercom/mewcms/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className={link}>
                        {t('AGPL v3 License')}
                    </a>
                </>
            )}
        </footer>
    );
}
