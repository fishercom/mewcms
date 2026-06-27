import React, { useEffect, useState } from 'react';
import InputError from '@/components/input-error';
import { Checkbox } from '@/components/ui/checkbox';
import { CmsArticle, CmsArticleForm, JsonValue } from '@/types/models/cms-article';
import CustomFieldRenderer from '@/components/custom-field-renderer';
import SeoFields from '../../partials/seo-fields';
import TiptapEditor from '@/components/tiptap-editor';
import QuickMediaDrawer from '@/components/quick-media-drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CmsSchema } from '@/types/models/cms-schema';
import { CmsTaxonomy } from '@/types/models/cms-taxonomy';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Trash2, Settings, FileText } from 'lucide-react';

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

    useEffect(() => {
        if (schema?.unique && data.parent_id !== null) {
            setData({ ...data, parent_id: null });
        }
    }, [schema, data.parent_id]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Main Fields, Content & Custom Fields */}
            <div className="lg:col-span-8 space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="title" className="text-zinc-700 dark:text-zinc-300 font-semibold">Título</Label>
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
                        placeholder="Introduce el título de la página"
                    />
                    <InputError message={errors.title} />
                </div>

                {/* Default Page Content Editor (WordPress-style) */}
                <div className="space-y-2">
                    <Label htmlFor="content" className="text-zinc-700 dark:text-zinc-300 font-semibold">Contenido de la Página</Label>
                    <TiptapEditor
                        value={data.content || ''}
                        onChange={(value) => setData({ ...data, content: value })}
                    />
                    <InputError message={errors.content} />
                </div>

                {/* Default Page Excerpt */}
                <div className="space-y-2">
                    <Label htmlFor="excerpt" className="text-zinc-700 dark:text-zinc-300 font-semibold">Extracto / Resumen</Label>
                    <textarea
                        id="excerpt"
                        value={data.excerpt || ''}
                        onChange={(e) => setData({ ...data, excerpt: e.target.value })}
                        rows={3}
                        className="w-full p-3 text-sm bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                        placeholder="Escribe un breve extracto que resuma el propósito de la página..."
                    />
                    <InputError message={errors.excerpt} />
                </div>

                {/* Dynamic Custom Fields from Template Schema */}
                {schema?.fields?.length ? (
                    <div className="space-y-4 bg-zinc-50/10 dark:bg-zinc-900/10 rounded-xl p-5 border border-zinc-150 dark:border-zinc-850">
                        <Label className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 border-b pb-2 border-zinc-100 dark:border-zinc-850">
                            <FileText className="h-4 w-4 text-red-600" />
                            <span>Campos Personalizados ({schema.name})</span>
                        </Label>
                        <CustomFieldRenderer
                            fields={schema.fields}
                            values={data.metadata as Record<string, JsonValue>}
                            onChange={(key: string, value: JsonValue) => {
                                const next = { ...data.metadata, [key]: value };
                                setData({ ...data, metadata: next });
                            }}
                        />
                    </div>
                ) : null}

                {/* SEO Panel Accordion */}
                <div className="pt-4">
                    <SeoFields
                        values={(data.metadata as { seo_title?: string; seo_description?: string; seo_keywords?: string; seo_og_image?: string }) || {}}
                        onChange={(key: string, value: string) => {
                            const next = { ...data.metadata, [key]: value };
                            setData({ ...data, metadata: next as Record<string, JsonValue> });
                        }}
                    />
                </div>
            </div>

            {/* Right Column: Settings, Images & Metadata */}
            <div className="lg:col-span-4 space-y-6">
                {/* Publish & Parent Card */}
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-4 bg-white dark:bg-[#161615]/20 shadow-xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 pb-2 border-b border-zinc-100 dark:border-zinc-850">
                        <Settings className="h-3.5 w-3.5" />
                        <span>Ajustes de Página</span>
                    </h3>

                    {/* Status */}
                    <div className="space-y-1.5">
                        <Label htmlFor="status">Estado</Label>
                        <select
                            id="status"
                            value={data.status || 'published'}
                            onChange={(e) => setData({ ...data, status: e.target.value })}
                            className="w-full h-9 px-3 border border-zinc-200 dark:border-zinc-850 bg-transparent rounded-lg text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                        >
                            <option value="published">Publicado</option>
                            <option value="draft">Borrador</option>
                        </select>
                        <InputError message={errors.status} />
                    </div>

                    {/* Template Selector (Sin Plantilla is nullable schema_id) */}
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
                                className="w-full h-9 px-3 border border-zinc-200 dark:border-zinc-850 bg-transparent rounded-lg text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
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
                        <div className="grid gap-2 border border-amber-200 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-950/10 rounded-md p-3">
                            <span className="text-[11px] text-amber-800 dark:text-amber-200">
                                🔒 **Plantilla Única:** Las plantillas únicas no pueden tener páginas superiores.
                            </span>
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
                                    className="w-full h-9 px-3 border border-zinc-200 dark:border-zinc-850 bg-transparent rounded-lg text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                                >
                                    <option value="root">Página Raíz (Ninguna)</option>
                                    {parents.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.depth && p.depth > 0 ? "—".repeat(p.depth) + " " : ""}{p.title}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.parent_id} />
                            </div>
                        )
                    )}

                    {/* Active */}
                    <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                            id="active"
                            name="active"
                            checked={Boolean(data.active)}
                            onClick={() => setData({ ...data, active: !data.active })}
                        />
                        <Label htmlFor="active" className="cursor-pointer text-xs font-semibold text-zinc-700 dark:text-zinc-300">Activo (Visible en menús)</Label>
                    </div>
                </div>

                {/* Featured Image Card */}
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-4 bg-white dark:bg-[#161615]/20 shadow-xs">
                    <Label className="font-bold block text-sm">Imagen Destacada</Label>
                    <div className="space-y-2">
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
                                className="w-full flex items-center gap-1.5 text-xs h-9"
                                onClick={() => setMediaOpen(true)}
                            >
                                <ImageIcon className="h-3.5 w-3.5" />
                                <span>Elegir Imagen</span>
                            </Button>
                            {data.featured_image && (
                                <button
                                    type="button"
                                    onClick={() => setData({ ...data, featured_image: '' })}
                                    className="text-zinc-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        {data.featured_image && (
                            <div className="aspect-[16/10] overflow-hidden rounded-lg border border-zinc-250 dark:border-zinc-800 shadow-xs bg-zinc-50">
                                <img src={data.featured_image} className="w-full h-full object-cover" alt="Featured" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Taxonomies Card */}
                {taxonomies && taxonomies.length > 0 && (
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-4 bg-white dark:bg-[#161615]/20 shadow-xs">
                        <Label className="text-sm font-bold block">Taxonomías</Label>
                        <div className="space-y-4">
                            {taxonomies.map((taxonomy) => (
                                <div key={taxonomy.id} className="border border-zinc-100 dark:border-zinc-850 rounded-lg p-3 bg-zinc-50/50 dark:bg-transparent">
                                    <Label className="font-semibold block mb-2 text-xs text-zinc-500 dark:text-zinc-400 capitalize">{taxonomy.name}</Label>
                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
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
                                                        <Label htmlFor={`term-${term.id}`} className="text-xs font-normal text-zinc-600 dark:text-zinc-400 cursor-pointer">
                                                            {term.parent_id && <span className="text-zinc-400 mr-1">—</span>}
                                                            {term.name}
                                                        </Label>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <span className="text-[11px] text-zinc-400 italic">No hay términos.</span>
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
