import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import InputError from "@/components/input-error";
import { CmsTaxonomyForm } from "@/types/models/cms-taxonomy";

interface Props {
    data: CmsTaxonomyForm;
    setData: (data: CmsTaxonomyForm) => void;
    errors: Record<string, string>;
    processing: boolean;
}

export default function TaxonomyFormFields({ data, setData, errors, processing }: Props) {
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
                <Label htmlFor="description">Descripción / Description</Label>
                <textarea
                    id="description"
                    tabIndex={3}
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
                    tabIndex={4}
                />
                <Label htmlFor="active">Activo / Active</Label>
            </div>
        </>
    );
}
