import { Button } from '@/components/ui/button';
import FormLayout from '@/layouts/module/Form';
import ModuleLayout from '@/layouts/module/layout';
import { CmsPostType } from '@/types/models/cms-post';
import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import PostTypeFormFields from './partials/fields';

export default function Edit() {
    const { item, schemas } = usePage<{ item: CmsPostType; schemas: { id: number; name: string }[] }>().props;

    const [data, setData] = useState<Partial<CmsPostType>>({
        id: item.id,
        name: item.name,
        singular_name: item.singular_name,
        slug: item.slug,
        icon: item.icon,
        description: item.description,
        default_schema_id: item.default_schema_id,
        active: item.active,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.put(route('post-types.update', item.id), data as any, {
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
                    <PostTypeFormFields data={data} setData={setData} errors={errors} processing={processing} schemas={schemas} />

                    <div className="border-border flex items-center gap-4 border-t pt-4">
                        <Button disabled={processing} className="bg-primary text-primary-foreground hover:bg-primary/90">
                            Guardar Cambios
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
