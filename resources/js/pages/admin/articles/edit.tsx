import ModuleLayout from '@/layouts/module/layout';
import FormLayout from '@/layouts/module/Form';
import ArticleFields from './partials/fields';
import { Link, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import { Button } from '@/components/ui/button';
import { updateArticle } from '@/services/articles';
import { CmsArticle, CmsArticleForm, FormDataConvertible } from '@/types/models/cms-article';
import { CmsSchema } from '@/types/models/cms-schema';

export default function Edit() {
    const { item, schema } = usePage<{ item: CmsArticle, schema?: CmsSchema }>().props;

    const initial: CmsArticleForm = {
        id: item.id,
        parent_id: item.parent_id,
        schema_id: item.schema_id,
        lang_id: item.lang_id,
        title: item.title,
        metadata: item.metadata as { [key: string]: FormDataConvertible },
        slug: item.slug,
        active: item.active,
    };
    const [data, setData] = useState<CmsArticleForm>(initial);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        updateArticle(data.id!, data, {
            onSuccess: () => setProcessing(false),
            onError: (err: Record<string, string>) => {
                setErrors(err);
                setProcessing(false);
            },
        });
    };

    return (
        <ModuleLayout view="Editar">
            <FormLayout>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <ArticleFields
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        schema={schema}
                    />
                    <div className="flex items-center gap-4">
                        <Button disabled={processing}>Guardar</Button>
                        <Link href='/admin/articles'>Cancelar</Link>
                    </div>
                </form>
            </FormLayout>
        </ModuleLayout>
    );
}
