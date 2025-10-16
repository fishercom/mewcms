import ModuleLayout from '@/layouts/module/layout';
import FormLayout from '@/layouts/module/Form';
import { Link, usePage } from '@inertiajs/react';
import { CmsRegister } from '@/types/models/cms-register';
import { CmsRegisterForm } from '@/types/models/cms-register';

import { Label } from '@/components/ui/label';
import { useState } from 'react';

export default function Create() {

    const { item } = usePage<{ item: CmsRegister }>().props;
    const [data] = useState<Required<CmsRegisterForm>>({
        id: item.id,
        form_id: item.form_id,
        contact_id: item.contact_id,
        name: item.name,
        email: item.email,
        phone: item.phone,
        message: item.message,
        acceptance: item.acceptance,
        review: item.review,
        review_date: item.review_date,
    });

    return (
        <ModuleLayout view="Visualizar Mensaje">
            <FormLayout>
            <form className="space-y-6">
                <div className="grid gap-2">
                    <Label htmlFor="name">Nombre</Label>
                    {data.name}
                </div>

                <div className="flex items-center gap-4">
                    <Link href='/admin/registers'>Cancelar</Link>
                </div>
            </form>
            </FormLayout>
        </ModuleLayout>
    );
}
