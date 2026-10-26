import { Button } from '@/components/ui/button';
import FormLayout from '@/layouts/module/Form';
import ModuleLayout from '@/layouts/module/layout';
import { t } from '@/lib/i18n';
import { createMenu } from '@/services/menus';
import { CmsMenuForm } from '@/types/models/cms-menu';
import { Link } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import MenuFormFields from './partials/fields';

export default function Create() {
    const item: CmsMenuForm = {
        name: '',
        slug: '',
        description: '',
        auto_add_pages: false,
        auto_add_subpages: false,
        active: true,
    };
    const [data, setData] = useState<CmsMenuForm>(item);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const createMenuHandler: FormEventHandler = (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        createMenu(data, {
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
        <ModuleLayout view={t('Crear Menú')}>
            <FormLayout>
                <form onSubmit={createMenuHandler} className="space-y-6">
                    <MenuFormFields data={data} setData={setData} errors={errors} processing={processing} />

                    <div className="flex items-center gap-4">
                        <Button disabled={processing}>{t('Guardar')}</Button>
                        <Link href="/admin/menus" className="text-muted-foreground text-sm hover:underline">
                            {t('Cancelar')}
                        </Link>
                    </div>
                </form>
            </FormLayout>
        </ModuleLayout>
    );
}
