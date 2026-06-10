import ModuleLayout from '@/layouts/module/layout';
import FormLayout from '@/layouts/module/Form';
import { Link } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import { Button } from '@/components/ui/button';
import { createMenu } from '@/services/menus';
import MenuFormFields from './partials/fields';
import { CmsMenuForm } from '@/types/models/cms-menu';

export default function Create() {
    const item: CmsMenuForm = {
        name: '',
        slug: '',
        description: '',
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
        <ModuleLayout view="Crear Menú">
            <FormLayout>
                <form onSubmit={createMenuHandler} className="space-y-6">
                    <MenuFormFields
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                    />

                    <div className="flex items-center gap-4">
                        <Button disabled={processing}>Guardar</Button>
                        <Link href='/admin/menus' className="text-sm text-gray-600 hover:underline">Cancelar</Link>
                    </div>
                </form>
            </FormLayout>
        </ModuleLayout>
    );
}
