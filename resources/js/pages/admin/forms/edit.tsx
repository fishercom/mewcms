import { Button } from '@/components/ui/button';
import FormLayout from '@/layouts/module/Form';
import ModuleLayout from '@/layouts/module/layout';
import { CmsForm, CmsFormField } from '@/types/models/cms-form';
import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import FormFields from './partials/fields';

export default function Edit() {
    const { item } = usePage<{ item: CmsForm }>().props;

    const [data, setData] = useState<Partial<CmsForm> & { fields: CmsFormField[] }>({
        id: item.id,
        name: item.name,
        alias: item.alias,
        info: item.info,
        color: item.color,
        active: item.active,
        fields: item.fields || [],
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.put(route('forms.update', item.id), data as any, {
            onSuccess: () => {
                setProcessing(false);
            },
            onError: (err) => {
                setErrors(err);
                setProcessing(false);
            },
        });
    };

    return (
        <ModuleLayout view="Editar">
            <FormLayout>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <FormFields data={data} setData={setData} errors={errors} />

                    <div className="border-border flex items-center gap-4 border-t pt-4">
                        <Button disabled={processing} className="bg-primary text-primary-foreground hover:bg-primary/90">
                            Guardar Cambios
                        </Button>
                        <Link href={route('forms.index')} className="text-muted-foreground hover:text-foreground text-sm font-medium">
                            Cancelar
                        </Link>
                    </div>
                </form>
            </FormLayout>
        </ModuleLayout>
    );
}
