import CustomFieldRenderer from '@/components/custom-field-renderer';
import InputError from '@/components/input-error';
import QuickMediaDrawer from '@/components/quick-media-drawer';
import TagField from '@/components/tag-field';
import TiptapEditor from '@/components/tiptap-editor';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { CmsArticle, CmsArticleForm, JsonValue } from '@/types/models/cms-article';
import { CmsSchema } from '@/types/models/cms-schema';
import { CmsTag } from '@/types/models/cms-tag';
import { usePage } from '@inertiajs/react';
import { FileText, Globe, Image as ImageIcon, Settings, Sliders, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import SeoFields from '../../partials/seo-fields';

/** A page template file, with the field groups (schemas) that use it. */
export interface PageTemplate {
    name: string;
    value: string;
    file: string;
    unique: boolean;
    used_by: { id: number; title: string } | null;
    schema_ids: number[];
}

interface Props {
    data: CmsArticleForm;
    setData: (data: CmsArticleForm) => void;
    errors: Record<string, string>;
    processing: boolean;
    schema?: CmsSchema & { unique?: boolean };
    schemas?: (CmsSchema & { unique?: boolean })[];
    templates?: PageTemplate[];
    parents?: CmsArticle[];
    tags?: CmsTag[];
    onChangeSchema?: (schemaId: number) => void;
}

export default function ArticleFields({
    data,
    setData,
    errors,
    processing,
    schema,
    schemas = [],
    templates = [],
    parents = [],
    tags = [],
    onChangeSchema,
}: Props) {
    const [mediaOpen, setMediaOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'content' | 'schema' | 'seo'>('content');

    useEffect(() => {
        if (schema?.unique && data.parent_id !== null) {
            setData({ ...data, parent_id: null });
        }
    }, [schema, data, setData]);

    const hasSchemaFields = Boolean(schema?.fields && schema.fields.length > 0);
    const { auth } = usePage<{ auth?: { permissions?: { super_admin?: boolean; modules?: Record<string, string[]> } | null } }>().props;
    const canManageSchemas = Boolean(auth?.permissions?.super_admin || auth?.permissions?.modules?.schemas?.includes('administrar'));

    const currentTemplate = templates.find((t) => data.schema_id !== null && t.schema_ids.includes(data.schema_id));

    const selectSchema = (schemaId: number | null) => {
        setData({ ...data, schema_id: schemaId });
        onChangeSchema?.(schemaId ?? 0);
    };

    // The fields tab disappears when the chosen template has no fields
    useEffect(() => {
        if (activeTab === 'schema' && !hasSchemaFields) setActiveTab('content');
    }, [activeTab, hasSchemaFields]);

    // Format datetime-local value (YYYY-MM-DDTHH:MM)
    const getPublishedAtValue = () => {
        if (!data.published_at) return '';
        const d = new Date(data.published_at);
        if (isNaN(d.getTime())) return '';
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Column: Tabbed Content, Custom Fields & SEO */}
            <div className="space-y-6 lg:col-span-8">
                {/* Visual Tab Navigation Bar */}
                <div className="border-border/70 flex flex-wrap items-center gap-1.5 border-b pb-3">
                    <button
                        type="button"
                        onClick={() => setActiveTab('content')}
                        className={cn(
                            'inline-flex cursor-pointer items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold shadow-2xs transition-all',
                            activeTab === 'content'
                                ? 'bg-violet-600 text-white shadow-violet-500/20'
                                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                        )}
                    >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Contenido Principal</span>
                    </button>

                    {hasSchemaFields && (
                        <button
                            type="button"
                            onClick={() => setActiveTab('schema')}
                            className={cn(
                                'inline-flex cursor-pointer items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold shadow-2xs transition-all',
                                activeTab === 'schema'
                                    ? 'bg-violet-600 text-white shadow-violet-500/20'
                                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                            )}
                        >
                            <Sliders className="h-3.5 w-3.5" />
                            <span>Campos</span>
                            <span
                                className={cn(
                                    'py-0.2 ml-0.5 rounded-full px-1.5 text-[10px] font-bold',
                                    activeTab === 'schema' ? 'bg-white/25 text-white' : 'bg-muted text-muted-foreground',
                                )}
                            >
                                {schema?.fields?.length}
                            </span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => setActiveTab('seo')}
                        className={cn(
                            'inline-flex cursor-pointer items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold shadow-2xs transition-all',
                            activeTab === 'seo'
                                ? 'bg-violet-600 text-white shadow-violet-500/20'
                                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                        )}
                    >
                        <Globe className="h-3.5 w-3.5" />
                        <span>SEO & Metadatos</span>
                    </button>
                </div>

                {/* Tab 1: Main Content */}
                {activeTab === 'content' && (
                    <div className="animate-in fade-in space-y-6 duration-200">
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-foreground font-semibold">
                                Título de la Página <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                id="title"
                                type="text"
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="title"
                                value={data.title}
                                onChange={(e) => setData({ ...data, title: e.target.value })}
                                disabled={processing}
                                placeholder="Introduce el título de la página..."
                                className="h-10 text-sm font-medium"
                            />
                            <InputError message={errors.title} />
                        </div>

                        {/* Rich Text Editor */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="content" className="text-foreground font-semibold">
                                    Cuerpo del Contenido
                                </Label>
                                <span className="text-muted-foreground text-[11px]">Editor enriquecido interactivo</span>
                            </div>
                            <TiptapEditor value={data.content || ''} onChange={(value) => setData({ ...data, content: value })} />
                            <InputError message={errors.content} />
                        </div>

                        {/* Excerpt */}
                        <div className="space-y-2">
                            <Label htmlFor="excerpt" className="text-foreground font-semibold">
                                Extracto / Resumen Corto
                            </Label>
                            <textarea
                                id="excerpt"
                                value={data.excerpt || ''}
                                onChange={(e) => setData({ ...data, excerpt: e.target.value })}
                                rows={3}
                                className="border-input text-foreground w-full rounded-xl border bg-transparent p-3 text-sm transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-hidden"
                                placeholder="Escribe un breve extracto que resuma el propósito de la página..."
                            />
                            <InputError message={errors.excerpt} />
                        </div>
                    </div>
                )}

                {/* Tab 2: Custom fields of the template */}
                {activeTab === 'schema' && hasSchemaFields && (
                    <div className="animate-in fade-in space-y-6 duration-200">
                        <div className="border-border/70 bg-card space-y-4 rounded-2xl border p-5 shadow-xs">
                            <div className="border-border/60 flex items-center justify-between border-b pb-3">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                                        <Sliders className="h-3.5 w-3.5" />
                                    </div>
                                    <div>
                                        <h4 className="text-foreground text-xs font-bold tracking-wider uppercase">Campos de {schema?.name}</h4>
                                        <p className="text-muted-foreground text-[11px]">Valores dinámicos configurados para esta plantilla</p>
                                    </div>
                                </div>
                                <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-600 dark:text-violet-400">
                                    {schema?.fields?.length} campos
                                </span>
                            </div>

                            <CustomFieldRenderer
                                fields={schema?.fields || []}
                                values={data.metadata as Record<string, JsonValue>}
                                onChange={(key: string, value: JsonValue) => {
                                    const next = { ...data.metadata, [key]: value };
                                    setData({ ...data, metadata: next });
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Tab 3: SEO & Social Metadata */}
                {activeTab === 'seo' && (
                    <div className="animate-in fade-in space-y-6 duration-200">
                        <SeoFields
                            values={
                                (data.metadata as {
                                    seo_title?: string;
                                    seo_description?: string;
                                    seo_keywords?: string;
                                    seo_og_image?: string;
                                }) || {}
                            }
                            onChange={(key: string, value: string) => {
                                const next = { ...data.metadata, [key]: value };
                                setData({ ...data, metadata: next as Record<string, JsonValue> });
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Right Column: Settings, Images & Metadata */}
            <div className="space-y-6 lg:col-span-4">
                {/* Publish & Parent Card */}
                <div className="border-border/70 bg-card space-y-4 rounded-2xl border p-4 shadow-2xs">
                    <h3 className="border-border/60 text-muted-foreground flex items-center gap-1.5 border-b pb-2 text-xs font-bold tracking-wider uppercase">
                        <Settings className="h-3.5 w-3.5" />
                        <span>Ajustes de Publicación</span>
                    </h3>

                    {/* Status */}
                    <div className="space-y-1.5">
                        <Label htmlFor="status">Estado</Label>
                        <select
                            id="status"
                            value={data.status || 'published'}
                            onChange={(e) => setData({ ...data, status: e.target.value })}
                            className="border-input text-foreground h-9 w-full rounded-xl border bg-transparent px-3 text-xs transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-hidden"
                        >
                            <option value="published">Publicado</option>
                            <option value="draft">Borrador</option>
                        </select>
                        <InputError message={errors.status} />
                    </div>

                    {/* Publication date: a future date schedules the page */}
                    <div className="space-y-1.5">
                        <Label htmlFor="published_at">Fecha de publicación</Label>
                        <input
                            id="published_at"
                            type="datetime-local"
                            value={getPublishedAtValue()}
                            onChange={(e) => setData({ ...data, published_at: e.target.value })}
                            className="border-input text-foreground h-9 w-full rounded-xl border bg-transparent px-3 text-xs transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-hidden"
                        />
                        <p className="text-muted-foreground text-[11px]">Vacío para publicar de inmediato. Una fecha futura programa la página.</p>
                        <InputError message={errors.published_at} />
                    </div>

                    {/* Template: the design file. Behind it, a field group (schema) gives the page its custom fields */}
                    <div className="space-y-1.5">
                        <Label htmlFor="template">Plantilla</Label>
                        <select
                            id="template"
                            value={currentTemplate?.value ?? ''}
                            onChange={(e) => {
                                const template = templates.find((t) => t.value === e.target.value);
                                selectSchema(template?.schema_ids[0] ?? null);
                            }}
                            className="border-input text-foreground h-9 w-full rounded-xl border bg-transparent px-3 text-xs transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-hidden"
                        >
                            {!currentTemplate && <option value="">Elige una plantilla</option>}
                            {templates.map((t) => (
                                <option key={t.value} value={t.value} disabled={Boolean(t.used_by) || t.schema_ids.length === 0}>
                                    {t.name}
                                    {t.used_by ? ` — Ya la usa «${t.used_by.title}»` : ''}
                                </option>
                            ))}
                        </select>

                        {/* Only when a template has several field groups */}
                        {currentTemplate && currentTemplate.schema_ids.length > 1 && (
                            <select
                                id="schema_id"
                                aria-label="Campos"
                                value={data.schema_id ?? ''}
                                onChange={(e) => selectSchema(Number(e.target.value))}
                                className="border-input text-foreground h-9 w-full rounded-xl border bg-transparent px-3 text-xs transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-hidden"
                            >
                                {currentTemplate.schema_ids.map((id) => (
                                    <option key={id} value={id}>
                                        Campos: {schemas.find((s) => s.id === id)?.name}
                                    </option>
                                ))}
                            </select>
                        )}

                        {schema && !hasSchemaFields && canManageSchemas && (
                            <p className="text-muted-foreground text-[11px]">
                                Esta plantilla no tiene campos personalizados.{' '}
                                <a
                                    href={`/admin/schemas/${schema.id}/edit`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="hover:text-foreground underline"
                                >
                                    Añadir campos
                                </a>
                            </p>
                        )}
                        <InputError message={errors.schema_id} />
                    </div>

                    {schema?.unique ? (
                        <div className="grid gap-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-[11px] text-amber-800 dark:text-amber-200">
                            <span className="font-semibold">🔒 Plantilla Única</span>
                            <span className="opacity-90">Las plantillas únicas no pueden tener páginas superiores.</span>
                        </div>
                    ) : (
                        parents && (
                            <div className="space-y-1.5">
                                <Label htmlFor="parent_id">Página Superior (Padre)</Label>
                                <select
                                    id="parent_id"
                                    value={data.parent_id || 'root'}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setData({ ...data, parent_id: val === 'root' ? null : Number(val) });
                                    }}
                                    className="border-input text-foreground h-9 w-full rounded-xl border bg-transparent px-3 text-xs transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-hidden"
                                >
                                    <option value="root">Página Raíz (Ninguna)</option>
                                    {parents.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.depth && p.depth > 0 ? '—'.repeat(p.depth) + ' ' : ''}
                                            {p.title}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.parent_id} />
                            </div>
                        )
                    )}

                    {/* Active Checkbox */}
                    <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                            id="active"
                            name="active"
                            checked={Boolean(data.active)}
                            onClick={() => setData({ ...data, active: !data.active })}
                        />
                        <Label htmlFor="active" className="text-foreground cursor-pointer text-xs font-semibold">
                            Activo (Visible en sitio y menús)
                        </Label>
                    </div>
                </div>

                {/* Featured Image Card */}
                <div className="border-border/70 bg-card space-y-4 rounded-2xl border p-4 shadow-2xs">
                    <Label className="text-muted-foreground block text-xs font-bold tracking-wider uppercase">Imagen Destacada</Label>
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <QuickMediaDrawer
                                isOpen={mediaOpen}
                                onClose={() => setMediaOpen(false)}
                                onSelect={(url) => {
                                    setData({ ...data, featured_image: url });
                                    setMediaOpen(false);
                                }}
                                initialType="Images"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                className="border-border/70 flex h-9 w-full items-center gap-1.5 rounded-xl text-xs font-medium shadow-2xs"
                                onClick={() => setMediaOpen(true)}
                            >
                                <ImageIcon className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                                <span>Elegir Imagen</span>
                            </Button>
                            {data.featured_image && (
                                <button
                                    type="button"
                                    onClick={() => setData({ ...data, featured_image: '' })}
                                    className="text-muted-foreground rounded-lg p-2 transition-colors hover:bg-rose-50 hover:text-rose-600"
                                    title="Quitar imagen"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        {data.featured_image && (
                            <div className="border-border/60 bg-muted/30 aspect-[16/10] overflow-hidden rounded-xl border shadow-2xs">
                                <img src={data.featured_image} className="h-full w-full object-cover" alt="Featured" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Tags */}
                <div className="border-border/70 bg-card space-y-3 rounded-2xl border p-4 shadow-2xs">
                    <h3 className="border-border/60 text-muted-foreground border-b pb-2 text-xs font-bold tracking-wider uppercase">Etiquetas</h3>
                    <TagField tags={tags} selected={data.tag_ids || []} onChange={(tagIds) => setData({ ...data, tag_ids: tagIds })} />
                    <InputError message={errors.tag_ids} />
                </div>
            </div>
        </div>
    );
}
