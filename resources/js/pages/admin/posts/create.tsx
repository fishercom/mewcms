import { useState } from 'react';
import { router, Link, usePage } from '@inertiajs/react';
import ModuleLayout from '@/layouts/module/layout';
import FormLayout from '@/layouts/module/Form';
import { Button } from '@/components/ui/button';
import PostFields from './partials/fields';
import { CmsPost, CmsPostType } from '@/types/models/cms-post';
import { CmsSchema } from '@/types/models/cms-schema';
import { CmsTaxonomy } from '@/types/models/cms-taxonomy';

export default function Create() {
    const { item, schema, schemas, authors, taxonomies, cpt, post_type, lang_id } = usePage<{
        item: CmsPost & { term_ids?: number[] };
        schema: CmsSchema | null;
        schemas: CmsSchema[];
        authors: { id: number; name: string; username: string }[];
        taxonomies: CmsTaxonomy[];
        cpt: CmsPostType | null;
        post_type: string;
        lang_id: number;
    }>().props;

    const [data, setData] = useState<Partial<CmsPost> & { term_ids?: number[] }>(item);
    const [activeSchema, setActiveSchema] = useState<CmsSchema | null>(schema);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const handleChangeSchema = (schemaId: number) => {
        const found = schemas.find(s => s.id === schemaId) || null;
        setActiveSchema(found);
        setData(prev => ({
            ...prev,
            schema_id: schemaId || null,
            // Keep existing metadata or reset
            metadata: prev.metadata || {}
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        router.post(route('posts.store'), {
            ...data,
            post_type,
            lang_id
        } as any, {
            onSuccess: () => {
                setProcessing(false);
            },
            onError: (err) => {
                setErrors(err);
                setProcessing(false);
            },
        });
    };

    const singularName = cpt ? cpt.singular_name : 'Entrada';

    return (
        <ModuleLayout view={`Crear ${singularName}`}>
            <FormLayout>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <PostFields
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        schemas={schemas}
                        authors={authors}
                        taxonomies={taxonomies}
                        schema={activeSchema}
                        onChangeSchema={handleChangeSchema}
                        cptLabelSingular={singularName}
                    />

                    <div className="flex items-center gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                        <Button disabled={processing} className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-500 dark:hover:bg-red-600">
                            Publicar / Guardar
                        </Button>
                        <Link
                            href={`/admin/posts?post_type=${post_type}&lang_id=${lang_id}`}
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
