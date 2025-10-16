import InputError from '@/components/input-error';
import { Checkbox } from '@/components/ui/checkbox';
import { CmsArticleForm, JsonValue } from '@/types/models/cms-article';
import CustomFieldRenderer from '@/components/custom-field-renderer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CmsSchema } from '@/types/models/cms-schema';

interface Props {
    data: CmsArticleForm;
    setData: (data: CmsArticleForm) => void;
    errors: Record<string, string>;
    processing: boolean;
    schema?: CmsSchema;
}

export default function ArticleFields({ data, setData, errors, processing, schema }: Props) {
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
