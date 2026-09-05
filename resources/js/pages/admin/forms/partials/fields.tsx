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
                <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                    <h3 className="dark:border-zinc-850 flex items-center gap-1.5 border-b border-zinc-100 pb-3 text-sm font-bold text-zinc-800 dark:text-zinc-200">
                        <Settings className="h-4 w-4 text-red-600" />
                        <span>Ajustes del Formulario</span>
                    </h3>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Nombre</label>
                        <input
                            type="text"
                            required
                            value={data.name || ''}
                            onChange={(e) => handleFormChange('name', e.target.value)}
                            className="dark:border-zinc-850 w-full rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm text-zinc-800 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none dark:text-zinc-200"
                            placeholder="Ej. Formulario de Contacto"
                        />
                        {errors.name && <p className="text-[11px] text-red-500">{errors.name}</p>}
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Alias (Clave única)</label>
                        <input
                            type="text"
                            required
                            value={data.alias || ''}
                            onChange={(e) => handleFormChange('alias', e.target.value)}
                            className="dark:border-zinc-850 w-full rounded-lg border border-zinc-200 bg-transparent px-3 py-2 font-mono text-sm text-zinc-800 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none dark:text-zinc-200"
                            placeholder="Ej. contacto_general"
                        />
                        {errors.alias && <p className="text-[11px] text-red-500">{errors.alias}</p>}
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Información / Descripción</label>
                        <textarea
                            value={data.info || ''}
                            onChange={(e) => handleFormChange('info', e.target.value)}
                            rows={3}
                            className="dark:border-zinc-850 w-full rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm text-zinc-800 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none dark:text-zinc-200"
                            placeholder="Info de ayuda o descripción del propósito del formulario"
                        />
                        {errors.info && <p className="text-[11px] text-red-500">{errors.info}</p>}
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <input
                            type="checkbox"
                            id="form_active"
                            checked={data.active ?? true}
                            onChange={(e) => handleFormChange('active', e.target.checked)}
                            className="dark:border-zinc-850 h-4 w-4 rounded-sm border-zinc-200 bg-transparent text-red-600 focus:ring-2 focus:ring-red-500"
                        />
                        <label htmlFor="form_active" className="cursor-pointer text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                            Formulario Activo
                        </label>
                    </div>
                </div>
            </div>

            {/* Right Column: Dynamic Form Fields Schema Builder */}
            <div className="space-y-4 lg:col-span-8">
                <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="dark:border-zinc-850 flex items-center justify-between border-b border-zinc-100 pb-3">
                        <h3 className="flex items-center gap-1.5 text-sm font-bold text-zinc-800 dark:text-zinc-200">
                            <List className="h-4 w-4 text-red-600" />
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
                                <div
                                    key={idx}
                                    className="dark:border-zinc-850 relative space-y-3 rounded-xl border border-zinc-100 bg-zinc-50/30 p-4 dark:bg-zinc-900/40"
                                >
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">Etiqueta</label>
                                            <input
                                                type="text"
                                                required
                                                value={field.name}
                                                onChange={(e) => handleFieldChange(idx, 'name', e.target.value)}
                                                className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-800 focus:ring-1 focus:ring-red-500 focus:outline-none dark:border-zinc-800 dark:bg-transparent dark:text-zinc-200"
                                                placeholder="Ej. Correo Electrónico"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">Clave</label>
                                            <input
                                                type="text"
                                                required
                                                value={field.alias}
                                                onChange={(e) => handleFieldChange(idx, 'alias', e.target.value)}
                                                className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 font-mono text-xs text-zinc-800 focus:ring-1 focus:ring-red-500 focus:outline-none dark:border-zinc-800 dark:bg-transparent dark:text-zinc-200"
                                                placeholder="Ej. email"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
                                                Tipo de Entrada
                                            </label>
                                            <select
                                                value={field.type}
                                                onChange={(e) => handleFieldChange(idx, 'type', e.target.value as CmsFormField['type'])}
                                                className="h-8 w-full rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-800 focus:ring-1 focus:ring-red-500 focus:outline-none dark:border-zinc-800 dark:bg-transparent dark:text-zinc-200"
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
                                            <label className="flex items-center gap-1 text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
                                                <CircleDot className="h-3 w-3 text-red-500" />
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
                                                className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-800 focus:ring-1 focus:ring-red-500 focus:outline-none dark:border-zinc-800 dark:bg-transparent dark:text-zinc-200"
                                                placeholder="Opción 1, Opción 2, Opción 3"
                                            />
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-400">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id={`field_active_${idx}`}
                                                checked={field.active}
                                                onChange={(e) => handleFieldChange(idx, 'active', e.target.checked)}
                                                className="h-3.5 w-3.5 rounded-sm border-zinc-200 bg-transparent text-red-600 dark:border-zinc-800"
                                            />
                                            <label htmlFor={`field_active_${idx}`} className="cursor-pointer font-medium">
                                                Campo Activo
                                            </label>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleRemoveField(idx)}
                                            className="inline-flex items-center gap-1 text-red-500 transition-colors hover:text-red-600"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            <span>Eliminar Campo</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed border-zinc-200 py-12 text-center text-zinc-400 dark:border-zinc-800">
                            <List className="mx-auto mb-2 h-8 w-8 text-zinc-300" />
                            <p className="text-xs">No hay campos añadidos a este formulario. Haz clic en "Añadir Campo" para empezar.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
