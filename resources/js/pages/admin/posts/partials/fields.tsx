import { useState } from 'react';
import InputError from '@/components/input-error';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CmsSchema } from '@/types/models/cms-schema';
import { CmsTaxonomy } from '@/types/models/cms-taxonomy';
import { CmsPost } from '@/types/models/cms-post';
import CustomFieldRenderer from '@/components/custom-field-renderer';
import TiptapEditor from '@/components/tiptap-editor';
import QuickMediaDrawer from '@/components/quick-media-drawer';
import SeoFields from '../../partials/seo-fields';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Trash2, Calendar, User, Eye, Settings } from 'lucide-react';

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
    cptLabelSingular
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
            slug: data.id ? data.slug : generatedSlug // auto-slug on create only
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Primary Post Content */}
            <div className="lg:col-span-8 space-y-6">
                <div className="grid gap-2">
                    <Label htmlFor="title" className="text-sm font-semibold">Título del {cptLabelSingular}</Label>
                    <Input
                        id="title"
                        type="text"
                        required
                        autoFocus
                        value={data.title || ''}
                        onChange={handleTitleChange}
                        disabled={processing}
                        className="text-base py-5"
                        placeholder={`Escribe el título de tu ${cptLabelSingular.toLowerCase()}...`}
                    />
                    <InputError message={errors.title} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="slug" className="text-xs text-zinc-400 font-semibold">Enlace Permanente (Slug)</Label>
                    <div className="flex items-center gap-1 text-xs">
                        <span className="text-zinc-400 font-mono">/{data.post_type !== 'post' ? `${data.post_type}/` : 'blog/'}</span>
                        <input
                            id="slug"
                            type="text"
                            required
                            value={data.slug || ''}
                            onChange={(e) => setData({ ...data, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                            disabled={processing}
                            className="bg-transparent border-b border-dashed border-zinc-300 dark:border-zinc-700 focus:outline-none focus:border-zinc-500 font-mono text-red-600 dark:text-red-400 max-w-full"
                        />
                    </div>
                    <InputError message={errors.slug} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="content" className="text-sm font-semibold">Cuerpo / Contenido</Label>
                    <div className="border border-input rounded-md overflow-hidden bg-background">
                        <TiptapEditor
                            value={data.content || ''}
                            onChange={(html) => setData({ ...data, content: html })}
                        />
                    </div>
                    <InputError message={errors.content} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="excerpt" className="text-sm font-semibold">Extracto / Resumen Corto</Label>
                    <textarea
                        id="excerpt"
                        rows={3}
                        value={data.excerpt || ''}
                        onChange={(e) => setData({ ...data, excerpt: e.target.value })}
                        disabled={processing}
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800"
                        placeholder="Escribe una pequeña introducción o resumen..."
                    />
                    <InputError message={errors.excerpt} />
                </div>

                {/* Dynamic Custom Fields Schema */}
                {schema?.fields && schema.fields.length > 0 && (
                    <div className="border-t pt-5 border-zinc-100 dark:border-zinc-800 space-y-4">
                        <div className="flex items-center gap-2 text-sm font-bold text-zinc-800 dark:text-zinc-200">
                            <Settings className="h-4 w-4 text-red-600 dark:text-red-500" />
                            <span>Campos Personalizados ({schema.name})</span>
                        </div>
                        <div className="bg-zinc-50/20 dark:bg-[#161615]/30 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4">
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

                <div className="border-t pt-5 border-zinc-100 dark:border-zinc-800">
                    <SeoFields
                        values={(data.metadata as { seo_title?: string; seo_description?: string; seo_keywords?: string; seo_og_image?: string }) || {}}
                        onChange={(key: string, value: string) => {
                            const next = { ...data.metadata, [key]: value };
                            setData({ ...data, metadata: next as Record<string, import('@/types/models/cms-article').JsonValue> });
                        }}
                    />
                </div>
            </div>

            {/* Right Column: Settings, Images & Metadata */}
            <div className="lg:col-span-4 space-y-6">
                {/* Publish settings card */}
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-4 bg-white dark:bg-[#161615]/20">
                    <h3 className="text-sm font-bold border-b pb-2 border-zinc-100 dark:border-zinc-800 flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200">
                        <Eye className="h-4 w-4 text-zinc-400" />
                        <span>Publicación</span>
                    </h3>

                    <div className="grid gap-2">
                        <Label htmlFor="status">Estado</Label>
                        <select
                            id="status"
                            value={data.status || 'draft'}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800"
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
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800"
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
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800"
                            onChange={(e) => setData({ ...data, user_id: Number(e.target.value) })}
                            disabled={processing}
                        >
                            {authors.map((a) => (
                                <option key={a.id} value={a.id}>{a.name} (@{a.username})</option>
                            ))}
                        </select>
                        <InputError message={errors.user_id} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="schema_id">Campos Adicionales (Plantilla)</Label>
                        <select
                            id="schema_id"
                            value={data.schema_id || ''}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800"
                            onChange={(e) => onChangeSchema(e.target.value ? Number(e.target.value) : 0)}
                            disabled={processing}
                        >
                            <option value="">Sin Plantilla</option>
                            {schemas.map((s) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                        <InputError message={errors.schema_id} />
                    </div>
                </div>

                {/* Featured image card */}
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-3 bg-white dark:bg-[#161615]/20">
                    <h3 className="text-sm font-bold border-b pb-2 border-zinc-100 dark:border-zinc-800 flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200">
                        <ImageIcon className="h-4 w-4 text-zinc-400" />
                        <span>Imagen Destacada</span>
                    </h3>

                    {data.featured_image ? (
                        <div className="space-y-3">
                            <div className="aspect-[16/10] w-full rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50 relative group">
                                <img
                                    src={data.featured_image}
                                    alt="Imagen Destacada"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setMediaDrawerOpen(true)}
                                    >
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
                            className="w-full aspect-[16/10] rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-800 hover:border-red-500/40 dark:hover:border-zinc-700 flex flex-col items-center justify-center p-4 gap-2 transition-all group"
                        >
                            <ImageIcon className="h-8 w-8 text-zinc-400 group-hover:scale-105 transition-transform" />
                            <span className="text-xs text-zinc-500 font-medium">Asignar imagen destacada</span>
                        </button>
                    )}
                    <InputError message={errors.featured_image} />
                </div>

                {/* Taxonomies Terms selectors */}
                {taxonomies && taxonomies.length > 0 && (
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-4 bg-white dark:bg-[#161615]/20">
                        <h3 className="text-sm font-bold border-b pb-2 border-zinc-100 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200">
                            Categorías / Etiquetas
                        </h3>

                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                            {taxonomies.map((taxonomy) => (
                                <div key={taxonomy.id} className="space-y-2 border-b border-zinc-100 dark:border-zinc-800 pb-3 last:border-b-0 last:pb-0">
                                    <Label className="text-xs uppercase tracking-wider font-bold text-zinc-400">{taxonomy.name}</Label>
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
                                                            className="text-xs font-normal text-zinc-600 dark:text-zinc-400 cursor-pointer"
                                                        >
                                                            {term.parent_id && <span className="text-zinc-400 mr-1">—</span>}
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
