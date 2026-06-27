import ModuleLayout from '@/layouts/module/layout';
import FormLayout from '@/layouts/module/Form';
import ArticleFields from './partials/fields';
import { Link, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import QuickMediaDrawer from '@/components/quick-media-drawer';
import { Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createArticle } from '@/services/articles';
import { CmsArticle, CmsArticleForm } from '@/types/models/cms-article';
import { CmsSchema } from '@/types/models/cms-schema';

export default function Create() {
    const { schema, schemas = [], parents = [], taxonomies } = usePage<{ schema?: CmsSchema, schemas?: CmsSchema[], parents?: CmsArticle[], taxonomies?: import('@/types').CmsTaxonomy[] }>().props;

    const initial: CmsArticleForm = {
        id: null,
        parent_id: null,
        schema_id: schema?.id || null,
        lang_id: 1, // Assuming default lang_id
        title: '',
        content: '',
        excerpt: '',
        featured_image: '',
        status: 'published',
        metadata: {},
        slug: '',
        active: true,
        term_ids: [],
    };
    const [data, setData] = useState<CmsArticleForm>(initial);
    const [activeSchema, setActiveSchema] = useState<CmsSchema | undefined>(schema);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [mediaOpen, setMediaOpen] = useState(false);

    const handleChangeSchema = (schemaId: number) => {
        const found = schemas.find(s => s.id === schemaId);
        setActiveSchema(found);
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        createArticle(data, {
            onSuccess: () => {
                setProcessing(false);
                setData(initial);
                setActiveSchema(schema);
            },
            onError: (err: Record<string, string>) => {
                setErrors(err);
                setProcessing(false);
            },
        });
    };

    return (
        <ModuleLayout view="Crear">
            <div className="flex justify-end mb-4">
                <Button
                    type="button"
                    variant="outline"
                    className="flex items-center gap-1.5"
                    onClick={() => setMediaOpen(true)}
                >
                    <ImageIcon className="h-4 w-4" />
                    <span>Biblioteca de Medios Rápida</span>
                </Button>
            </div>
            <FormLayout>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <ArticleFields
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        schema={activeSchema}
                        schemas={schemas}
                        parents={parents}
                        taxonomies={taxonomies}
                        onChangeSchema={handleChangeSchema}
                    />
                    <div className="flex items-center gap-4">
                        <Button disabled={processing}>Guardar</Button>
                        <Link href='/admin/articles'>Cancelar</Link>
                    </div>
                </form>
            </FormLayout>
            <QuickMediaDrawer
                isOpen={mediaOpen}
                onClose={() => setMediaOpen(false)}
            />
        </ModuleLayout>
    );
}
