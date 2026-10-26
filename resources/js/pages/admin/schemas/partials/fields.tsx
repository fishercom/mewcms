import { type BlockDefinition } from '@/blocks/types';
import BlockEditor from '@/components/block-editor';
import InputError from '@/components/input-error';
import { Checkbox } from '@/components/ui/checkbox';
import { CmsSchemaForm } from '@/types/models/cms-schema';

import CustomFieldManager from '@/components/custom-field-manager';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { t } from '@/lib/i18n';
import { CmsSchemaGroup } from '@/types/models/cms-schema-group';
import { usePage } from '@inertiajs/react';
import { DynamicIcon, type IconName } from 'lucide-react/dynamic';

interface Props {
    data: CmsSchemaForm;
    setData: (data: CmsSchemaForm) => void;
    errors: Record<string, string>;
    processing: boolean;
    groups: CmsSchemaGroup[];
    templates?: { name: string; value: string }[];
}

export default function SchemaFields({ data, setData, errors, processing, groups, templates }: Props) {
    const { blockTypes = [] } = usePage<{ blockTypes?: BlockDefinition[] }>().props;
    // null = every block is allowed
    const allowed = data.allowed_blocks ?? blockTypes.map((t) => t.key);
    const toggleBlock = (key: string) => {
        const next = allowed.includes(key) ? allowed.filter((k) => k !== key) : [...allowed, key];
        setData({ ...data, allowed_blocks: next.length === blockTypes.length ? null : next });
    };

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
                    value={data.name}
                    onChange={(e) => setData({ ...data, name: e.target.value })}
                    disabled={processing}
                />
                <InputError message={errors.name} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="group_id">{t('Group')}</Label>
                <Select
                    value={data.group_id.toString()}
                    onValueChange={(value) => setData({ ...data, group_id: Number(value) })}
                    disabled={processing}
                >
                    <SelectTrigger>
                        <SelectValue placeholder={t('Select a group')} />
                    </SelectTrigger>
                    <SelectContent>
                        {groups.map((group) => (
                            <SelectItem key={group.id} value={group.id.toString()}>
                                {group.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <InputError message={errors.group_id} />
            </div>

            <CustomFieldManager fields={data.fields || []} setFields={(newFields) => setData({ ...data, fields: newFields })} />

            <div className="grid gap-2">
                <Label htmlFor="front_view">{t('Plantilla Frontend (React View Path)')}</Label>
                <Select value={data.front_view || ''} onValueChange={(value) => setData({ ...data, front_view: value })} disabled={processing}>
                    <SelectTrigger id="front_view">
                        <SelectValue placeholder={t('Seleccione una plantilla')} />
                    </SelectTrigger>
                    <SelectContent>
                        {templates &&
                            templates.map((template) => (
                                <SelectItem key={template.value} value={template.value}>
                                    {template.name} ({template.value})
                                </SelectItem>
                            ))}
                    </SelectContent>
                </Select>
                <InputError message={errors.front_view} />
            </div>

            {blockTypes.length > 0 && (
                <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                        <Label>{t('Bloques permitidos')}</Label>
                        <button
                            type="button"
                            className="text-primary text-xs font-medium hover:underline"
                            onClick={() => setData({ ...data, allowed_blocks: null })}
                            disabled={processing}
                        >
                            {t('Permitir todos')}
                        </button>
                    </div>
                    <p className="text-muted-foreground text-xs">
                        {t(
                            'Los bloques que el editor ofrece en las páginas y entradas de esta plantilla. Los bloques ya colocados se pueden seguir editando.',
                        )}
                    </p>
                    <div className="border-border grid grid-cols-1 gap-1 rounded-lg border p-2 sm:grid-cols-2 lg:grid-cols-3">
                        {blockTypes.map((type) => (
                            <label key={type.key} className="hover:bg-muted/50 flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5">
                                <Checkbox checked={allowed.includes(type.key)} onClick={() => toggleBlock(type.key)} disabled={processing} />
                                <DynamicIcon name={type.icon as IconName} className="text-muted-foreground h-4 w-4" />
                                <span className="text-sm">{type.key === 'pattern' ? t('Bloques reutilizables') : type.name}</span>
                            </label>
                        ))}
                    </div>
                    <InputError message={errors.allowed_blocks} />
                </div>
            )}

            {blockTypes.length > 0 && (
                <div className="grid gap-2">
                    <Label>{t('Diseño inicial')}</Label>
                    <p className="text-muted-foreground text-xs">
                        {t('Los bloques con los que empieza una página o entrada nueva de esta plantilla.')}
                    </p>
                    <BlockEditor
                        types={blockTypes}
                        allowedTypes={data.allowed_blocks ?? null}
                        value={data.default_blocks ?? []}
                        onChange={(blocks) => setData({ ...data, default_blocks: blocks })}
                    />
                    <InputError message={errors.default_blocks} />
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
                <Label htmlFor="active">{t('Active')}</Label>
            </div>
        </>
    );
}
