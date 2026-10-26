import { type BlockDefinition } from '@/blocks/types';
import BlockEditor from '@/components/block-editor';
import CustomFieldRenderer from '@/components/custom-field-renderer';
import InputError from '@/components/input-error';
import QuickMediaDrawer from '@/components/quick-media-drawer';
import TagField from '@/components/tag-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStarterLayout } from '@/hooks/use-starter-layout';
import { CmsPost } from '@/types/models/cms-post';
import { CmsSchema } from '@/types/models/cms-schema';
import { CmsTag } from '@/types/models/cms-tag';
import { usePage } from '@inertiajs/react';
import { Calendar, Eye, Image as ImageIcon, Settings, Trash2, User } from 'lucide-react';
import { useState } from 'react';
import SeoFields from '../../partials/seo-fields';

interface Props {
    data: Partial<CmsPost> & { tag_ids?: number[] };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setData: (data: any) => void;
    errors: Record<string, string>;
    processing: boolean;
    schemas: CmsSchema[];
    authors: { id: number; name: string; username: string }[];
    tags: CmsTag[];
    schema: CmsSchema | null;
    onChangeSchema: (schemaId: number) => void;
    cptLabelSingular: string;
}

export default function PostFields({ data, setData, errors, processing, schemas, authors, tags, schema, onChangeSchema, cptLabelSingular }: Props) {
    const { blockTypes = [] } = usePage<{ blockTypes?: BlockDefinition[] }>().props;
    useStarterLayout(!data.id, schema, data.blocks ?? [], (blocks) => setData({ ...data, blocks }));
    const [mediaDrawerOpen, setMediaDrawerOpen] = useState(false);

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const titleVal = e.target.value;
        const generatedSlug = titleVal
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-');

        setData({
            ...data,
            title: titleVal,
            slug: data.id ? data.slug : generatedSlug, // auto-slug on create only
        });
    };

    const handleSelectFeaturedImage = (url: string) => {
        setData({ ...data, featured_image: url });
        setMediaDrawerOpen(false);
    };

    // Format datetime-local value (YYYY-MM-DDTHH:MM)
    const getPublishedAtValue = () => {
        if (!data.published_at) return '';
        const d = new Date(data.published_at);
        if (isNaN(d.getTime())) return '';
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const handlePublishedAtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setData({ ...data, published_at: e.target.value });
    };

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Column: Primary Post Content */}
            <div className="space-y-6 lg:col-span-8">
                <div className="grid gap-2">
                    <Label htmlFor="title" className="text-sm font-semibold">
                        Título del {cptLabelSingular}
                    </Label>
                    <Input
                        id="title"
                        type="text"
                        required
                        autoFocus
                        value={data.title || ''}
                        onChange={handleTitleChange}
                        disabled={processing}
                        className="py-5 text-base"
                        placeholder={`Escribe el título de tu ${cptLabelSingular.toLowerCase()}...`}
                    />
                    <InputError message={errors.title} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="slug" className="text-muted-foreground text-xs font-semibold">
                        Enlace Permanente (Slug)
                    </Label>
                    <div className="flex items-center gap-1 text-xs">
                        <span className="text-muted-foreground font-mono">/{data.post_type !== 'post' ? `${data.post_type}/` : 'blog/'}</span>
                        <input
                            id="slug"
                            type="text"
                            required
                            value={data.slug || ''}
                            onChange={(e) => setData({ ...data, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                            disabled={processing}
                            className="border-border text-destructive focus:border-border-strong max-w-full border-b border-dashed bg-transparent font-mono focus:outline-none"
                        />
                    </div>
                    <InputError message={errors.slug} />
                </div>

                <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">Contenido</Label>
                        <span className="text-muted-foreground text-[11px]">Arrastra los bloques o usa Alt + ↑/↓ para ordenarlos</span>
                    </div>
                    <BlockEditor
                        value={data.blocks ?? []}
                        onChange={(blocks) => setData({ ...data, blocks })}
                        types={blockTypes}
                        allowedTypes={schema?.allowed_blocks ?? null}
                    />
                    <InputError message={errors.blocks ?? errors.content} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="excerpt" className="text-sm font-semibold">
                        Extracto / Resumen Corto
                    </Label>
                    <textarea
                        id="excerpt"
                        rows={3}
                        value={data.excerpt || ''}
                        onChange={(e) => setData({ ...data, excerpt: e.target.value })}
                        disabled={processing}
                        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Escribe una pequeña introducción o resumen..."
                    />
                    <InputError message={errors.excerpt} />
                </div>

                {/* Dynamic Custom Fields Schema */}
                {schema?.fields && schema.fields.length > 0 && (
                    <div className="border-border space-y-4 border-t pt-5">
                        <div className="text-foreground flex items-center gap-2 text-sm font-bold">
                            <Settings className="text-primary h-4 w-4" />
                            <span>Campos Personalizados ({schema.name})</span>
                        </div>
                        <div className="border-border bg-muted/50 space-y-4 rounded-xl border p-5">
                            <CustomFieldRenderer
                                fields={schema.fields}
                                values={data.metadata as Record<string, import('@/types/models/cms-article').JsonValue>}
                                onChange={(key: string, value: import('@/types/models/cms-article').JsonValue) => {
                                    const next = { ...data.metadata, [key]: value };
                                    setData({ ...data, metadata: next });
                                }}
                            />
                        </div>
                    </div>
                )}

                <div className="border-border border-t pt-5">
                    <SeoFields
                        values={
                            (data.metadata as { seo_title?: string; seo_description?: string; seo_keywords?: string; seo_og_image?: string }) || {}
                        }
                        onChange={(key: string, value: string) => {
                            const next = { ...data.metadata, [key]: value };
                            setData({ ...data, metadata: next as Record<string, import('@/types/models/cms-article').JsonValue> });
                        }}
                    />
                </div>
            </div>

            {/* Right Column: Settings, Images & Metadata */}
            <div className="space-y-6 lg:col-span-4">
                {/* Publish settings card */}
                <div className="border-border bg-card space-y-4 rounded-xl border p-4">
                    <h3 className="border-border text-foreground flex items-center gap-1.5 border-b pb-2 text-sm font-bold">
                        <Eye className="text-muted-foreground h-4 w-4" />
                        <span>Publicación</span>
                    </h3>

                    <div className="grid gap-2">
                        <Label htmlFor="status">Estado</Label>
                        <select
                            id="status"
                            value={data.status || 'draft'}
                            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            onChange={(e) => setData({ ...data, status: e.target.value })}
                            disabled={processing}
                        >
                            <option value="draft">Borrador</option>
                            <option value="published">Publicado</option>
                        </select>
                        <InputError message={errors.status} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="published_at" className="flex items-center gap-1">
                            <Calendar className="text-muted-foreground h-3.5 w-3.5" />
                            <span>Fecha de publicación</span>
                        </Label>
                        <input
                            id="published_at"
                            type="datetime-local"
                            value={getPublishedAtValue()}
                            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            onChange={handlePublishedAtChange}
                            disabled={processing}
                        />
                        <p className="text-muted-foreground text-[11px]">Una fecha futura programa la entrada.</p>
                        <InputError message={errors.published_at} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="user_id" className="flex items-center gap-1">
                            <User className="text-muted-foreground h-3.5 w-3.5" />
                            <span>Autor</span>
                        </Label>
                        <select
                            id="user_id"
                            value={data.user_id || ''}
                            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            onChange={(e) => setData({ ...data, user_id: Number(e.target.value) })}
                            disabled={processing}
                        >
                            {authors.map((a) => (
                                <option key={a.id} value={a.id}>
                                    {a.name} (@{a.username})
                                </option>
                            ))}
                        </select>
                        <InputError message={errors.user_id} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="schema_id">Campos Adicionales (Plantilla)</Label>
                        <select
                            id="schema_id"
                            value={data.schema_id || ''}
                            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            onChange={(e) => onChangeSchema(e.target.value ? Number(e.target.value) : 0)}
                            disabled={processing}
                        >
                            <option value="">Sin Plantilla</option>
                            {schemas.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                        <InputError message={errors.schema_id} />
                    </div>
                </div>

                {/* Featured image card */}
                <div className="border-border bg-card space-y-3 rounded-xl border p-4">
                    <h3 className="border-border text-foreground flex items-center gap-1.5 border-b pb-2 text-sm font-bold">
                        <ImageIcon className="text-muted-foreground h-4 w-4" />
                        <span>Imagen Destacada</span>
                    </h3>

                    {data.featured_image ? (
                        <div className="space-y-3">
                            <div className="group border-border bg-muted/50 relative aspect-[16/10] w-full overflow-hidden rounded-lg border">
                                <img src={data.featured_image} alt="Imagen Destacada" className="h-full w-full object-cover" />
                                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                    <Button type="button" variant="secondary" size="sm" onClick={() => setMediaDrawerOpen(true)}>
                                        Reemplazar
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => setData({ ...data, featured_image: '' })}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setMediaDrawerOpen(true)}
                            className="group border-border hover:border-primary/40 flex aspect-[16/10] w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 transition-all"
                        >
                            <ImageIcon className="text-muted-foreground h-8 w-8 transition-transform group-hover:scale-105" />
                            <span className="text-muted-foreground text-xs font-medium">Asignar imagen destacada</span>
                        </button>
                    )}
                    <InputError message={errors.featured_image} />
                </div>

                {/* Tags */}
                <div className="border-border bg-card space-y-3 rounded-xl border p-4">
                    <h3 className="border-border text-foreground border-b pb-2 text-sm font-bold">Etiquetas</h3>
                    <TagField tags={tags} selected={data.tag_ids || []} onChange={(tagIds) => setData({ ...data, tag_ids: tagIds })} />
                    <InputError message={errors.tag_ids} />
                </div>
            </div>

            {/* Media Drawer for selecting Featured Image */}
            <QuickMediaDrawer
                isOpen={mediaDrawerOpen}
                onClose={() => setMediaDrawerOpen(false)}
                onSelect={handleSelectFeaturedImage}
                initialType="Images"
            />
        </div>
    );
}
