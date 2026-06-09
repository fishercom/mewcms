import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import InputError from "@/components/input-error";
import { CmsTaxonomyTerm, CmsTaxonomyTermForm } from "@/types/models/cms-taxonomy";

interface Props {
    data: CmsTaxonomyTermForm;
    setData: (data: CmsTaxonomyTermForm) => void;
    errors: Record<string, string>;
    parents: CmsTaxonomyTerm[];
    processing: boolean;
}

export default function TaxonomyTermFormFields({ data, setData, errors, parents, processing }: Props) {
    return (
        <>
            <div className="grid gap-2">
                <Label htmlFor="name">Nombre / Name</Label>
                <Input
                    id="name"
                    type="text"
                    required
                    autoFocus
                    tabIndex={1}
                    value={data.name}
                    onChange={(e) => setData({ ...data, name: e.target.value })}
                    disabled={processing}
                />
                <InputError message={errors.name} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="slug">Slug (Opcional)</Label>
                <Input
                    id="slug"
                    type="text"
                    tabIndex={2}
                    value={data.slug ?? ''}
                    placeholder="Se auto-genera si se deja vacío"
                    onChange={(e) => setData({ ...data, slug: e.target.value })}
                    disabled={processing}
                />
                <InputError message={errors.slug} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="parent_id">Término Padre / Parent Term</Label>
                <select
                    id="parent_id"
                    tabIndex={3}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={data.parent_id ?? ''}
                    onChange={(e) => {
                        const val = e.target.value;
                        setData({ ...data, parent_id: val ? Number(val) : null });
                    }}
                    disabled={processing}
                >
                    <option value="">Ninguno / None</option>
                    {parents.map((parent) => (
                        <option key={parent.id} value={parent.id}>
                            {parent.name}
                        </option>
                    ))}
                </select>
                <InputError message={errors.parent_id} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="description">Descripción / Description</Label>
                <textarea
                    id="description"
                    tabIndex={4}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={data.description ?? ''}
                    onChange={(e) => setData({ ...data, description: e.target.value })}
                    disabled={processing}
                />
                <InputError message={errors.description} />
            </div>

            <div className="flex items-center space-x-3">
                <Checkbox
                    id="active"
                    name="active"
                    checked={Boolean(data.active)}
                    onClick={() => setData({ ...data, active: !data.active })}
                    tabIndex={5}
                />
                <Label htmlFor="active">Activo / Active</Label>
            </div>
        </>
    );
}
