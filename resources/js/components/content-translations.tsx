import { Button } from '@/components/ui/button';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Link, router } from '@inertiajs/react';
import { Languages, Plus } from 'lucide-react';

export interface ContentTranslation {
    id: number;
    iso: string;
    name: string;
    main: boolean;
    /** The language of the item being edited */
    current: boolean;
    /** The item's version in this language, if there is one */
    item: { id: number; title: string; status?: string | null } | null;
}

/**
 * The versions of a page or post in the site's languages: open one, or start the one a
 * language is missing (a draft copy of the saved content). Shows nothing on a site
 * with a single language.
 */
export default function ContentTranslations({
    module,
    translations = [],
    editUrl,
}: {
    module: 'articles' | 'posts';
    translations?: ContentTranslation[];
    editUrl: (id: number) => string;
}) {
    if (translations.length < 2) {
        return null;
    }

    const create = (lang: ContentTranslation) => {
        const own = translations.find((item) => item.current)?.item;
        if (!own) return;
        router.post(route(`${module}.translate`, [own.id, lang.id]));
    };

    return (
        <div className="flex flex-wrap items-center gap-1.5" aria-label={t('Traducciones')}>
            <Languages className="text-muted-foreground h-4 w-4" aria-hidden="true" />
            {translations.map((lang) =>
                lang.current ? (
                    <span
                        key={lang.id}
                        className="bg-primary/10 text-primary rounded-lg px-2 py-1 text-xs font-semibold uppercase"
                        title={t('Editando la versión en :lang', { lang: lang.name })}
                    >
                        {lang.iso}
                    </span>
                ) : lang.item ? (
                    <Link
                        key={lang.id}
                        href={editUrl(lang.item.id)}
                        className={cn(
                            'border-border/70 hover:bg-muted rounded-lg border px-2 py-1 text-xs font-semibold uppercase transition-colors',
                            lang.item.status === 'draft' && 'text-muted-foreground border-dashed',
                        )}
                        title={`${lang.name}: ${lang.item.title}${lang.item.status === 'draft' ? ` (${t('borrador')})` : ''}`}
                    >
                        {lang.iso}
                    </Link>
                ) : (
                    <Button
                        key={lang.id}
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground h-7 gap-1 px-2 text-xs"
                        onClick={() => create(lang)}
                        title={t('Crea una copia en borrador del contenido guardado, para traducirla.')}
                    >
                        <Plus className="h-3.5 w-3.5" />
                        {t('Crear versión en :lang', { lang: lang.name })}
                    </Button>
                ),
            )}
        </div>
    );
}
