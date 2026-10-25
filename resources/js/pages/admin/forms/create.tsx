import { Button } from '@/components/ui/button';
import FormLayout from '@/layouts/module/Form';
import ModuleLayout from '@/layouts/module/layout';
import { CmsForm, CmsFormField } from '@/types/models/cms-form';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import FormFields from './partials/fields';

export default function Create() {
    const [data, setData] = useState<Partial<CmsForm> & { fields: CmsFormField[] }>({
        name: '',
        alias: '',
        info: '',
        color: '#E02424',
        active: true,
        fields: [],
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.post(route('forms.store'), data as any, {
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
        <ModuleLayout view="Crear">
            <FormLayout>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <FormFields data={data} setData={setData} errors={errors} />

                    <div className="border-border flex items-center gap-4 border-t pt-4">
                        <Button disabled={processing} className="bg-primary text-primary-foreground hover:bg-primary/90">
                            Crear Formulario
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
