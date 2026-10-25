import { Button } from '@/components/ui/button';
import { CmsForm, CmsFormField } from '@/types/models/cms-form';
import { CircleDot, List, Plus, Settings, Trash2 } from 'lucide-react';

interface Props {
    data: Partial<CmsForm> & { fields: CmsFormField[] };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setData: (data: any) => void;
    errors: Record<string, string>;
}

export default function FormFields({ data, setData, errors }: Props) {
    const handleAddField = () => {
        const nextFields: CmsFormField[] = [
            ...data.fields,
            {
                name: '',
                alias: '',
                type: 'text',
                options: null,
                active: true,
            },
        ];
        setData({ ...data, fields: nextFields });
    };

    const handleRemoveField = (index: number) => {
        const nextFields = data.fields.filter((_, idx) => idx !== index);
        setData({ ...data, fields: nextFields });
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleFieldChange = (index: number, key: keyof CmsFormField, value: any) => {
        const nextFields = data.fields.map((field, idx) => {
            if (idx === index) {
                const updated = { ...field, [key]: value };
                // Auto slugify alias from name if alias is empty/same
                if (key === 'name' && (!field.alias || field.alias === field.name.toLowerCase().replace(/[^a-z0-9]/g, '_'))) {
                    updated.alias = value.toLowerCase().replace(/[^a-z0-9]/g, '_');
                }
                return updated;
            }
            return field;
        });
        setData({ ...data, fields: nextFields });
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleFormChange = (key: keyof CmsForm, value: any) => {
        const updated = { ...data, [key]: value };
        if (key === 'name' && (!data.alias || data.alias === data.name?.toLowerCase().replace(/[^a-z0-9]/g, '_'))) {
            updated.alias = value.toLowerCase().replace(/[^a-z0-9]/g, '_');
        }
        setData(updated);
    };

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Column: Form Settings */}
            <div className="space-y-4 lg:col-span-4">
                <div className="border-border bg-card space-y-4 rounded-xl border p-5 shadow-xs">
                    <h3 className="border-border text-foreground flex items-center gap-1.5 border-b pb-3 text-sm font-bold">
                        <Settings className="text-primary h-4 w-4" />
                        <span>Ajustes del Formulario</span>
                    </h3>

                    <div className="space-y-1">
                        <label className="text-muted-foreground text-xs font-semibold">Nombre</label>
                        <input
                            type="text"
                            required
                            value={data.name || ''}
                            onChange={(e) => handleFormChange('name', e.target.value)}
                            className="border-border text-foreground focus-visible:ring-destructive/40 w-full rounded-lg border bg-transparent px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                            placeholder="Ej. Formulario de Contacto"
                        />
                        {errors.name && <p className="text-destructive text-[11px]">{errors.name}</p>}
                    </div>

                    <div className="space-y-1">
                        <label className="text-muted-foreground text-xs font-semibold">Alias (Clave única)</label>
                        <input
                            type="text"
                            required
                            value={data.alias || ''}
                            onChange={(e) => handleFormChange('alias', e.target.value)}
                            className="border-border text-foreground focus-visible:ring-destructive/40 w-full rounded-lg border bg-transparent px-3 py-2 font-mono text-sm focus-visible:ring-2 focus-visible:outline-none"
                            placeholder="Ej. contacto_general"
                        />
                        {errors.alias && <p className="text-destructive text-[11px]">{errors.alias}</p>}
                    </div>

                    <div className="space-y-1">
                        <label className="text-muted-foreground text-xs font-semibold">Información / Descripción</label>
                        <textarea
                            value={data.info || ''}
                            onChange={(e) => handleFormChange('info', e.target.value)}
                            rows={3}
                            className="border-border text-foreground focus-visible:ring-destructive/40 w-full rounded-lg border bg-transparent px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                            placeholder="Info de ayuda o descripción del propósito del formulario"
                        />
                        {errors.info && <p className="text-destructive text-[11px]">{errors.info}</p>}
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <input
                            type="checkbox"
                            id="form_active"
                            checked={data.active ?? true}
                            onChange={(e) => handleFormChange('active', e.target.checked)}
                            className="border-border text-primary focus:ring-primary/40 h-4 w-4 rounded-sm bg-transparent focus:ring-2"
                        />
                        <label htmlFor="form_active" className="text-muted-foreground cursor-pointer text-xs font-semibold">
                            Formulario Activo
                        </label>
                    </div>
                </div>
            </div>

            {/* Right Column: Dynamic Form Fields Schema Builder */}
            <div className="space-y-4 lg:col-span-8">
                <div className="border-border bg-card space-y-4 rounded-xl border p-5 shadow-xs">
                    <div className="border-border flex items-center justify-between border-b pb-3">
                        <h3 className="text-foreground flex items-center gap-1.5 text-sm font-bold">
                            <List className="text-primary h-4 w-4" />
                            <span>Campos del Formulario</span>
                        </h3>
                        <Button
                            type="button"
                            onClick={handleAddField}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Añadir Campo</span>
                        </Button>
                    </div>

                    {data.fields.length > 0 ? (
                        <div className="max-h-[500px] space-y-4 overflow-y-auto pr-1">
                            {data.fields.map((field, idx) => (
                                <div key={idx} className="border-border bg-muted/50 relative space-y-3 rounded-xl border p-4">
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                        <div className="space-y-1">
                                            <label className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                                                Etiqueta
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={field.name}
                                                onChange={(e) => handleFieldChange(idx, 'name', e.target.value)}
                                                className="border-border bg-card text-foreground focus:ring-primary/40 w-full rounded-lg border px-2.5 py-1.5 text-xs focus:ring-1 focus:outline-none dark:bg-transparent"
                                                placeholder="Ej. Correo Electrónico"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">Clave</label>
                                            <input
                                                type="text"
                                                required
                                                value={field.alias}
                                                onChange={(e) => handleFieldChange(idx, 'alias', e.target.value)}
                                                className="border-border bg-card text-foreground focus:ring-primary/40 w-full rounded-lg border px-2.5 py-1.5 font-mono text-xs focus:ring-1 focus:outline-none dark:bg-transparent"
                                                placeholder="Ej. email"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                                                Tipo de Entrada
                                            </label>
                                            <select
                                                value={field.type}
                                                onChange={(e) => handleFieldChange(idx, 'type', e.target.value as CmsFormField['type'])}
                                                className="border-border bg-card text-foreground focus:ring-primary/40 h-8 w-full rounded-lg border px-2 text-xs focus:ring-1 focus:outline-none dark:bg-transparent"
                                            >
                                                <option value="text">Texto simple</option>
                                                <option value="email">Email</option>
                                                <option value="tel">Teléfono</option>
                                                <option value="textarea">Área de Texto (Textarea)</option>
                                                <option value="select">Selector (Dropdown)</option>
                                                <option value="checkbox">Opción Múltiple (Checkboxes)</option>
                                                <option value="radio">Opción Única (Radio Buttons)</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Render options list if type is select/checkbox/radio */}
                                    {['select', 'checkbox', 'radio'].includes(field.type) && (
                                        <div className="space-y-1">
                                            <label className="text-muted-foreground flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase">
                                                <CircleDot className="text-primary h-3 w-3" />
                                                <span>Opciones (Valores separados por coma)</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={Array.isArray(field.options) ? field.options.join(', ') : field.options || ''}
                                                onChange={(e) => {
                                                    const arr = e.target.value
                                                        .split(',')
                                                        .map((s) => s.trim())
                                                        .filter(Boolean);
                                                    handleFieldChange(idx, 'options', arr);
                                                }}
                                                className="border-border bg-card text-foreground focus:ring-primary/40 w-full rounded-lg border px-2.5 py-1.5 text-xs focus:ring-1 focus:outline-none dark:bg-transparent"
                                                placeholder="Opción 1, Opción 2, Opción 3"
                                            />
                                        </div>
                                    )}

                                    <div className="text-muted-foreground flex items-center justify-between pt-1 text-[11px]">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id={`field_active_${idx}`}
                                                checked={field.active}
                                                onChange={(e) => handleFieldChange(idx, 'active', e.target.checked)}
                                                className="border-border text-primary h-3.5 w-3.5 rounded-sm bg-transparent"
                                            />
                                            <label htmlFor={`field_active_${idx}`} className="cursor-pointer font-medium">
                                                Campo Activo
                                            </label>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleRemoveField(idx)}
                                            className="text-destructive hover:text-destructive inline-flex items-center gap-1 transition-colors"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            <span>Eliminar Campo</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="border-border text-muted-foreground rounded-xl border border-dashed py-12 text-center">
                            <List className="text-muted-foreground/70 mx-auto mb-2 h-8 w-8" />
                            <p className="text-xs">No hay campos añadidos a este formulario. Haz clic en "Añadir Campo" para empezar.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
