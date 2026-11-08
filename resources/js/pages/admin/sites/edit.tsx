import FormLayout from '@/layouts/module/Form';
import ModuleLayout from '@/layouts/module/layout';
import { Link, usePage } from '@inertiajs/react';
import { Languages } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import { Button } from '@/components/ui/button';
import { t } from '@/lib/i18n';
import { updateSite } from '@/services/sites';
import { CmsSite, CmsSiteForm, CmsSiteLang, CmsTheme } from '@/types/models/cms-site';
import SiteFormFields from './partials/fields';

export default function Edit() {
    const { item, langs, themes } = usePage<{ item: CmsSite; langs: CmsSiteLang[]; themes: CmsTheme[] }>().props;

    const [data, setData] = useState<CmsSiteForm>({
        id: item.id,
        name: item.name,
        site_url: item.site_url || '',
        domains: (item.domains || []).join('\n'),
        theme: item.theme || 'default',
        lang_id: item.lang_id ? item.lang_id.toString() : '',
        lang_ids: item.lang_ids ?? [],
        currency: item.currency ?? 'USD',
        title: item.title || '',
        description: item.description || '',
        favicon: item.favicon || '',
        head_scripts: item.head_scripts || '',
        body_scripts: item.body_scripts || '',
        default: Boolean(item.default),
        active: Boolean(item.active),
    });
    // Extra languages already saved: each can be prepared from the main language
    const savedLangs = langs.filter((lang) => (item.lang_ids ?? []).includes(lang.id) && lang.id !== item.lang_id);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const updateSiteHandler: FormEventHandler = (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        updateSite(data.id!, data, {
            onSuccess: () => {
                setProcessing(false);
            },
            onError: (err: Record<string, string>) => {
                setErrors(err);
                setProcessing(false);
            },
        });
    };

    return (
        <ModuleLayout view={t('Editar')}>
            <FormLayout>
                <form onSubmit={updateSiteHandler} className="space-y-6">
                    <SiteFormFields data={data} setData={setData} errors={errors} processing={processing} langs={langs} themes={themes} />

                    <div className="flex items-center gap-4">
                        <Button disabled={processing}>{t('Guardar')}</Button>
                        <Link href="/admin/sites">{t('Cancelar')}</Link>
                    </div>
                </form>

                {savedLangs.length > 0 && (
                    <div className="border-border mt-8 space-y-2 border-t pt-6">
                        <h3 className="text-foreground text-sm font-semibold">{t('Versiones en otros idiomas')}</h3>
                        <p className="text-muted-foreground text-xs">
                            {t('Copia las páginas, los posts y los menús que falten en un idioma, traducidos con IA si quieres.')}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {savedLangs.map((lang) => (
                                <Button key={lang.id} variant="outline" size="sm" className="gap-1.5" asChild>
                                    <Link href={route('sites.languages.show', [item.id, lang.id])}>
                                        <Languages className="h-3.5 w-3.5" />
                                        {t('Preparar versión en :lang', { lang: lang.name })}
                                    </Link>
                                </Button>
                            ))}
                        </div>
                    </div>
                )}
            </FormLayout>
        </ModuleLayout>
    );
}
