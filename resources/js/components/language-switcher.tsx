import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { t } from '@/lib/i18n';
import { switchLanguage } from '@/services/sites';
import { usePage } from '@inertiajs/react';
import { Check, ChevronsUpDown, Languages } from 'lucide-react';

export interface SiteLanguage {
    id: number;
    iso: string;
    name: string;
    /** "" for the main language, "/en" for an extra one */
    prefix: string;
    main: boolean;
}

/**
 * Picks the language the admin edits on a site with several languages: page and post
 * lists, editors and the theme texts show that language's content.
 */
export function LanguageSwitcher() {
    const { site } = usePage<{ site: { locale?: string | null; languages?: SiteLanguage[] } | null }>().props;
    const languages = site?.languages ?? [];

    if (languages.length < 2) {
        return null;
    }

    const current = languages.find((lang) => lang.iso === site?.locale) ?? languages[0];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="border-border/70 text-muted-foreground hover:text-foreground h-8 gap-1.5 text-xs font-medium shadow-2xs"
                    title={t('Idioma que editas')}
                >
                    <Languages className="h-3.5 w-3.5 shrink-0" />
                    <span className="uppercase">{current.iso}</span>
                    <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-60" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-52">
                <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">{t('Editar en')}</DropdownMenuLabel>
                {languages.map((lang) => (
                    <DropdownMenuItem key={lang.id} onClick={() => lang.id !== current.id && switchLanguage(lang.id)}>
                        <span className="flex w-full items-center gap-2">
                            <span className="truncate">{lang.name}</span>
                            <span className="text-muted-foreground text-xs">{lang.main ? t('principal') : lang.prefix}</span>
                            {lang.id === current.id && <Check className="ml-auto h-4 w-4" />}
                        </span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

/**
 * The same choice as the header's language switcher, as a filter above a list (pages,
 * posts, theme texts): one button per language of the site.
 */
export function LanguageFilter() {
    const { site } = usePage<{ site: { locale?: string | null; languages?: SiteLanguage[] } | null }>().props;
    const languages = site?.languages ?? [];

    if (languages.length < 2) {
        return null;
    }

    const current = languages.find((lang) => lang.iso === site?.locale) ?? languages[0];

    return (
        <div className="border-border/70 flex items-center gap-0.5 rounded-lg border p-0.5" role="group" aria-label={t('Idioma')}>
            <Languages className="text-muted-foreground mx-1.5 h-3.5 w-3.5" aria-hidden="true" />
            {languages.map((lang) => (
                <Button
                    key={lang.id}
                    type="button"
                    size="sm"
                    variant={lang.id === current.id ? 'secondary' : 'ghost'}
                    aria-pressed={lang.id === current.id}
                    className="h-7 px-2.5 text-xs"
                    onClick={() => lang.id !== current.id && switchLanguage(lang.id)}
                >
                    {lang.name}
                </Button>
            ))}
        </div>
    );
}
