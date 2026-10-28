import FormLayout from '@/layouts/module/Form';
import ModuleLayout from '@/layouts/module/layout';
import { Link, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

import { Button } from '@/components/ui/button';
import { t } from '@/lib/i18n';
import { updateSite } from '@/services/sites';
import { CmsSchemaGroup } from '@/types/models/cms-schema-group';
import { CmsSite, CmsSiteForm, CmsTheme } from '@/types/models/cms-site';
import SiteFormFields from './partials/fields';

export default function Edit() {
    const { item, schemaGroups, themes } = usePage<{ item: CmsSite; schemaGroups: CmsSchemaGroup[]; themes: CmsTheme[] }>().props;

    const [data, setData] = useState<CmsSiteForm>({
        id: item.id,
        name: item.name,
        segment: item.segment || '',
        site_url: item.site_url || '',
        domains: (item.domains || []).join('\n'),
        theme: item.theme || 'default',
        schema_group_id: item.schema_group_id,
        metadata: (item.metadata as Record<string, unknown>) || {},
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
                    <SiteFormFields
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        schemaGroups={schemaGroups}
                        themes={themes}
                    />

                    <div className="flex items-center gap-4">
                        <Button disabled={processing}>{t('Guardar')}</Button>
                        <Link href="/admin/sites">{t('Cancelar')}</Link>
                    </div>
                </form>
            </FormLayout>
        </ModuleLayout>
    );
}
