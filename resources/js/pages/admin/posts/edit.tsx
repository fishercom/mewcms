import { blocksFromContent } from '@/blocks/types';
import ContentEditorTools, { RevisionData } from '@/components/content-editor-tools';
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

export default function Edit() {
    const { item, schema, schemas, authors, tags, cpt, post_type, lang_id, autosave } = usePage<{
        item: CmsPost & { tag_ids?: number[] };
        schema: CmsSchema | null;
        schemas: CmsSchema[];
        authors: { id: number; name: string; username: string }[];
        tags: CmsTag[];
        cpt: CmsPostType | null;
        post_type: string;
        lang_id: number;
        autosave?: (RevisionData & { updated_at?: string }) | null;
    }>().props;

    const [initial] = useState<Partial<CmsPost> & { tag_ids?: number[] }>({
        id: item.id,
        user_id: item.user_id,
        lang_id: item.lang_id,
        schema_id: item.schema_id,
        title: item.title,
        slug: item.slug,
        content: item.content,
        blocks: item.blocks ?? blocksFromContent(item.content),
        excerpt: item.excerpt,
        featured_image: item.featured_image,
        metadata: item.metadata || {},
        status: item.status,
        published_at: item.published_at,
        active: item.active,
        tag_ids: item.tag_ids || [],
    });
    const [data, setData] = useState(initial);
    const [activeSchema, setActiveSchema] = useState<CmsSchema | null>(schema);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const handleChangeSchema = (schemaId: number) => {
        const found = schemas.find((s) => s.id === schemaId) || null;
        setActiveSchema(found);
        setData((prev) => ({
            ...prev,
            schema_id: schemaId || null,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        router.put(
            route('posts.update', item.id),
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
        <ModuleLayout view={t('Editar')}>
            <FormLayout>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <ContentEditorTools
                        module="posts"
                        id={item.id}
                        data={data}
                        initialData={initial}
                        autosave={autosave}
                        previewExtra={{ post_type }}
                        onApply={(revision: RevisionData) =>
                            setData((prev) => ({
                                ...prev,
                                title: revision.title ?? prev.title,
                                content: revision.content ?? '',
                                blocks: revision.blocks ?? blocksFromContent(revision.content),
                                excerpt: revision.excerpt ?? '',
                                metadata: (revision.metadata ?? prev.metadata) as typeof prev.metadata,
                                status: (revision.status as CmsPost['status'] | null) ?? prev.status,
                                published_at: revision.published_at ?? prev.published_at,
                                tag_ids: revision.tag_ids ?? prev.tag_ids,
                            }))
                        }
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
                            {t('Guardar Cambios')}
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
