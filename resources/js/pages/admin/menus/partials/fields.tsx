import InputError from '@/components/input-error';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { t } from '@/lib/i18n';
import { CmsMenuForm } from '@/types/models/cms-menu';

interface Props {
    data: CmsMenuForm;
    setData: (data: CmsMenuForm) => void;
    errors: Record<string, string>;
    processing: boolean;
}

export default function MenuFormFields({ data, setData, errors, processing }: Props) {
    return (
        <>
            <div className="grid gap-2">
                <Label htmlFor="name">{t('Nombre / Name')}</Label>
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
                <Label htmlFor="slug">{t('Slug (Opcional)')}</Label>
                <Input
                    id="slug"
                    type="text"
                    tabIndex={2}
                    value={data.slug ?? ''}
                    placeholder={t('Se auto-genera si se deja vacío')}
                    onChange={(e) => setData({ ...data, slug: e.target.value })}
                    disabled={processing}
                />
                <InputError message={errors.slug} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="description">{t('Descripción / Description')}</Label>
                <textarea
                    id="description"
                    tabIndex={3}
                    className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    value={data.description ?? ''}
                    onChange={(e) => setData({ ...data, description: e.target.value })}
                    disabled={processing}
                />
                <InputError message={errors.description} />
            </div>

            <div className="space-y-2">
                <div className="flex items-center space-x-3">
                    <Checkbox
                        id="auto_add_pages"
                        checked={Boolean(data.auto_add_pages)}
                        onClick={() => setData({ ...data, auto_add_pages: !data.auto_add_pages })}
                    />
                    <Label htmlFor="auto_add_pages">{t('Añadir automáticamente las páginas nuevas de primer nivel')}</Label>
                </div>
                <div className="flex items-center space-x-3">
                    <Checkbox
                        id="auto_add_subpages"
                        checked={Boolean(data.auto_add_subpages)}
                        onClick={() => setData({ ...data, auto_add_subpages: !data.auto_add_subpages })}
                    />
                    <Label htmlFor="auto_add_subpages">{t('Añadir también las subpáginas, bajo su página superior (si está en este menú)')}</Label>
                </div>
                <p className="text-muted-foreground pl-7 text-xs">
                    {t('Al crear una página se marca este menú por defecto; puedes desmarcarlo en el editor de la página.')}
                </p>
            </div>

            <div className="flex items-center space-x-3">
                <Checkbox
                    id="active"
                    name="active"
                    checked={Boolean(data.active)}
                    onClick={() => setData({ ...data, active: !data.active })}
                    tabIndex={4}
                />
                <Label htmlFor="active">{t('Activo / Active')}</Label>
            </div>
        </>
    );
}
