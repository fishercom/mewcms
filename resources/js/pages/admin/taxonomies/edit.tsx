import ModuleLayout from '@/layouts/module/layout';
import FormLayout from '@/layouts/module/Form';
import { Link, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

import { Button } from '@/components/ui/button';
import { updateTaxonomy } from '@/services/taxonomies';
import TaxonomyFormFields from './partials/fields';
import { CmsTaxonomy, CmsTaxonomyForm } from '@/types/models/cms-taxonomy';

export default function Edit() {
    const { item } = usePage<{ item: CmsTaxonomy }>().props;
    const [data, setData] = useState<CmsTaxonomyForm>({
        id: item.id,
        name: item.name,
        slug: item.slug || '',
        description: item.description || '',
        active: Boolean(item.active),
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const updateTaxonomyHandler: FormEventHandler = (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        updateTaxonomy(data.id!, data, {
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
        <ModuleLayout view="Editar Taxonomía">
            <FormLayout>
                <form onSubmit={updateTaxonomyHandler} className="space-y-6">
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
