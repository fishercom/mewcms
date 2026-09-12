import CustomFieldRenderer from '@/components/custom-field-renderer';
import InputError from '@/components/input-error';
import QuickMediaDrawer from '@/components/quick-media-drawer';
import TiptapEditor from '@/components/tiptap-editor';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { CmsArticle, CmsArticleForm, JsonValue } from '@/types/models/cms-article';
import { CmsSchema } from '@/types/models/cms-schema';
import { CmsTaxonomy } from '@/types/models/cms-taxonomy';
import { FileText, Globe, Image as ImageIcon, Settings, Sliders, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import SeoFields from '../../partials/seo-fields';

interface Props {
    data: CmsArticleForm;
    setData: (data: CmsArticleForm) => void;
    errors: Record<string, string>;
    processing: boolean;
    schema?: CmsSchema & { unique?: boolean };
    schemas?: (CmsSchema & { unique?: boolean })[];
    parents?: CmsArticle[];
    taxonomies?: CmsTaxonomy[];
    onChangeSchema?: (schemaId: number) => void;
}

export default function ArticleFields({
    data,
    setData,
    errors,
    processing,
    schema,
    schemas = [],
    parents = [],
    taxonomies,
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

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Column: Tabbed Content, Custom Fields & SEO */}
            <div className="space-y-6 lg:col-span-8">
                {/* Visual Tab Navigation Bar */}
                <div className="flex flex-wrap items-center gap-1.5 border-b border-border/70 pb-3">
                    <button
                        type="button"
                        onClick={() => setActiveTab('content')}
                        className={cn(
                            'inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer shadow-2xs',
                            activeTab === 'content'
                                ? 'bg-violet-600 text-white shadow-violet-500/20'
                                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                        )}
                    >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Contenido Principal</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('schema')}
                        className={cn(
                            'inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer shadow-2xs',
                            activeTab === 'schema'
                                ? 'bg-violet-600 text-white shadow-violet-500/20'
                                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                        )}
                    >
                        <Sliders className="h-3.5 w-3.5" />
                        <span>Campos del Esquema</span>
                        {hasSchemaFields && (
                            <span
                                className={cn(
                                    'ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-bold',
                                    activeTab === 'schema'
                                        ? 'bg-white/25 text-white'
                                        : 'bg-muted text-muted-foreground',
                                )}
                            >
                                {schema?.fields?.length}
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('seo')}
                        className={cn(
                            'inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer shadow-2xs',
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
                    <div className="space-y-6 animate-in fade-in duration-200">
                        <div className="space-y-2">
                            <Label htmlFor="title" className="font-semibold text-foreground">
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
                                <Label htmlFor="content" className="font-semibold text-foreground">
                                    Cuerpo del Contenido
                                </Label>
                                <span className="text-[11px] text-muted-foreground">Editor enriquecido interactivo</span>
                            </div>
                            <TiptapEditor value={data.content || ''} onChange={(value) => setData({ ...data, content: value })} />
                            <InputError message={errors.content} />
                        </div>

                        {/* Excerpt */}
                        <div className="space-y-2">
                            <Label htmlFor="excerpt" className="font-semibold text-foreground">
                                Extracto / Resumen Corto
                            </Label>
                            <textarea
                                id="excerpt"
                                value={data.excerpt || ''}
                                onChange={(e) => setData({ ...data, excerpt: e.target.value })}
                                rows={3}
                                className="w-full rounded-xl border border-input bg-transparent p-3 text-sm text-foreground transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-hidden"
                                placeholder="Escribe un breve extracto que resuma el propósito de la página..."
                            />
                            <InputError message={errors.excerpt} />
                        </div>
                    </div>
                )}

                {/* Tab 2: Custom Schema Fields */}
                {activeTab === 'schema' && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                        {hasSchemaFields ? (
                            <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-xs space-y-4">
                                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                                            <Sliders className="h-3.5 w-3.5" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                                                Campos Personalizados ({schema?.name})
                                            </h4>
                                            <p className="text-[11px] text-muted-foreground">
                                                Valores dinámicos configurados para esta plantilla
                                            </p>
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
                        ) : (
                            <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-10 text-center">
                                <Sliders className="mx-auto mb-3 h-8 w-8 text-muted-foreground/60 stroke-[1.5]" />
                                <h4 className="text-sm font-semibold text-foreground">
                                    {schema ? 'La plantilla actual no tiene campos adicionales' : 'Sin plantilla seleccionada'}
                                </h4>
                                <p className="mt-1 max-w-sm mx-auto text-xs text-muted-foreground">
                                    {schema
                                        ? 'Esta plantilla solo utiliza el contenido estándar. Puedes añadir campos personalizados en el módulo de Esquemas.'
                                        : 'Selecciona una plantilla en el panel lateral derecho para cargar sus campos dinámicos correspondientes.'}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Tab 3: SEO & Social Metadata */}
                {activeTab === 'seo' && (
                    <div className="space-y-6 animate-in fade-in duration-200">
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
                <div className="space-y-4 rounded-2xl border border-border/70 bg-card p-4 shadow-2xs">
                    <h3 className="flex items-center gap-1.5 border-b border-border/60 pb-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
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
                            className="h-9 w-full rounded-xl border border-input bg-transparent px-3 text-xs text-foreground transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-hidden"
                        >
                            <option value="published">Publicado</option>
                            <option value="draft">Borrador</option>
                        </select>
                        <InputError message={errors.status} />
                    </div>

                    {/* Template Selector */}
                    {schemas && schemas.length > 0 && (
                        <div className="space-y-1.5">
                            <Label htmlFor="schema_id">Plantilla / Schema</Label>
                            <select
                                id="schema_id"
                                value={data.schema_id || 'none'}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const newId = val === 'none' ? null : Number(val);
                                    setData({ ...data, schema_id: newId });
                                    if (onChangeSchema) {
                                        onChangeSchema(newId || 0);
                                    }
                                }}
                                className="h-9 w-full rounded-xl border border-input bg-transparent px-3 text-xs text-foreground transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-hidden"
                            >
                                <option value="none">Ninguna (Sin Plantilla)</option>
                                {schemas.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.schema_id} />
                        </div>
                    )}

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
                                    className="h-9 w-full rounded-xl border border-input bg-transparent px-3 text-xs text-foreground transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-hidden"
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
                        <Label htmlFor="active" className="cursor-pointer text-xs font-semibold text-foreground">
                            Activo (Visible en sitio y menús)
                        </Label>
                    </div>
                </div>

                {/* Featured Image Card */}
                <div className="space-y-4 rounded-2xl border border-border/70 bg-card p-4 shadow-2xs">
                    <Label className="block text-xs font-bold tracking-wider text-muted-foreground uppercase">
                        Imagen Destacada
                    </Label>
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
                                className="flex h-9 w-full items-center gap-1.5 rounded-xl border-border/70 text-xs font-medium shadow-2xs"
                                onClick={() => setMediaOpen(true)}
                            >
                                <ImageIcon className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                                <span>Elegir Imagen</span>
                            </Button>
                            {data.featured_image && (
                                <button
                                    type="button"
                                    onClick={() => setData({ ...data, featured_image: '' })}
                                    className="rounded-lg p-2 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 transition-colors"
                                    title="Quitar imagen"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        {data.featured_image && (
                            <div className="aspect-[16/10] overflow-hidden rounded-xl border border-border/60 bg-muted/30 shadow-2xs">
                                <img src={data.featured_image} className="h-full w-full object-cover" alt="Featured" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Taxonomies Card */}
                {taxonomies && taxonomies.length > 0 && (
                    <div className="space-y-4 rounded-2xl border border-border/70 bg-card p-4 shadow-2xs">
                        <Label className="block text-xs font-bold tracking-wider text-muted-foreground uppercase">
                            Taxonomías & Categorías
                        </Label>
                        <div className="space-y-3">
                            {taxonomies.map((taxonomy) => (
                                <div key={taxonomy.id} className="rounded-xl border border-border/60 bg-muted/20 p-3">
                                    <Label className="mb-2 block text-xs font-semibold text-foreground capitalize">
                                        {taxonomy.name}
                                    </Label>
                                    <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                                        {taxonomy.terms && taxonomy.terms.length > 0 ? (
                                            taxonomy.terms.map((term) => {
                                                const isChecked = data.term_ids?.includes(term.id) || false;
                                                return (
                                                    <div
                                                        key={term.id}
                                                        style={{ paddingLeft: term.parent_id ? '1.25rem' : '0' }}
                                                        className="flex items-center space-x-2"
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
                                                            className="cursor-pointer text-xs font-normal text-muted-foreground hover:text-foreground"
                                                        >
                                                            {term.parent_id && <span className="mr-1 text-muted-foreground/60">—</span>}
                                                            {term.name}
                                                        </Label>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <span className="text-[11px] text-muted-foreground italic">No hay términos.</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
