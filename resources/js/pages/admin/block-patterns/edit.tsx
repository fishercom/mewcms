import { type BlockDefinition } from '@/blocks/types';
import { Button } from '@/components/ui/button';
import FormLayout from '@/layouts/module/Form';
import ModuleLayout from '@/layouts/module/layout';
import { CmsBlockPattern } from '@/types/models/cms-block-pattern';
import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import BlockPatternFormFields from './partials/fields';

export default function Edit() {
    const {
        item,
        blockTypes = [],
        categories,
    } = usePage<{ item: CmsBlockPattern; blockTypes?: BlockDefinition[]; categories: Record<string, string> }>().props;

    const [data, setData] = useState<Partial<CmsBlockPattern>>({
        id: item.id,
        name: item.name,
        key: item.key,
        description: item.description ?? '',
        category: item.category,
        blocks: item.blocks ?? [],
        synced: item.synced,
        active: item.active,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.put(route('block-patterns.update', item.id), data as any, {
            onError: (err) => {
                setErrors(err);
                setProcessing(false);
            },
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <ModuleLayout view="Editar">
            <FormLayout>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <BlockPatternFormFields
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        blockTypes={blockTypes}
                        categories={categories}
                    />

                    <div className="border-border flex items-center gap-4 border-t pt-4">
                        <Button disabled={processing} className="bg-primary text-primary-foreground hover:bg-primary/90">
                            Guardar Cambios
                        </Button>
                        <Link href={route('block-patterns.index')} className="text-muted-foreground hover:text-foreground text-sm font-medium">
                            Cancelar
                        </Link>
                    </div>
                </form>
            </FormLayout>
        </ModuleLayout>
    );
}
