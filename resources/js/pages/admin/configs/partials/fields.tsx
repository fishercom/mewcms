import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { t } from '@/lib/i18n';
import { CmsConfigForm } from '@/types/models/cms-config';

interface Props {
    data: CmsConfigForm;
    setData: (data: CmsConfigForm) => void;
    errors: Record<string, string>;
    processing: boolean;
}

export default function ConfigFormFields({ data, setData, errors, processing }: Props) {
    const configTypes = [
        { value: 'string', label: t('String') },
        { value: 'int', label: t('Integer') },
        { value: 'text', label: t('Text') },
        { value: 'date', label: t('Date') },
        { value: 'boolean', label: t('Boolean') },
    ];

    return (
        <>
            <div className="grid gap-2">
                <Label htmlFor="name">{t('Name')}</Label>
                <Input
                    id="name"
                    type="text"
                    required
                    autoFocus
                    tabIndex={1}
                    autoComplete="name"
                    value={data.name as string}
                    onChange={(e) => setData({ ...data, name: e.target.value })}
                    disabled={processing}
                />
                <InputError message={errors.name} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="alias">{t('Alias')}</Label>
                <Input
                    id="alias"
                    type="text"
                    required
                    tabIndex={2}
                    autoComplete="alias"
                    value={data.alias as string}
                    onChange={(e) => setData({ ...data, alias: e.target.value })}
                    disabled={processing}
                />
                <InputError message={errors.alias} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="type">{t('Type')}</Label>
                <Select value={data.type as string} onValueChange={(value) => setData({ ...data, type: value })} disabled={processing}>
                    <SelectTrigger>
                        <SelectValue placeholder={t('Select a type')} />
                    </SelectTrigger>
                    <SelectContent>
                        {configTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                                {type.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <InputError message={errors.type} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="value">{t('Value')}</Label>
                {data.type === 'text' ? (
                    <Textarea value={data.value as string} onChange={(e) => setData({ ...data, value: e.target.value })} disabled={processing} />
                ) : data.type === 'boolean' ? (
                    <Select value={data.value as string} onValueChange={(value) => setData({ ...data, value: value })} disabled={processing}>
                        <SelectTrigger>
                            <SelectValue placeholder={t('Select a value')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">{t('True')}</SelectItem>
                            <SelectItem value="0">{t('False')}</SelectItem>
                        </SelectContent>
                    </Select>
                ) : (
                    <Input
                        id="value"
                        type={data.type === 'int' ? 'number' : data.type === 'date' ? 'date' : 'text'}
                        tabIndex={4}
                        value={data.value as string}
                        onChange={(e) => setData({ ...data, value: e.target.value })}
                        disabled={processing}
                    />
                )}
                <InputError message={errors.value} />
            </div>
        </>
    );
}
