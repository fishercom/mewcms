import ContentEditorTools from '@/components/content-editor-tools';
import QuickMediaDrawer from '@/components/quick-media-drawer';
import { Button } from '@/components/ui/button';
import FormLayout from '@/layouts/module/Form';
import ModuleLayout from '@/layouts/module/layout';
import { createArticle } from '@/services/articles';
import { CmsArticle, CmsArticleForm } from '@/types/models/cms-article';
import { CmsSchema } from '@/types/models/cms-schema';
import { Link, usePage } from '@inertiajs/react';
import { Image as ImageIcon } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import ArticleFields, { PageTemplate } from './partials/fields';

export default function Create() {
    const {
        schema,
        schemas = [],
        templates = [],
        parents = [],
        tags,
    } = usePage<{
        schema?: CmsSchema;
        schemas?: CmsSchema[];
        templates?: PageTemplate[];
        parents?: CmsArticle[];
        tags?: import('@/types').CmsTag[];
    }>().props;

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
        published_at: '',
        metadata: {},
        slug: '',
        active: true,
        tag_ids: [],
    };
    const [data, setData] = useState<CmsArticleForm>(initial);
    const [activeSchema, setActiveSchema] = useState<CmsSchema | undefined>(schema);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [mediaOpen, setMediaOpen] = useState(false);

    const handleChangeSchema = (schemaId: number) => {
        const found = schemas.find((s) => s.id === schemaId);
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
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="border-border/60 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
                    <Link
                        href="/admin/articles"
                        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs font-semibold transition-colors"
                    >
                        ← Volver a Páginas
                    </Link>

                    <div className="flex items-center gap-2.5">
                        <Button
                            type="button"
                            variant="outline"
                            className="border-border/70 h-9 gap-1.5 rounded-xl text-xs font-medium shadow-2xs"
                            onClick={() => setMediaOpen(true)}
                        >
                            <ImageIcon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                            <span>Biblioteca de Medios</span>
                        </Button>

                        <Button
                            type="submit"
                            disabled={processing}
                            className="h-9 gap-1.5 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white shadow-sm shadow-violet-500/25 transition-all hover:bg-violet-700 active:scale-95"
                        >
                            <span>Guardar Página</span>
                        </Button>
                    </div>
                </div>

                <ContentEditorTools module="articles" id={null} data={data} initialData={initial} onApply={() => undefined} />

                <FormLayout>
                    <ArticleFields
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        schema={activeSchema}
                        schemas={schemas}
                        templates={templates}
                        parents={parents}
                        tags={tags}
                        onChangeSchema={handleChangeSchema}
                    />
                </FormLayout>

                {/* Sticky publication action bar */}
                <div className="border-border/80 bg-background/90 sticky bottom-4 z-10 flex items-center justify-between rounded-2xl border p-4 shadow-lg backdrop-blur-md">
                    <span className="text-muted-foreground text-xs">{processing ? 'Guardando cambios...' : 'Todos los cambios pendientes'}</span>
                    <div className="flex items-center gap-2.5">
                        <Button variant="outline" type="button" asChild className="border-border/70 h-9 rounded-xl text-xs font-medium">
                            <Link href="/admin/articles">Cancelar</Link>
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="h-9 rounded-xl bg-violet-600 px-5 text-xs font-semibold text-white shadow-sm shadow-violet-500/25 hover:bg-violet-700 active:scale-95"
                        >
                            {processing ? 'Guardando...' : 'Guardar Página'}
                        </Button>
                    </div>
                </div>
            </form>
            <QuickMediaDrawer isOpen={mediaOpen} onClose={() => setMediaOpen(false)} />
        </ModuleLayout>
    );
}
