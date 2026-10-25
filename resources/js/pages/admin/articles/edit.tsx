import ContentEditorTools, { RevisionData } from '@/components/content-editor-tools';
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
import ArticleFields, { PageMenu, PageTemplate } from './partials/fields';

export default function Edit() {
    const {
        item,
        schema,
        schemas = [],
        templates = [],
        menus = [],
        menuIds = [],
        parents = [],
        tags,
        autosave,
    } = usePage<{
        item: CmsArticle;
        schema?: CmsSchema;
        schemas?: CmsSchema[];
        templates?: PageTemplate[];
        menus?: PageMenu[];
        menuIds?: number[];
        parents?: CmsArticle[];
        tags?: import('@/types').CmsTag[];
        autosave?: (RevisionData & { updated_at?: string }) | null;
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
        published_at: item.published_at ?? '',
        metadata: item.metadata as { [key: string]: FormDataConvertible },
        slug: item.slug,
        active: item.active,
        tag_ids: item.tags?.map((t) => t.id) || [],
        menu_ids: menuIds,
        menus_managed: true,
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
                            <ImageIcon className="text-primary h-4 w-4" />
                            <span>Biblioteca de Medios</span>
                        </Button>

                        <Button
                            type="submit"
                            disabled={processing}
                            className="bg-primary text-primary-foreground shadow-primary/25 hover:bg-primary/90 h-9 gap-1.5 rounded-xl px-4 text-xs font-semibold shadow-sm transition-all active:scale-95"
                        >
                            <span>Guardar Cambios</span>
                        </Button>
                    </div>
                </div>

                <ContentEditorTools
                    module="articles"
                    id={item.id}
                    data={data}
                    initialData={initial}
                    autosave={autosave}
                    onApply={(revision: RevisionData) =>
                        setData((prev) => ({
                            ...prev,
                            title: revision.title ?? prev.title,
                            content: revision.content ?? '',
                            excerpt: revision.excerpt ?? '',
                            metadata: (revision.metadata ?? prev.metadata) as typeof prev.metadata,
                            status: revision.status ?? prev.status ?? 'published',
                            published_at: revision.published_at ?? '',
                            tag_ids: revision.tag_ids ?? prev.tag_ids ?? [],
                        }))
                    }
                />

                <FormLayout>
                    <ArticleFields
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        schema={activeSchema}
                        schemas={schemas}
                        templates={templates}
                        menus={menus}
                        parents={parents}
                        tags={tags}
                        onChangeSchema={handleChangeSchema}
                    />
                </FormLayout>

                {/* Sticky publication action bar */}
                <div className="border-border/80 bg-background/90 sticky bottom-4 z-10 flex items-center justify-between rounded-2xl border p-4 shadow-lg backdrop-blur-md">
                    <span className="text-muted-foreground text-xs">
                        {processing ? 'Actualizando página...' : `Editando: ${data.title || 'Sin título'}`}
                    </span>
                    <div className="flex items-center gap-2.5">
                        <Button variant="outline" type="button" asChild className="border-border/70 h-9 rounded-xl text-xs font-medium">
                            <Link href="/admin/articles">Cancelar</Link>
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="bg-primary text-primary-foreground shadow-primary/25 hover:bg-primary/90 h-9 rounded-xl px-5 text-xs font-semibold shadow-sm active:scale-95"
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
