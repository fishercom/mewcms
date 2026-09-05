import FormLayout from '@/layouts/module/Form';
import ModuleLayout from '@/layouts/module/layout';
import { Link, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

import { Button } from '@/components/ui/button';
import { updateNotify } from '@/services/notifies';
import { CmsForm } from '@/types/models/cms-form';
import { CmsNotify, CmsNotifyForm } from '@/types/models/cms-notify';
import { User } from '@/types/models/user';
import NotifyFormFields from './partials/fields';

export default function Edit() {
    const { item, forms, users } = usePage<{ item: CmsNotify; forms: CmsForm[]; users: User[] }>().props;

    const [data, setData] = useState<CmsNotifyForm>({
        id: item.id,
        form_id: item.form_id,
        user_id: item.user_id,
        recipients: item.recipients || '',
        active: Boolean(item.active),
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const updateNotifyHandler: FormEventHandler = (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        updateNotify(data.id!, data, {
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
        <ModuleLayout view="Editar">
            <FormLayout>
                <form onSubmit={updateNotifyHandler} className="space-y-6">
                    <NotifyFormFields data={data} setData={setData} errors={errors} processing={processing} forms={forms} users={users} />

                    <div className="flex items-center gap-4">
                        <Button disabled={processing}>Guardar</Button>
                        <Link href="/admin/notifies">Cancelar</Link>
                    </div>
                </form>
            </FormLayout>
        </ModuleLayout>
    );
}
