import ModuleLayout from '@/layouts/module/layout';
import FormLayout from '@/layouts/module/Form';
import { Link, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

import { Button } from '@/components/ui/button';
import { createTerm } from '@/services/taxonomies';
import TaxonomyTermFormFields from './partials/fields';
import { CmsTaxonomy, CmsTaxonomyTerm, CmsTaxonomyTermForm } from '@/types/models/cms-taxonomy';

export default function Create() {
    const { taxonomy, parents } = usePage<{ taxonomy: CmsTaxonomy, parents: CmsTaxonomyTerm[] }>().props;

    const item: CmsTaxonomyTermForm = {
        name: '',
        slug: '',
        parent_id: null,
        description: '',
        active: true,
    };
    const [data, setData] = useState<CmsTaxonomyTermForm>(item);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const createTermHandler: FormEventHandler = (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        createTerm(taxonomy.id, data, {
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
        <ModuleLayout view={`Agregar Término a ${taxonomy.name}`}>
            <FormLayout>
                <form onSubmit={createTermHandler} className="space-y-6">
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
