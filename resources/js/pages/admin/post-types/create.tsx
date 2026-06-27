import { useState } from 'react';
import { router, Link, usePage } from '@inertiajs/react';
import ModuleLayout from '@/layouts/module/layout';
import FormLayout from '@/layouts/module/Form';
import { Button } from '@/components/ui/button';
import PostTypeFormFields from './partials/fields';
import { CmsPostType } from '@/types/models/cms-post';

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
        <ModuleLayout view="Crear Tipo de Contenido">
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
                            Guardar
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
