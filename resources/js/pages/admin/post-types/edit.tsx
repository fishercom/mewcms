import { useState } from 'react';
import { router, Link, usePage } from '@inertiajs/react';
import ModuleLayout from '@/layouts/module/layout';
import FormLayout from '@/layouts/module/Form';
import { Button } from '@/components/ui/button';
import PostTypeFormFields from './partials/fields';
import { CmsPostType } from '@/types/models/cms-post';

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
                    <PostTypeFormFields
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        schemas={schemas}
                    />

                    <div className="flex items-center gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                        <Button disabled={processing} className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-500 dark:hover:bg-red-600">
                            Guardar Cambios
                        </Button>
                        <Link
                            href="/admin/post-types"
                            className="text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                        >
                            Cancelar
                        </Link>
                    </div>
                </form>
            </FormLayout>
        </ModuleLayout>
    );
}
