import FormLayout from '@/layouts/module/Form';
import ModuleLayout from '@/layouts/module/layout';
import { Link, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

import { Button } from '@/components/ui/button';
import { t } from '@/lib/i18n';
import { createSite } from '@/services/sites';
import { CmsSchemaGroup } from '@/types/models/cms-schema-group';
import { CmsSiteForm, CmsTheme } from '@/types/models/cms-site';
import SiteFormFields from './partials/fields';

export default function Create() {
    const { schemaGroups, themes } = usePage<{ schemaGroups: CmsSchemaGroup[]; themes: CmsTheme[] }>().props;

    const item: CmsSiteForm = {
        name: '',
        segment: '',
        site_url: '',
        domains: '',
        theme: themes[0]?.slug || 'default',
        schema_group_id: schemaGroups[0]?.id ?? null,
        metadata: {},
        default: false,
        active: true,
    };
    const [data, setData] = useState<CmsSiteForm>(item);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const createSiteHandler: FormEventHandler = (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        createSite(data, {
            onSuccess: () => {
                setProcessing(false);
                setData(item);
            },
            onError: (err: Record<string, string>) => {
                setErrors(err);
                setProcessing(false);
            },
        });
    };

    return (
        <ModuleLayout view={t('Crear')}>
            <FormLayout>
                <form onSubmit={createSiteHandler} className="space-y-6">
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
