import FormLayout from '@/layouts/module/Form';
import ModuleLayout from '@/layouts/module/layout';
import { Link, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

import { Button } from '@/components/ui/button';
import { t } from '@/lib/i18n';
import { updateSite } from '@/services/sites';
import { CmsSite, CmsSiteForm, CmsSiteLang, CmsTheme } from '@/types/models/cms-site';
import SiteFormFields, { themeSettingValues } from './partials/fields';

export default function Edit() {
    const { item, langs, themes } = usePage<{ item: CmsSite; langs: CmsSiteLang[]; themes: CmsTheme[] }>().props;

    const [data, setData] = useState<CmsSiteForm>({
        id: item.id,
        name: item.name,
        site_url: item.site_url || '',
        domains: (item.domains || []).join('\n'),
        theme: item.theme || 'default',
        theme_settings: themeSettingValues(
            themes.find((theme) => theme.slug === item.theme),
            item.theme_settings,
        ),
        lang_id: item.lang_id ? item.lang_id.toString() : '',
        title: item.title || '',
        description: item.description || '',
        favicon: item.favicon || '',
        default: Boolean(item.default),
        active: Boolean(item.active),
    });
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
            </FormLayout>
        </ModuleLayout>
    );
}
