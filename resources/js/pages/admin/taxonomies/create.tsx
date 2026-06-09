import ModuleLayout from '@/layouts/module/layout';
import FormLayout from '@/layouts/module/Form';
import { Link } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

import { Button } from '@/components/ui/button';
import { createTaxonomy } from '@/services/taxonomies';
import TaxonomyFormFields from './partials/fields';
import { CmsTaxonomyForm } from '@/types/models/cms-taxonomy';

export default function Create() {
    const item: CmsTaxonomyForm = {
        name: '',
        slug: '',
        description: '',
        active: true,
    };
    const [data, setData] = useState<CmsTaxonomyForm>(item);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const createTaxonomyHandler: FormEventHandler = (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        createTaxonomy(data, {
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
        <ModuleLayout view="Crear Taxonomía">
            <FormLayout>
                <form onSubmit={createTaxonomyHandler} className="space-y-6">
                    <TaxonomyFormFields
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                    />

                    <div className="flex items-center gap-4">
                        <Button disabled={processing}>Guardar</Button>
                        <Link href='/admin/taxonomies'>Cancelar</Link>
                    </div>
                </form>
            </FormLayout>
        </ModuleLayout>
    );
}
