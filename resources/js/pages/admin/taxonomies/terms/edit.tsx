import ModuleLayout from '@/layouts/module/layout';
import FormLayout from '@/layouts/module/Form';
import { Link, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

import { Button } from '@/components/ui/button';
import { updateTerm } from '@/services/taxonomies';
import TaxonomyTermFormFields from './partials/fields';
import { CmsTaxonomy, CmsTaxonomyTerm, CmsTaxonomyTermForm } from '@/types/models/cms-taxonomy';

export default function Edit() {
    const { item, taxonomy, parents } = usePage<{ item: CmsTaxonomyTerm, taxonomy: CmsTaxonomy, parents: CmsTaxonomyTerm[] }>().props;

    const [data, setData] = useState<CmsTaxonomyTermForm>({
        id: item.id,
        taxonomy_id: item.taxonomy_id,
        parent_id: item.parent_id,
        name: item.name,
        slug: item.slug || '',
        description: item.description || '',
        active: Boolean(item.active),
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const updateTermHandler: FormEventHandler = (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        updateTerm(item.id, data, {
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
        <ModuleLayout view={`Editar Término en ${taxonomy.name}`}>
            <FormLayout>
                <form onSubmit={updateTermHandler} className="space-y-6">
                    <TaxonomyTermFormFields
                        data={data}
                        setData={setData}
                        errors={errors}
                        parents={parents}
                        processing={processing}
                    />

                    <div className="flex items-center gap-4">
                        <Button disabled={processing}>Guardar</Button>
                        <Link href={`/admin/taxonomies/${taxonomy.id}/terms`}>Cancelar</Link>
                    </div>
                </form>
            </FormLayout>
        </ModuleLayout>
    );
}
