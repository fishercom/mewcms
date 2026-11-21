import InputError from '@/components/input-error';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { t } from '@/lib/i18n';
import { CmsPostType } from '@/types/models/cms-post';
import * as LucideIcons from 'lucide-react';
import ListingPageSelect, { type ListingPageOption } from './listing-page-select';

interface Props {
    data: Partial<CmsPostType>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setData: (data: any) => void;
    errors: Record<string, string>;
    processing: boolean;
    schemas: { id: number; name: string }[];
    pages: ListingPageOption[];
}

const AVAILABLE_ICONS = [
    { value: 'book-open', label: t('Blog / Libro'), desc: t('Ideal para blogs, documentación y guías') },
    { value: 'briefcase', label: t('Servicios'), desc: t('Servicios de empresa y ofertas profesionales') },
    { value: 'calendar', label: t('Eventos'), desc: t('Fechas, agendas, reuniones y efemérides') },
    { value: 'image', label: t('Portafolio / Galería'), desc: t('Trabajos visuales, diseños y fotografías') },
    { value: 'users', label: t('Equipo / Miembros'), desc: t('Perfiles de personal, socios y clientes') },
    { value: 'map-pin', label: t('Ubicaciones'), desc: t('Oficinas, sucursales y puntos de interés') },
    { value: 'shopping-bag', label: t('Productos'), desc: t('Catálogos de venta o demostraciones de producto') },
    { value: 'award', label: t('Premios / Logros'), desc: t('Reconocimientos y certificaciones') },
    { value: 'star', label: t('Reseñas / Destacados'), desc: t('Opiniones, testimonios y destacados') },
    { value: 'message-square', label: t('Testimonios'), desc: t('Citas de clientes y feedback') },
    { value: 'newspaper', label: t('Noticias'), desc: t('Novedades de prensa, anuncios o boletines') },
];

export default function PostTypeFormFields({ data, setData, errors, processing, schemas, pages }: Props) {
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const nameVal = e.target.value;
        const generatedSlug = nameVal
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // remove accents
            .replace(/[^a-z0-9\s-]/g, '') // remove special chars
            .trim()
            .replace(/\s+/g, '-'); // replace spaces with dashes

        setData({
            ...data,
            name: nameVal,
            slug: data.id ? data.slug : generatedSlug, // auto-slug on create only
        });
    };

    const renderIconPreview = (iconName: string) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const IconComponent = (LucideIcons as any)[iconName || 'book-open'];
        if (IconComponent) {
            return <IconComponent className="text-primary h-5 w-5" />;
        }
        return <LucideIcons.BookOpen className="text-primary h-5 w-5" />;
    };

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                    <Label htmlFor="name">{t('Nombre (Plural)')}</Label>
                    <Input
                        id="name"
                        type="text"
                        required
                        autoFocus
                        value={data.name || ''}
                        placeholder={t('Ej. Servicios, Eventos')}
                        onChange={handleNameChange}
                        disabled={processing}
                    />
                    <InputError message={errors.name} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="singular_name">{t('Nombre (Singular)')}</Label>
                    <Input
                        id="singular_name"
                        type="text"
                        required
                        value={data.singular_name || ''}
                        placeholder={t('Ej. Servicio, Evento')}
                        onChange={(e) => setData({ ...data, singular_name: e.target.value })}
                        disabled={processing}
                    />
                    <InputError message={errors.singular_name} />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                    <Label htmlFor="slug">{t('Slug (Prefijo de URL)')}</Label>
                    <Input
                        id="slug"
                        type="text"
                        required
                        value={data.slug || ''}
                        placeholder={t('Ej. servicios, eventos')}
                        onChange={(e) => setData({ ...data, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                        disabled={processing}
                    />
                    <InputError message={errors.slug} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="default_schema_id">{t('Campos Personalizados (Plantilla)')}</Label>
                    <select
                        id="default_schema_id"
                        value={data.default_schema_id || ''}
                        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        onChange={(e) => setData({ ...data, default_schema_id: e.target.value ? Number(e.target.value) : null })}
                        disabled={processing}
                    >
                        <option value="">{t('Ninguna - Sin campos dinámicos')}</option>
                        {schemas.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name}
                            </option>
                        ))}
                    </select>
                    <InputError message={errors.default_schema_id} />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                    <Label htmlFor="per_page">{t('Elementos por página del listado')}</Label>
                    <Input
                        id="per_page"
                        type="number"
                        min={0}
                        max={100}
                        value={data.per_page ?? 6}
                        onChange={(e) => setData({ ...data, per_page: e.target.value === '' ? 6 : Number(e.target.value) })}
                        disabled={processing}
                    />
                    <p className="text-muted-foreground text-xs">{t('0 muestra todos en una sola página.')}</p>
                    <InputError message={errors.per_page} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="order">{t('Orden del listado')}</Label>
                    <select
                        id="order"
                        value={data.order || 'newest'}
                        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        onChange={(e) => setData({ ...data, order: e.target.value })}
                        disabled={processing}
                    >
                        <option value="newest">{t('Más recientes primero')}</option>
                        <option value="oldest">{t('Más antiguos primero')}</option>
                        <option value="title">{t('Por título (A-Z)')}</option>
                    </select>
                    <InputError message={errors.order} />
                </div>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="listing_page_id">{t('Página del listado')}</Label>
                <ListingPageSelect
                    id="listing_page_id"
                    pages={pages}
                    value={data.listing_page_id}
                    onChange={(value) => setData({ ...data, listing_page_id: value })}
                    disabled={processing}
                />
                <p className="text-muted-foreground text-xs">
                    {t(
                        'La página de este sitio que muestra estas entradas. Cada entrada toma de ella su banner, su título y el enlace para regresar.',
                    )}
                </p>
                <InputError message={errors.listing_page_id} />
            </div>

            <div className="grid gap-2">
                <Label>{t('Icono del Menú (Sidebar)')}</Label>
                <div className="border-border bg-muted/50 grid max-h-[220px] grid-cols-1 gap-2 overflow-y-auto rounded-lg border p-3 sm:grid-cols-2 lg:grid-cols-3 dark:bg-transparent">
                    {AVAILABLE_ICONS.map((icon) => {
                        const isSelected = data.icon === icon.value || (!data.icon && icon.value === 'book-open');
                        return (
                            <button
                                key={icon.value}
                                type="button"
                                className={`flex items-center gap-3 rounded-lg border p-2.5 text-left transition-all ${
                                    isSelected ? 'border-primary bg-primary/40 text-primary' : 'border-border hover:border-border'
                                }`}
                                onClick={() => setData({ ...data, icon: icon.value })}
                            >
                                <div className="border-border bg-card rounded-md border p-1 shadow-2xs">{renderIconPreview(icon.value)}</div>
                                <div className="min-w-0">
                                    <div className="text-xs font-semibold">{icon.label}</div>
                                    <div className="text-muted-foreground w-[130px] truncate text-xs">{icon.desc}</div>
                                </div>
                            </button>
                        );
                    })}
                </div>
                <InputError message={errors.icon} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="description">{t('Descripción')}</Label>
                <textarea
                    id="description"
                    rows={3}
                    className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder={t('Descripción interna del tipo de contenido...')}
                    value={data.description || ''}
                    onChange={(e) => setData({ ...data, description: e.target.value })}
                    disabled={processing}
                />
                <InputError message={errors.description} />
            </div>

            <div className="flex items-center space-x-3 pt-2">
                <Checkbox
                    id="active"
                    name="active"
                    checked={data.active !== false}
                    onClick={() => setData({ ...data, active: data.active === false ? true : false })}
                />
                <Label htmlFor="active" className="cursor-pointer font-medium">
                    {t('Activo / Visible en Sidebar')}
                </Label>
            </div>
        </div>
    );
}
