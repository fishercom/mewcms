import InputError from '@/components/input-error';
import { Checkbox } from '@/components/ui/checkbox';
import { CmsSchemaForm } from '@/types/models/cms-schema';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CustomFieldManager from '@/components/custom-field-manager';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CmsSchemaGroup } from '@/types/models/cms-schema-group';

interface Props {
    data: CmsSchemaForm;
    setData: (data: CmsSchemaForm) => void;
    errors: Record<string, string>;
    processing: boolean;
    groups: CmsSchemaGroup[];
    templates?: { name: string; value: string }[];
}

export default function SchemaFields({ data, setData, errors, processing, groups, templates }: Props) {
    return (
        <>
            <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
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
                <Label htmlFor="group_id">Group</Label>
                <Select
                    value={data.group_id.toString()}
                    onValueChange={(value) => setData({ ...data, group_id: Number(value) })}
                    disabled={processing}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select a group" />
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

            <CustomFieldManager
                fields={data.fields || []}
                setFields={(newFields) => setData({ ...data, fields: newFields })}
            />

            <div className="grid gap-2">
                <Label htmlFor="front_view">Plantilla Frontend (React View Path)</Label>
                <Select
                    value={data.front_view || ''}
                    onValueChange={(value) => setData({ ...data, front_view: value })}
                    disabled={processing}
                >
                    <SelectTrigger id="front_view">
                        <SelectValue placeholder="Seleccione una plantilla" />
                    </SelectTrigger>
                    <SelectContent>
                        {templates && templates.map((template) => (
                            <SelectItem key={template.value} value={template.value}>
                                {template.name} ({template.value})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <InputError message={errors.front_view} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="iterations">Iterations</Label>
                <Input
                    id="iterations"
                    type="number"
                    autoComplete="iterations"
                    value={data.iterations === null || data.iterations === undefined || isNaN(data.iterations) ? '' : data.iterations}
                    onChange={(e) => {
                        const val = e.target.value;
                        setData({ ...data, iterations: val === '' ? null : parseInt(val) });
                    }}
                    disabled={processing}
                />
                <InputError message={errors.iterations} />
            </div>

            <div className="flex items-center space-x-3">
                <Checkbox
                    id="active"
                    name="active"
                    checked={Boolean(data.active)}
                    onClick={() => setData({ ...data, active: !data.active })}
                    tabIndex={3}
                />
                <Label htmlFor="active">Active</Label>
            </div>
        </>
    )
}
