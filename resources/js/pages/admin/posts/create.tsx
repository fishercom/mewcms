import ContentEditorTools from '@/components/content-editor-tools';
import { Button } from '@/components/ui/button';
import FormLayout from '@/layouts/module/Form';
import ModuleLayout from '@/layouts/module/layout';
import { t } from '@/lib/i18n';
import { CmsPost, CmsPostType } from '@/types/models/cms-post';
import { CmsSchema } from '@/types/models/cms-schema';
import { CmsTag } from '@/types/models/cms-tag';
import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import PostFields from './partials/fields';

export default function Create() {
    const { item, schema, schemas, authors, tags, cpt, post_type, lang_id } = usePage<{
        item: CmsPost & { tag_ids?: number[] };
        schema: CmsSchema | null;
        schemas: CmsSchema[];
        authors: { id: number; name: string; username: string }[];
        tags: CmsTag[];
        cpt: CmsPostType | null;
        post_type: string;
        lang_id: number;
    }>().props;

    const [data, setData] = useState<Partial<CmsPost> & { tag_ids?: number[] }>(item);
    const [activeSchema, setActiveSchema] = useState<CmsSchema | null>(schema);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const handleChangeSchema = (schemaId: number) => {
        const found = schemas.find((s) => s.id === schemaId) || null;
        setActiveSchema(found);
        setData((prev) => ({
            ...prev,
            schema_id: schemaId || null,
            // Keep existing metadata or reset
            metadata: prev.metadata || {},
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        router.post(
            route('posts.store'),
            {
                ...data,
                post_type,
                lang_id,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any,
            {
                onSuccess: () => {
                    setProcessing(false);
                },
                onError: (err) => {
                    setErrors(err);
                    setProcessing(false);
                },
            },
        );
    };

    const singularName = cpt ? cpt.singular_name : t('Entrada');

    return (
        <ModuleLayout view={t('Crear')}>
            <FormLayout>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <ContentEditorTools
                        module="posts"
                        id={null}
                        data={data}
                        initialData={item}
                        previewExtra={{ post_type }}
                        onApply={() => undefined}
                    />
                    <PostFields
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        schemas={schemas}
                        authors={authors}
                        tags={tags}
                        schema={activeSchema}
                        onChangeSchema={handleChangeSchema}
                        cptLabelSingular={singularName}
                    />

                    <div className="border-border flex items-center gap-4 border-t pt-4">
                        <Button disabled={processing} className="bg-primary text-primary-foreground hover:bg-primary/90">
                            {t('Publicar / Guardar')}
                        </Button>
                        <Link
                            href={`/admin/posts?post_type=${post_type}&lang_id=${lang_id}`}
                            className="text-muted-foreground hover:text-foreground text-sm font-medium"
                        >
                            {t('Cancelar')}
                        </Link>
                    </div>
                </form>
            </FormLayout>
        </ModuleLayout>
    );
}
