import { type BlockDefinition } from '@/blocks/types';
import AiAssistant from '@/components/ai-assistant';
import BlockEditor from '@/components/block-editor';
import CustomFieldRenderer from '@/components/custom-field-renderer';
import InputError from '@/components/input-error';
import QuickMediaDrawer from '@/components/quick-media-drawer';
import SeoReview, { SeoScoreBadge, useSeoReview } from '@/components/seo-review';
import TagField from '@/components/tag-field';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStarterLayout } from '@/hooks/use-starter-layout';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { CmsArticle, CmsArticleForm, JsonValue } from '@/types/models/cms-article';
import { CmsSchema } from '@/types/models/cms-schema';
import { CmsTag } from '@/types/models/cms-tag';
import { usePage } from '@inertiajs/react';
import { FileText, Globe, Image as ImageIcon, Settings, Sliders, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import SeoFields from '../../partials/seo-fields';

/** A menu the page can appear in. */
export interface PageMenu {
    id: number;
    name: string;
    auto_add_pages: boolean;
    auto_add_subpages: boolean;
    article_ids: number[];
}

/**
 * Menus a new page joins by default: those that add new top-level pages, or, for a
 * subpage, those that add subpages and already contain its parent.
 */
export const defaultMenuIds = (menus: PageMenu[], parentId: number | null): number[] =>
    menus.filter((m) => (parentId ? m.auto_add_subpages && m.article_ids.includes(parentId) : m.auto_add_pages)).map((m) => m.id);

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
    menus?: PageMenu[];
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
    menus = [],
    parents = [],
    tags = [],
    onChangeSchema,
}: Props) {
    const [mediaOpen, setMediaOpen] = useState(false);
    // The dashboard links here with ?tab=seo to open the review directly
    const [activeTab, setActiveTab] = useState<'content' | 'schema' | 'seo'>(() =>
        typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('tab') === 'seo' ? 'seo' : 'content',
    );
    const seo = useSeoReview('articles', data);

    useEffect(() => {
        if (schema?.unique && data.parent_id !== null) {
            setData({ ...data, parent_id: null });
        }
    }, [schema, data, setData]);

    const hasSchemaFields = Boolean(schema?.fields && schema.fields.length > 0);
    const { auth } = usePage<{ auth?: { permissions?: { super_admin?: boolean; modules?: Record<string, string[]> } | null } }>().props;
    const { blockTypes = [] } = usePage<{ blockTypes?: BlockDefinition[] }>().props;
    useStarterLayout(!data.id, schema, data.blocks ?? [], (blocks) => setData({ ...data, blocks }));
    const canManageSchemas = Boolean(auth?.permissions?.super_admin || auth?.permissions?.modules?.schemas?.includes('administrar'));

    const parentPrefix = `/${parents.find((p) => p.id === data.parent_id)?.uri ?? ''}${data.parent_id ? '/' : ''}`.replace('//', '/');

    const canManageMenus = Boolean(auth?.permissions?.super_admin || auth?.permissions?.modules?.menus?.includes('administrar'));
    const [menusTouched, setMenusTouched] = useState(false);

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
                                ? 'bg-primary shadow-primary/20 text-white'
                                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                        )}
                    >
                        <FileText className="h-3.5 w-3.5" />
                        <span>{t('Contenido Principal')}</span>
                    </button>

                    {hasSchemaFields && (
                        <button
                            type="button"
                            onClick={() => setActiveTab('schema')}
                            className={cn(
                                'inline-flex cursor-pointer items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold shadow-2xs transition-all',
                                activeTab === 'schema'
                                    ? 'bg-primary shadow-primary/20 text-white'
                                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                            )}
                        >
                            <Sliders className="h-3.5 w-3.5" />
                            <span>{t('Campos')}</span>
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
                                ? 'bg-primary shadow-primary/20 text-white'
                                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                        )}
                    >
                        <Globe className="h-3.5 w-3.5" />
                        <span>{t('SEO & Metadatos')}</span>
                        <SeoScoreBadge result={seo.result} className={activeTab === 'seo' ? 'bg-white/25' : ''} />
                    </button>

                    <AiAssistant
                        module="articles"
                        input={data}
                        className="ml-auto"
                        onApply={(field, value) =>
                            field === 'slug'
                                ? setData({ ...data, slug: value })
                                : setData({ ...data, metadata: { ...data.metadata, [field]: value } })
                        }
                        onDraft={(draft, mode) => {
                            setData({
                                ...data,
                                title: data.title || draft.title,
                                blocks: mode === 'append' ? [...(data.blocks ?? []), ...draft.blocks] : draft.blocks,
                            });
                            setActiveTab('content');
                        }}
                    />
                </div>

                {/* Tab 1: Main Content */}
                {activeTab === 'content' && (
                    <div className="animate-in fade-in space-y-6 duration-200">
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-foreground font-semibold">
                                {t('Título de la Página')} <span className="text-destructive">*</span>
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
                                placeholder={t('Introduce el título de la página...')}
                                className="h-10 text-sm font-medium"
                            />
                            <InputError message={errors.title} />
                        </div>

                        {/* Block editor */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-foreground font-semibold">{t('Contenido')}</Label>
                                <span className="text-muted-foreground text-[11px]">{t('Arrastra los bloques o usa Alt + ↑/↓ para ordenarlos')}</span>
                            </div>
                            <BlockEditor
                                value={data.blocks ?? []}
                                onChange={(blocks) => setData({ ...data, blocks })}
                                types={blockTypes}
                                allowedTypes={schema?.allowed_blocks ?? null}
                            />
                            <InputError message={errors.blocks ?? errors.content} />
                        </div>

                        {/* Excerpt */}
                        <div className="space-y-2">
                            <Label htmlFor="excerpt" className="text-foreground font-semibold">
                                {t('Extracto / Resumen Corto')}
                            </Label>
                            <textarea
                                id="excerpt"
                                value={data.excerpt || ''}
                                onChange={(e) => setData({ ...data, excerpt: e.target.value })}
                                rows={3}
                                className="border-input text-foreground focus:border-primary focus:ring-primary/20 w-full rounded-xl border bg-transparent p-3 text-sm transition-all focus:ring-2 focus:outline-hidden"
                                placeholder={t('Escribe un breve extracto que resuma el propósito de la página...')}
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
                                    <div className="bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-lg">
                                        <Sliders className="h-3.5 w-3.5" />
                                    </div>
                                    <div>
                                        <h4 className="text-foreground text-xs font-bold tracking-wider uppercase">
                                            {t('Campos de')} {schema?.name}
                                        </h4>
                                        <p className="text-muted-foreground text-[11px]">{t('Valores dinámicos configurados para esta plantilla')}</p>
                                    </div>
                                </div>
                                <span className="border-primary/20 bg-primary/10 text-primary rounded-full border px-2 py-0.5 text-[10px] font-semibold">
                                    {t(':count campos', { count: schema?.fields?.length ?? 0 })}
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
                        <SeoReview result={seo.result} loading={seo.loading} />
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
                        <span>{t('Ajustes de Publicación')}</span>
                    </h3>

                    {/* Status */}
                    <div className="space-y-1.5">
                        <Label htmlFor="status">{t('Estado')}</Label>
                        <select
                            id="status"
                            value={data.status || 'published'}
                            onChange={(e) => setData({ ...data, status: e.target.value })}
                            className="border-input text-foreground focus:border-primary focus:ring-primary/20 h-9 w-full rounded-xl border bg-transparent px-3 text-xs transition-colors focus:ring-2 focus:outline-hidden"
                        >
                            <option value="published">{t('Publicado')}</option>
                            <option value="draft">{t('Borrador')}</option>
                        </select>
                        <InputError message={errors.status} />
                    </div>

                    {/* Publication date: a future date schedules the page */}
                    <div className="space-y-1.5">
                        <Label htmlFor="published_at">{t('Fecha de publicación')}</Label>
                        <input
                            id="published_at"
                            type="datetime-local"
                            value={getPublishedAtValue()}
                            onChange={(e) => setData({ ...data, published_at: e.target.value })}
                            className="border-input text-foreground focus:border-primary focus:ring-primary/20 h-9 w-full rounded-xl border bg-transparent px-3 text-xs transition-colors focus:ring-2 focus:outline-hidden"
                        />
                        <p className="text-muted-foreground text-[11px]">
                            {t('Vacío para publicar de inmediato. Una fecha futura programa la página.')}
                        </p>
                        <InputError message={errors.published_at} />
                    </div>

                    {/* Template: the design file. Behind it, a field group (schema) gives the page its custom fields */}
                    <div className="space-y-1.5">
                        <Label htmlFor="template">{t('Plantilla')}</Label>
                        <select
                            id="template"
                            value={currentTemplate?.value ?? ''}
                            onChange={(e) => {
                                const template = templates.find((t) => t.value === e.target.value);
                                selectSchema(template?.schema_ids[0] ?? null);
                            }}
                            className="border-input text-foreground focus:border-primary focus:ring-primary/20 h-9 w-full rounded-xl border bg-transparent px-3 text-xs transition-colors focus:ring-2 focus:outline-hidden"
                        >
                            {!currentTemplate && <option value="">{t('Elige una plantilla')}</option>}
                            {templates.map((tpl) => (
                                <option key={tpl.value} value={tpl.value} disabled={Boolean(tpl.used_by) || tpl.schema_ids.length === 0}>
                                    {tpl.name}
                                    {tpl.used_by ? ` — ${t('Ya la usa «:title»', { title: tpl.used_by.title })}` : ''}
                                </option>
                            ))}
                        </select>

                        {/* Only when a template has several field groups */}
                        {currentTemplate && currentTemplate.schema_ids.length > 1 && (
                            <select
                                id="schema_id"
                                aria-label={t('Campos')}
                                value={data.schema_id ?? ''}
                                onChange={(e) => selectSchema(Number(e.target.value))}
                                className="border-input text-foreground focus:border-primary focus:ring-primary/20 h-9 w-full rounded-xl border bg-transparent px-3 text-xs transition-colors focus:ring-2 focus:outline-hidden"
                            >
                                {currentTemplate.schema_ids.map((id) => (
                                    <option key={id} value={id}>
                                        {t('Campos:')} {schemas.find((s) => s.id === id)?.name}
                                    </option>
                                ))}
                            </select>
                        )}

                        {schema && !hasSchemaFields && canManageSchemas && (
                            <p className="text-muted-foreground text-[11px]">
                                {t('Esta plantilla no tiene campos personalizados.')}{' '}
                                <a
                                    href={`/admin/schemas/${schema.id}/edit`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="hover:text-foreground underline"
                                >
                                    {t('Añadir campos')}
                                </a>
                            </p>
                        )}
                        <InputError message={errors.schema_id} />
                    </div>

                    {schema?.unique ? (
                        <div className="border-warning/20 bg-warning/10 text-warning grid gap-1.5 rounded-xl border p-3 text-[11px]">
                            <span className="font-semibold">{t('🔒 Plantilla Única')}</span>
                            <span className="opacity-90">{t('Las plantillas únicas no pueden tener páginas superiores.')}</span>
                        </div>
                    ) : (
                        parents && (
                            <div className="space-y-1.5">
                                <Label htmlFor="parent_id">{t('Página Superior (Padre)')}</Label>
                                <select
                                    id="parent_id"
                                    value={data.parent_id || 'root'}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        const parentId = val === 'root' ? null : Number(val);
                                        // A new page follows the menus' auto-add rules until the user picks menus
                                        setData({
                                            ...data,
                                            parent_id: parentId,
                                            ...(!data.id && !menusTouched ? { menu_ids: defaultMenuIds(menus, parentId) } : {}),
                                        });
                                    }}
                                    className="border-input text-foreground focus:border-primary focus:ring-primary/20 h-9 w-full rounded-xl border bg-transparent px-3 text-xs transition-colors focus:ring-2 focus:outline-hidden"
                                >
                                    <option value="root">{t('Página Raíz (Ninguna)')}</option>
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

                    {/* URL: the last segment; the parent path comes from the parent page */}
                    <div className="space-y-1.5">
                        <Label htmlFor="slug">{t('URL')}</Label>
                        <div className="border-input focus-within:border-primary focus-within:ring-primary/20 flex h-9 items-center overflow-hidden rounded-xl border text-xs focus-within:ring-2">
                            <span className="text-muted-foreground bg-muted/40 max-w-[55%] truncate px-2 font-mono" title={parentPrefix}>
                                {parentPrefix}
                            </span>
                            <input
                                id="slug"
                                value={data.slug}
                                onChange={(e) => setData({ ...data, slug: e.target.value })}
                                placeholder={data.id ? '' : t('se genera del título')}
                                className="text-foreground h-full min-w-0 flex-1 bg-transparent px-2 font-mono outline-none"
                            />
                        </div>
                        {data.id && (
                            <p className="text-muted-foreground text-[11px]">{t('Si la cambias, la dirección anterior redirige a la nueva.')}</p>
                        )}
                        <InputError message={errors.slug} />
                    </div>

                    {/* Active Checkbox */}
                    <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                            id="active"
                            name="active"
                            checked={Boolean(data.active)}
                            onClick={() => setData({ ...data, active: !data.active })}
                        />
                        <Label htmlFor="active" className="text-foreground cursor-pointer text-xs font-semibold">
                            {t('Activo (Visible en sitio y menús)')}
                        </Label>
                    </div>
                </div>

                {/* Featured Image Card */}
                <div className="border-border/70 bg-card space-y-4 rounded-2xl border p-4 shadow-2xs">
                    <Label className="text-muted-foreground block text-xs font-bold tracking-wider uppercase">{t('Imagen Destacada')}</Label>
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
                                <ImageIcon className="text-primary h-3.5 w-3.5" />
                                <span>{t('Elegir Imagen')}</span>
                            </Button>
                            {data.featured_image && (
                                <button
                                    type="button"
                                    onClick={() => setData({ ...data, featured_image: '' })}
                                    className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg p-2 transition-colors"
                                    title={t('Quitar imagen')}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        {data.featured_image && (
                            <div className="border-border/60 bg-muted/30 aspect-[16/10] overflow-hidden rounded-xl border shadow-2xs">
                                <img src={data.featured_image} className="h-full w-full object-cover" alt={t('Featured')} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Tags */}
                <div className="border-border/70 bg-card space-y-3 rounded-2xl border p-4 shadow-2xs">
                    <h3 className="border-border/60 text-muted-foreground border-b pb-2 text-xs font-bold tracking-wider uppercase">
                        {t('Etiquetas')}
                    </h3>
                    <TagField tags={tags} selected={data.tag_ids || []} onChange={(tagIds) => setData({ ...data, tag_ids: tagIds })} />
                    <InputError message={errors.tag_ids} />
                </div>

                {/* Menus */}
                {menus.length > 0 && (
                    <div className="border-border/70 bg-card space-y-3 rounded-2xl border p-4 shadow-2xs">
                        <h3 className="border-border/60 text-muted-foreground border-b pb-2 text-xs font-bold tracking-wider uppercase">
                            {t('Menús')}
                        </h3>
                        <div className="space-y-2">
                            {menus.map((menu) => {
                                const checked = (data.menu_ids ?? []).includes(menu.id);
                                return (
                                    <div key={menu.id} className="flex items-center gap-2">
                                        <Checkbox
                                            id={`menu-${menu.id}`}
                                            checked={checked}
                                            disabled={!canManageMenus}
                                            onCheckedChange={() => {
                                                setMenusTouched(true);
                                                const ids = data.menu_ids ?? [];
                                                setData({ ...data, menu_ids: checked ? ids.filter((id) => id !== menu.id) : [...ids, menu.id] });
                                            }}
                                        />
                                        <Label htmlFor={`menu-${menu.id}`} className="cursor-pointer text-xs font-normal">
                                            {t('Mostrar en')} {menu.name}
                                        </Label>
                                    </div>
                                );
                            })}
                        </div>
                        <p className="text-muted-foreground text-[11px]">
                            {canManageMenus
                                ? t('Se añade al final del menú; el orden se cambia en Menús.')
                                : t('Solo lectura: necesitas permiso para administrar Menús.')}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
