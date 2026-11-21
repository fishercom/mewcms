import { Button } from '@/components/ui/button';
import FormLayout from '@/layouts/module/Form';
import ModuleLayout from '@/layouts/module/layout';
import { t } from '@/lib/i18n';
import { CmsPostType } from '@/types/models/cms-post';
import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import PostTypeFormFields from './partials/fields';
import { type ListingPageOption } from './partials/listing-page-select';

export default function Edit() {
    const { item, schemas, pages, listingPageId } = usePage<{
        item: CmsPostType;
        schemas: { id: number; name: string }[];
        pages: ListingPageOption[];
        listingPageId: number | null;
    }>().props;

    const [data, setData] = useState<Partial<CmsPostType>>({
        id: item.id,
        name: item.name,
        singular_name: item.singular_name,
        slug: item.slug,
        icon: item.icon,
        description: item.description,
        default_schema_id: item.default_schema_id,
        per_page: item.per_page ?? 6,
        order: item.order ?? 'newest',
        active: item.active,
        listing_page_id: listingPageId,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.put(route('post-types.update', item.id), data as any, {
            onSuccess: () => {
                setProcessing(false);
            },
            onError: (err) => {
                setErrors(err);
                setProcessing(false);
            },
        });
    };

    return (
        <ModuleLayout view={t('Editar')}>
            <FormLayout>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <PostTypeFormFields data={data} setData={setData} errors={errors} processing={processing} schemas={schemas} pages={pages} />

                    <div className="border-border flex items-center gap-4 border-t pt-4">
                        <Button disabled={processing} className="bg-primary text-primary-foreground hover:bg-primary/90">
                            {t('Guardar Cambios')}
                        </Button>
                        <Link href="/admin/post-types" className="text-muted-foreground hover:text-foreground text-sm font-medium">
                            {t('Cancelar')}
                        </Link>
                    </div>
                </form>
            </FormLayout>
        </ModuleLayout>
    );
}
