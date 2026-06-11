import { useEffect } from 'react';
import InputError from '@/components/input-error';
import { Checkbox } from '@/components/ui/checkbox';
import { CmsArticle, CmsArticleForm, JsonValue } from '@/types/models/cms-article';
import CustomFieldRenderer from '@/components/custom-field-renderer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CmsSchema } from '@/types/models/cms-schema';
import { CmsTaxonomy } from '@/types/models/cms-taxonomy';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

export default function ArticleFields({ data, setData, errors, processing, schema, schemas, parents = [], taxonomies, onChangeSchema }: Props) {
    useEffect(() => {
        if (schema?.unique && data.parent_id !== null) {
            setData({ ...data, parent_id: null });
        }
    }, [schema, data.parent_id]);
    return (
        <>
            <div className="grid gap-2">
                <Label htmlFor="title">Nombre</Label>
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
                />

                <InputError message={errors.title} />
            </div>

            {schemas && schemas.length > 0 && (
                <div className="grid gap-2">
                    <Label htmlFor="schema_id">Plantilla (Campos Personalizados)</Label>
                    <Select
                        value={data.schema_id?.toString() || ''}
                        onValueChange={(value) => {
                            const newId = Number(value);
                            setData({ ...data, schema_id: newId });
                            if (onChangeSchema) {
                                onChangeSchema(newId);
                            }
                        }}
                        disabled={processing}
                    >
                        <SelectTrigger id="schema_id">
                            <SelectValue placeholder="Seleccione una plantilla" />
                        </SelectTrigger>
                        <SelectContent>
                            {schemas.map((s) => (
                                <SelectItem key={s.id} value={s.id.toString()}>
                                    {s.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <InputError message={errors.schema_id} />
                </div>
            )}

            {schema?.unique ? (
                <div className="grid gap-2 border border-amber-200 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-950/10 rounded-md p-3">
                    <span className="text-xs text-amber-800 dark:text-amber-200">
                        🔒 **Plantilla Única:** Las plantillas únicas (como la página de inicio) no pueden tener páginas superiores.
                    </span>
                </div>
            ) : (
                parents && parents.length > 0 && (
                    <div className="grid gap-2">
                        <Label htmlFor="parent_id">Página Superior (Padre)</Label>
                        <Select
                            value={data.parent_id?.toString() || 'root'}
                            onValueChange={(value) => {
                                setData({ ...data, parent_id: value === 'root' ? null : Number(value) });
                            }}
                            disabled={processing}
                        >
                            <SelectTrigger id="parent_id">
                                <SelectValue placeholder="Página Raíz (Ninguna)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="root">Página Raíz (Ninguna)</SelectItem>
                                {parents.map((p) => (
                                    <SelectItem key={p.id} value={p.id.toString()}>
                                        {p.depth && p.depth > 0 ? "—".repeat(p.depth) + " " : ""}{p.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.parent_id} />
                    </div>
                )
            )}

            {schema?.fields?.length ? (
                <div className="space-y-4">
                    <Label>Campos personalizados</Label>
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

            {taxonomies && taxonomies.length > 0 && (
                <div className="space-y-4 border-t pt-4 border-gray-200">
                    <Label className="text-base font-semibold">Taxonomías</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {taxonomies.map((taxonomy) => (
                            <div key={taxonomy.id} className="border rounded-md p-3 bg-gray-50/50">
                                <Label className="font-semibold block mb-2">{taxonomy.name}</Label>
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
                                                    <Label htmlFor={`term-${term.id}`} className="text-sm font-normal cursor-pointer">
                                                        {term.parent_id && <span className="text-gray-400 mr-1">—</span>}
                                                        {term.name}
                                                    </Label>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <span className="text-xs text-gray-500 italic">No hay términos.</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex items-center space-x-3">
                <Checkbox
                    id="active"
                    name="active"
                    checked={Boolean(data.active)}
                    onClick={() => setData({ ...data, active: !data.active })}
                    tabIndex={3}
                />
                <Label htmlFor="active">Activo</Label>
            </div>
        </>
    )
}
