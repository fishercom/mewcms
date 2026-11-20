import { t } from '@/lib/i18n';
import { useBrand } from './app-logo';

/**
 * The admin's footer: the CMS name, its license and a link to the project site.
 * With the client's logo (Configuración > Marca), the client's name comes first and MewCMS is credited.
 */
export function AppFooter() {
    const brand = useBrand();

    return (
        <footer className="text-muted-foreground mt-auto flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-t px-4 py-3 text-xs">
            {brand ? (
                <>
                    <span>
                        © {new Date().getFullYear()} {brand.name}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{t('Con tecnología de MewCMS')}</span>
                </>
            ) : (
                <span>© {new Date().getFullYear()} MewCMS</span>
            )}
            <span aria-hidden="true">·</span>
            <a
                href="https://github.com/fishercom/mewcms/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground underline-offset-4 hover:underline"
            >
                {t('AGPL v3 License')}
            </a>
            <span aria-hidden="true">·</span>
            <a
                href="https://mewcms.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground underline-offset-4 hover:underline"
            >
                mewcms.com
            </a>
        </footer>
    );
}
