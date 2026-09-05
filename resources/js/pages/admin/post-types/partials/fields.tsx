import InputError from '@/components/input-error';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CmsPostType } from '@/types/models/cms-post';
import * as LucideIcons from 'lucide-react';

interface Props {
    data: Partial<CmsPostType>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setData: (data: any) => void;
    errors: Record<string, string>;
    processing: boolean;
    schemas: { id: number; name: string }[];
}

const AVAILABLE_ICONS = [
    { value: 'book-open', label: 'Blog / Libro', desc: 'Ideal para blogs, documentación y guías' },
    { value: 'briefcase', label: 'Servicios', desc: 'Servicios de empresa y ofertas profesionales' },
    { value: 'calendar', label: 'Eventos', desc: 'Fechas, agendas, reuniones y efemérides' },
    { value: 'image', label: 'Portafolio / Galería', desc: 'Trabajos visuales, diseños y fotografías' },
    { value: 'users', label: 'Equipo / Miembros', desc: 'Perfiles de personal, socios y clientes' },
    { value: 'map-pin', label: 'Ubicaciones', desc: 'Oficinas, sucursales y puntos de interés' },
    { value: 'shopping-bag', label: 'Productos', desc: 'Catálogos de venta o demostraciones de producto' },
    { value: 'award', label: 'Premios / Logros', desc: 'Reconocimientos y certificaciones' },
    { value: 'star', label: 'Reseñas / Destacados', desc: 'Opiniones, testimonios y destacados' },
    { value: 'message-square', label: 'Testimonios', desc: 'Citas de clientes y feedback' },
    { value: 'newspaper', label: 'Noticias', desc: 'Novedades de prensa, anuncios o boletines' },
];

export default function PostTypeFormFields({ data, setData, errors, processing, schemas }: Props) {
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
            return <IconComponent className="h-5 w-5 text-red-600 dark:text-red-500" />;
        }
        return <LucideIcons.BookOpen className="h-5 w-5 text-red-600 dark:text-red-500" />;
    };

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                    <Label htmlFor="name">Nombre (Plural)</Label>
                    <Input
                        id="name"
                        type="text"
                        required
                        autoFocus
                        value={data.name || ''}
                        placeholder="Ej. Servicios, Eventos"
                        onChange={handleNameChange}
                        disabled={processing}
                    />
                    <InputError message={errors.name} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="singular_name">Nombre (Singular)</Label>
                    <Input
                        id="singular_name"
                        type="text"
                        required
                        value={data.singular_name || ''}
                        placeholder="Ej. Servicio, Evento"
                        onChange={(e) => setData({ ...data, singular_name: e.target.value })}
                        disabled={processing}
                    />
                    <InputError message={errors.singular_name} />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                    <Label htmlFor="slug">Slug (Prefijo de URL)</Label>
                    <Input
                        id="slug"
                        type="text"
                        required
                        value={data.slug || ''}
                        placeholder="Ej. servicios, eventos"
                        onChange={(e) => setData({ ...data, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                        disabled={processing}
                    />
                    <InputError message={errors.slug} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="default_schema_id">Campos Personalizados (Plantilla)</Label>
                    <select
                        id="default_schema_id"
                        value={data.default_schema_id || ''}
                        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800"
                        onChange={(e) => setData({ ...data, default_schema_id: e.target.value ? Number(e.target.value) : null })}
                        disabled={processing}
                    >
                        <option value="">Ninguna - Sin campos dinámicos</option>
                        {schemas.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name}
                            </option>
                        ))}
                    </select>
                    <InputError message={errors.default_schema_id} />
                </div>
            </div>

            <div className="grid gap-2">
                <Label>Icono del Menú (Sidebar)</Label>
                <div className="grid max-h-[220px] grid-cols-1 gap-2 overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-50/20 p-3 sm:grid-cols-2 lg:grid-cols-3 dark:border-zinc-800 dark:bg-transparent">
                    {AVAILABLE_ICONS.map((icon) => {
                        const isSelected = data.icon === icon.value || (!data.icon && icon.value === 'book-open');
                        return (
                            <button
                                key={icon.value}
                                type="button"
                                className={`flex items-center gap-3 rounded-lg border p-2.5 text-left transition-all ${
                                    isSelected
                                        ? 'border-red-500 bg-red-50/40 text-red-700 dark:bg-red-950/25 dark:text-red-400'
                                        : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700'
                                }`}
                                onClick={() => setData({ ...data, icon: icon.value })}
                            >
                                <div className="rounded-md border border-zinc-100 bg-white p-1 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
                                    {renderIconPreview(icon.value)}
                                </div>
                                <div className="min-w-0">
                                    <div className="text-xs font-semibold">{icon.label}</div>
                                    <div className="w-[130px] truncate text-[10px] text-zinc-400 dark:text-zinc-500">{icon.desc}</div>
                                </div>
                            </button>
                        );
                    })}
                </div>
                <InputError message={errors.icon} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="description">Descripción</Label>
                <textarea
                    id="description"
                    rows={3}
                    className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800"
                    placeholder="Descripción interna del tipo de contenido..."
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
                    Activo / Visible en Sidebar
                </Label>
            </div>
        </div>
    );
}
