import { type BlockDefinition } from '@/blocks/types';
import BlockEditor from '@/components/block-editor';
import InputError from '@/components/input-error';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CmsBlockPattern } from '@/types/models/cms-block-pattern';

interface Props {
    data: Partial<CmsBlockPattern>;
    setData: (data: Partial<CmsBlockPattern>) => void;
    errors: Record<string, string>;
    processing: boolean;
    blockTypes: BlockDefinition[];
    categories: Record<string, string>;
}

const slugify = (value: string): string =>
    value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');

export default function BlockPatternFormFields({ data, setData, errors, processing, blockTypes, categories }: Props) {
    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                    <Label htmlFor="name">Nombre</Label>
                    <Input
                        id="name"
                        required
                        autoFocus
                        value={data.name ?? ''}
                        placeholder="Ej. Aviso de horarios"
                        onChange={(e) => setData({ ...data, name: e.target.value, key: data.id ? data.key : slugify(e.target.value) })}
                        disabled={processing}
                    />
                    <InputError message={errors.name} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="key">Clave</Label>
                    <Input
                        id="key"
                        required
                        value={data.key ?? ''}
                        placeholder="aviso-de-horarios"
                        onChange={(e) => setData({ ...data, key: slugify(e.target.value) })}
                        disabled={processing}
                    />
                    <InputError message={errors.key} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="category">Categoría</Label>
                    <select
                        id="category"
                        value={data.category ?? 'general'}
                        className="border-input bg-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                        onChange={(e) => setData({ ...data, category: e.target.value })}
                        disabled={processing}
                    >
                        {Object.entries(categories).map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>
                    <InputError message={errors.category} />
                </div>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="description">Descripción</Label>
                <Input
                    id="description"
                    value={data.description ?? ''}
                    placeholder="Para qué sirve este bloque, visible en el buscador de bloques"
                    onChange={(e) => setData({ ...data, description: e.target.value })}
                    disabled={processing}
                />
                <InputError message={errors.description} />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="border-border flex items-start gap-3 rounded-lg border p-3">
                    <Checkbox
                        id="synced"
                        checked={data.synced === true}
                        onClick={() => setData({ ...data, synced: data.synced !== true })}
                        className="mt-0.5"
                    />
                    <span>
                        <span className="text-foreground block text-sm font-medium">Sincronizado</span>
                        <span className="text-muted-foreground block text-xs">
                            Las páginas lo muestran siempre actualizado. Sin sincronizar, se inserta como una copia independiente.
                        </span>
                    </span>
                </label>

                <label className="border-border flex items-start gap-3 rounded-lg border p-3">
                    <Checkbox
                        id="active"
                        checked={data.active !== false}
                        onClick={() => setData({ ...data, active: data.active === false })}
                        className="mt-0.5"
                    />
                    <span>
                        <span className="text-foreground block text-sm font-medium">Activo</span>
                        <span className="text-muted-foreground block text-xs">Solo los bloques activos aparecen en el editor.</span>
                    </span>
                </label>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label className="text-foreground font-semibold">Contenido del bloque</Label>
                    <span className="text-muted-foreground text-[11px]">Arrastra los bloques o usa Alt + ↑/↓ para ordenarlos</span>
                </div>
                <BlockEditor allowPatterns={false} types={blockTypes} value={data.blocks ?? []} onChange={(blocks) => setData({ ...data, blocks })} />
                <InputError message={errors.blocks} />
            </div>
        </div>
    );
}
