import CustomFieldRenderer from '@/components/custom-field-renderer';
import InputError from '@/components/input-error';
import QuickMediaDrawer from '@/components/quick-media-drawer';
import TiptapEditor from '@/components/tiptap-editor';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CmsPost } from '@/types/models/cms-post';
import { CmsSchema } from '@/types/models/cms-schema';
import { CmsTaxonomy } from '@/types/models/cms-taxonomy';
import { Calendar, Eye, Image as ImageIcon, Settings, Trash2, User } from 'lucide-react';
import { useState } from 'react';
import SeoFields from '../../partials/seo-fields';

interface Props {
    data: Partial<CmsPost> & { term_ids?: number[] };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setData: (data: any) => void;
    errors: Record<string, string>;
    processing: boolean;
    schemas: CmsSchema[];
    authors: { id: number; name: string; username: string }[];
    taxonomies: CmsTaxonomy[];
    schema: CmsSchema | null;
    onChangeSchema: (schemaId: number) => void;
    cptLabelSingular: string;
}

export default function PostFields({
    data,
    setData,
    errors,
    processing,
    schemas,
    authors,
    taxonomies,
    schema,
    onChangeSchema,
    cptLabelSingular,
}: Props) {
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
                    <Label htmlFor="slug" className="text-xs font-semibold text-zinc-400">
                        Enlace Permanente (Slug)
                    </Label>
                    <div className="flex items-center gap-1 text-xs">
                        <span className="font-mono text-zinc-400">/{data.post_type !== 'post' ? `${data.post_type}/` : 'blog/'}</span>
                        <input
                            id="slug"
                            type="text"
                            required
                            value={data.slug || ''}
                            onChange={(e) => setData({ ...data, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                            disabled={processing}
                            className="max-w-full border-b border-dashed border-zinc-300 bg-transparent font-mono text-red-600 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:text-red-400"
                        />
                    </div>
                    <InputError message={errors.slug} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="content" className="text-sm font-semibold">
                        Cuerpo / Contenido
                    </Label>
                    <div className="border-input bg-background overflow-hidden rounded-md border">
                        <TiptapEditor value={data.content || ''} onChange={(html) => setData({ ...data, content: html })} />
                    </div>
                    <InputError message={errors.content} />
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
                        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800"
                        placeholder="Escribe una pequeña introducción o resumen..."
                    />
                    <InputError message={errors.excerpt} />
                </div>

                {/* Dynamic Custom Fields Schema */}
                {schema?.fields && schema.fields.length > 0 && (
                    <div className="space-y-4 border-t border-zinc-100 pt-5 dark:border-zinc-800">
                        <div className="flex items-center gap-2 text-sm font-bold text-zinc-800 dark:text-zinc-200">
                            <Settings className="h-4 w-4 text-red-600 dark:text-red-500" />
                            <span>Campos Personalizados ({schema.name})</span>
                        </div>
                        <div className="space-y-4 rounded-xl border border-zinc-200 bg-zinc-50/20 p-5 dark:border-zinc-800 dark:bg-[#161615]/30">
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

                <div className="border-t border-zinc-100 pt-5 dark:border-zinc-800">
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
                <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-[#161615]/20">
                    <h3 className="flex items-center gap-1.5 border-b border-zinc-100 pb-2 text-sm font-bold text-zinc-800 dark:border-zinc-800 dark:text-zinc-200">
                        <Eye className="h-4 w-4 text-zinc-400" />
                        <span>Publicación</span>
                    </h3>

                    <div className="grid gap-2">
                        <Label htmlFor="status">Estado</Label>
                        <select
                            id="status"
                            value={data.status || 'draft'}
                            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800"
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
                            <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                            <span>Fecha de publicación</span>
                        </Label>
                        <input
                            id="published_at"
                            type="datetime-local"
                            value={getPublishedAtValue()}
                            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800"
                            onChange={handlePublishedAtChange}
                            disabled={processing}
                        />
                        <InputError message={errors.published_at} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="user_id" className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5 text-zinc-400" />
                            <span>Autor</span>
                        </Label>
                        <select
                            id="user_id"
                            value={data.user_id || ''}
                            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800"
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
                            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800"
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
                <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-[#161615]/20">
                    <h3 className="flex items-center gap-1.5 border-b border-zinc-100 pb-2 text-sm font-bold text-zinc-800 dark:border-zinc-800 dark:text-zinc-200">
                        <ImageIcon className="h-4 w-4 text-zinc-400" />
                        <span>Imagen Destacada</span>
                    </h3>

                    {data.featured_image ? (
                        <div className="space-y-3">
                            <div className="group relative aspect-[16/10] w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800">
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
                            className="group flex aspect-[16/10] w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-300 p-4 transition-all hover:border-red-500/40 dark:border-zinc-800 dark:hover:border-zinc-700"
                        >
                            <ImageIcon className="h-8 w-8 text-zinc-400 transition-transform group-hover:scale-105" />
                            <span className="text-xs font-medium text-zinc-500">Asignar imagen destacada</span>
                        </button>
                    )}
                    <InputError message={errors.featured_image} />
                </div>

                {/* Taxonomies Terms selectors */}
                {taxonomies && taxonomies.length > 0 && (
                    <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-[#161615]/20">
                        <h3 className="border-b border-zinc-100 pb-2 text-sm font-bold text-zinc-800 dark:border-zinc-800 dark:text-zinc-200">
                            Categorías / Etiquetas
                        </h3>

                        <div className="max-h-[300px] space-y-4 overflow-y-auto pr-1">
                            {taxonomies.map((taxonomy) => (
                                <div
                                    key={taxonomy.id}
                                    className="space-y-2 border-b border-zinc-100 pb-3 last:border-b-0 last:pb-0 dark:border-zinc-800"
                                >
                                    <Label className="text-xs font-bold tracking-wider text-zinc-400 uppercase">{taxonomy.name}</Label>
                                    <div className="space-y-1.5">
                                        {taxonomy.terms && taxonomy.terms.length > 0 ? (
                                            taxonomy.terms.map((term) => {
                                                const isChecked = data.term_ids?.includes(term.id) || false;
                                                return (
                                                    <div
                                                        key={term.id}
                                                        style={{ paddingLeft: term.parent_id ? '1rem' : '0' }}
                                                        className="flex items-center space-x-2.5"
                                                    >
                                                        <Checkbox
                                                            id={`term-${term.id}`}
                                                            checked={isChecked}
                                                            onClick={() => {
                                                                const termIds = data.term_ids || [];
                                                                const next = isChecked
                                                                    ? termIds.filter((id) => id !== term.id)
                                                                    : [...termIds, term.id];
                                                                setData({ ...data, term_ids: next });
                                                            }}
                                                        />
                                                        <Label
                                                            htmlFor={`term-${term.id}`}
                                                            className="cursor-pointer text-xs font-normal text-zinc-600 dark:text-zinc-400"
                                                        >
                                                            {term.parent_id && <span className="mr-1 text-zinc-400">—</span>}
                                                            {term.name}
                                                        </Label>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="text-[10px] text-zinc-400 italic">No hay términos registrados</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
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
