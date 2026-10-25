import { Button } from '@/components/ui/button';
import FormLayout from '@/layouts/module/Form';
import ModuleLayout from '@/layouts/module/layout';
import { CmsPostType } from '@/types/models/cms-post';
import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import PostTypeFormFields from './partials/fields';

export default function Create() {
    const { schemas } = usePage<{ schemas: { id: number; name: string }[] }>().props;

    const initialItem: Partial<CmsPostType> = {
        name: '',
        singular_name: '',
        slug: '',
        icon: 'book-open',
        description: '',
        default_schema_id: null,
        active: true,
    };

    const [data, setData] = useState<Partial<CmsPostType>>(initialItem);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.post(route('post-types.store'), data as any, {
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
                    <PostTypeFormFields data={data} setData={setData} errors={errors} processing={processing} schemas={schemas} />

                    <div className="border-border flex items-center gap-4 border-t pt-4">
                        <Button disabled={processing} className="bg-primary text-primary-foreground hover:bg-primary/90">
                            Guardar
                        </Button>
                        <Link href="/admin/post-types" className="text-muted-foreground hover:text-foreground text-sm font-medium">
                            Cancelar
                        </Link>
                    </div>
                </form>
            </FormLayout>
        </ModuleLayout>
    );
}
