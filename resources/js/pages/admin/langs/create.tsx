import FormLayout from '@/layouts/module/Form';
import ModuleLayout from '@/layouts/module/layout';
import { Link } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

import { Button } from '@/components/ui/button';
import { createLang } from '@/services/langs';
import { CmsLangForm } from '@/types/models/cms-lang';
import LangFormFields from './partials/fields';

export default function Create() {
    const item: CmsLangForm = {
        name: '',
        iso: '',
        active: false,
    };
    const [data, setData] = useState<CmsLangForm>(item);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const createLangHandler: FormEventHandler = (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        createLang(data, {
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
        <ModuleLayout view="Crear">
            <FormLayout>
                <form onSubmit={createLangHandler} className="space-y-6">
                    <LangFormFields data={data} setData={setData} errors={errors} processing={processing} />

                    <div className="flex items-center gap-4">
                        <Button disabled={processing}>Guardar</Button>
                        <Link href="/admin/langs">Cancelar</Link>
                    </div>
                </form>
            </FormLayout>
        </ModuleLayout>
    );
}
