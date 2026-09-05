import QuickMediaDrawer from '@/components/quick-media-drawer';
import { Button } from '@/components/ui/button';
import FormLayout from '@/layouts/module/Form';
import ModuleLayout from '@/layouts/module/layout';
import { updateArticle } from '@/services/articles';
import { CmsArticle, CmsArticleForm, FormDataConvertible } from '@/types/models/cms-article';
import { CmsSchema } from '@/types/models/cms-schema';
import { Link, usePage } from '@inertiajs/react';
import { Image as ImageIcon } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import ArticleFields from './partials/fields';

export default function Edit() {
    const {
        item,
        schema,
        schemas = [],
        parents = [],
        taxonomies,
    } = usePage<{
        item: CmsArticle;
        schema?: CmsSchema;
        schemas?: CmsSchema[];
        parents?: CmsArticle[];
        taxonomies?: import('@/types').CmsTaxonomy[];
    }>().props;

    const initial: CmsArticleForm = {
        id: item.id,
        parent_id: item.parent_id,
        schema_id: item.schema_id,
        lang_id: item.lang_id,
        title: item.title,
        content: item.content || '',
        excerpt: item.excerpt || '',
        featured_image: item.featured_image || '',
        status: item.status || 'published',
        metadata: item.metadata as { [key: string]: FormDataConvertible },
        slug: item.slug,
        active: item.active,
        term_ids: item.terms?.map((t) => t.id) || [],
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
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
                    <Link
                        href="/admin/articles"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                    >
                        ← Volver a Páginas
                    </Link>

                    <div className="flex items-center gap-2.5">
                        <Button
                            type="button"
                            variant="outline"
                            className="h-9 gap-1.5 rounded-xl border-border/70 text-xs font-medium shadow-2xs"
                            onClick={() => setMediaOpen(true)}
                        >
                            <ImageIcon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                            <span>Biblioteca de Medios</span>
                        </Button>

                        <Button
                            type="submit"
                            disabled={processing}
                            className="h-9 gap-1.5 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white shadow-sm shadow-violet-500/25 hover:bg-violet-700 active:scale-95 transition-all"
                        >
                            <span>Guardar Cambios</span>
                        </Button>
                    </div>
                </div>

                <FormLayout>
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
                </FormLayout>

                {/* Sticky publication action bar */}
                <div className="sticky bottom-4 z-10 flex items-center justify-between rounded-2xl border border-border/80 bg-background/90 p-4 shadow-lg backdrop-blur-md">
                    <span className="text-xs text-muted-foreground">
                        {processing ? 'Actualizando página...' : `Editando: ${data.title || 'Sin título'}`}
                    </span>
                    <div className="flex items-center gap-2.5">
                        <Button
                            variant="outline"
                            type="button"
                            asChild
                            className="h-9 rounded-xl border-border/70 text-xs font-medium"
                        >
                            <Link href="/admin/articles">Cancelar</Link>
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="h-9 rounded-xl bg-violet-600 px-5 text-xs font-semibold text-white shadow-sm shadow-violet-500/25 hover:bg-violet-700 active:scale-95"
                        >
                            {processing ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </div>
                </div>
            </form>
            <QuickMediaDrawer isOpen={mediaOpen} onClose={() => setMediaOpen(false)} />
        </ModuleLayout>
    );
}
