import InputError from '@/components/input-error';
import { Checkbox } from '@/components/ui/checkbox';
import { CmsArticleForm, JsonValue } from '@/types/models/cms-article';
import CustomFieldRenderer from '@/components/custom-field-renderer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CmsSchema } from '@/types/models/cms-schema';
import { CmsTaxonomy } from '@/types/models/cms-taxonomy';

interface Props {
    data: CmsArticleForm;
    setData: (data: CmsArticleForm) => void;
    errors: Record<string, string>;
    processing: boolean;
    schema?: CmsSchema;
    taxonomies?: CmsTaxonomy[];
}

export default function ArticleFields({ data, setData, errors, processing, schema, taxonomies }: Props) {
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
