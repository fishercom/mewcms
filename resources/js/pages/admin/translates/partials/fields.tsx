import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { t } from '@/lib/i18n';
import { CmsTranslateForm } from '@/types/models/cms-translate';

interface Props {
    data: CmsTranslateForm;
    setData: (data: CmsTranslateForm) => void;
    errors: Record<string, string>;
    processing: boolean;
}

export default function TranslateFormFields({ data, setData, errors, processing }: Props) {
    const inputTypes = [
        { value: 1, label: t('Text') },
        { value: 2, label: t('Textarea') },
        { value: 3, label: t('Rich Text') },
    ];

    return (
        <>
            <div className="grid gap-2">
                <Label htmlFor="alias">{t('Alias')}</Label>
                <Input
                    id="alias"
                    type="text"
                    required
                    autoFocus
                    tabIndex={1}
                    autoComplete="alias"
                    value={data.alias}
                    onChange={(e) => setData({ ...data, alias: e.target.value })}
                    disabled={processing}
                />
                <InputError message={errors.alias} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="input_type">{t('Input Type')}</Label>
                <Select
                    value={data.input_type.toString()}
                    onValueChange={(value) => setData({ ...data, input_type: Number(value) })}
                    disabled={processing}
                >
                    <SelectTrigger>
                        <SelectValue placeholder={t('Select an input type')} />
                    </SelectTrigger>
                    <SelectContent>
                        {inputTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value.toString()}>
                                {type.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <InputError message={errors.input_type} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="metadata">{t('Metadata')}</Label>
                <Textarea
                    id="metadata"
                    tabIndex={3}
                    autoComplete="metadata"
                    value={JSON.stringify(data.metadata, null, 2)}
                    onChange={(e) => {
                        try {
                            setData({ ...data, metadata: JSON.parse(e.target.value) });
                        } catch (error) {
                            console.error('Invalid JSON for metadata:', error);
                        }
                    }}
                    disabled={processing}
                />
                <InputError message={errors.metadata} />
            </div>
        </>
    );
}
