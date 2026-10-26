import { type BlockDefinition } from '@/blocks/types';
import { Button } from '@/components/ui/button';
import FormLayout from '@/layouts/module/Form';
import ModuleLayout from '@/layouts/module/layout';
import { t } from '@/lib/i18n';
import { CmsBlockPattern } from '@/types/models/cms-block-pattern';
import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import BlockPatternFormFields from './partials/fields';

export default function Create() {
    const { blockTypes = [], categories } = usePage<{ blockTypes?: BlockDefinition[]; categories: Record<string, string> }>().props;

    const [data, setData] = useState<Partial<CmsBlockPattern>>({
        name: '',
        key: '',
        description: '',
        category: 'general',
        blocks: [],
        synced: true,
        active: true,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.post(route('block-patterns.store'), data as any, {
            onError: (err) => {
                setErrors(err);
                setProcessing(false);
            },
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <ModuleLayout view={t('Crear')}>
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
                            {t('Guardar')}
                        </Button>
                        <Link href={route('block-patterns.index')} className="text-muted-foreground hover:text-foreground text-sm font-medium">
                            {t('Cancelar')}
                        </Link>
                    </div>
                </form>
            </FormLayout>
        </ModuleLayout>
    );
}
