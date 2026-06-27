import React, { useState } from 'react';
import { CustomField } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash, GripVertical } from 'lucide-react';
import { ReactSortable } from 'react-sortablejs';


interface CustomFieldManagerProps {
    fields: CustomField[];
    setFields: (fields: CustomField[]) => void;
}

export default function CustomFieldManager({ fields, setFields }: CustomFieldManagerProps) {
    const [newField, setNewField] = useState<CustomField>({ label: '', key: '', type: '' });

    const addField = () => {
        if (newField.label && newField.key && newField.type) {
            setFields([...fields, { ...newField, fields: (newField.type === 'repeater' || newField.type === 'container') ? [] : undefined }]);
            setNewField({ label: '', key: '', type: '' });
        }
    };

    const updateField = (index: number, updatedField: CustomField) => {
        const updatedFields = fields.map((field, i) =>
            i === index ? updatedField : field
        );
        setFields(updatedFields);
    };

    const updateRepeaterFields = (index: number, newRepeaterFields: CustomField[]) => {
        const updatedFields = fields.map((field, i) =>
            i === index ? { ...field, fields: newRepeaterFields } : field
        );
        setFields(updatedFields);
    };

    const removeField = (index: number) => {
        const updatedFields = fields.filter((_, i) => i !== index);
        setFields(updatedFields);
    };

    const sortableFields = React.useMemo(() => {
        return fields.map((f, idx) => ({ ...f, id: f.id || f.key || `field_${idx}` }));
    }, [fields]);

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-200/50 dark:border-zinc-800/50 pb-2">
                <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200">Configuración de Campos Personalizados</h3>
            </div>

            <div className="space-y-4">
                <ReactSortable
                    list={sortableFields}
                    setList={(newList) => {
                        setFields(newList as CustomField[]);
                    }}
                    handle=".drag-handle"
                    className="space-y-4"
                >
                    {sortableFields.map((field, index) => (
                        <div 
                            key={field.id} 
                            className="bg-zinc-50/40 dark:bg-zinc-900/15 border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-4 flex gap-4 items-start relative hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors shadow-xs animate-in fade-in-50 duration-200"
                        >
                            {/* Drag handle */}
                            <div className="drag-handle cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-650 p-1.5 self-center shrink-0">
                                <GripVertical className="h-5 w-5" />
                            </div>

                            {/* Field Editor Contents */}
                            <div className="flex-1 space-y-3 min-w-0">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Etiqueta</Label>
                                        <Input
                                            className="h-9 bg-white dark:bg-[#161615]"
                                            value={field.label}
                                            onChange={(e) => updateField(index, { ...field, label: e.target.value })}
                                            placeholder="Ej. Imagen de Cabecera"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Clave (Key única)</Label>
                                        <Input
                                            className="h-9 bg-white dark:bg-[#161615]"
                                            value={field.key}
                                            onChange={(e) => updateField(index, { ...field, key: e.target.value.replace(/[^a-zA-Z0-9-_]/g, '') })}
                                            placeholder="Ej. header_image"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Tipo de Campo</Label>
                                        <div className="flex items-center gap-2">
                                            <Select 
                                                onValueChange={(value) => updateField(index, { ...field, type: value })} 
                                                value={field.type}
                                            >
                                                <SelectTrigger className="h-9 bg-white dark:bg-[#161615] flex-1">
                                                    <SelectValue placeholder="Tipo" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="text">Texto</SelectItem>
                                                    <SelectItem value="number">Número</SelectItem>
                                                    <SelectItem value="date">Fecha</SelectItem>
                                                    <SelectItem value="url">Enlace / URL</SelectItem>
                                                    <SelectItem value="textarea">Área de Texto</SelectItem>
                                                    <SelectItem value="image">Imagen (Media)</SelectItem>
                                                    <SelectItem value="document">Documento / Archivo</SelectItem>
                                                    <SelectItem value="html_editor">Editor HTML (Rich Text)</SelectItem>
                                                    <SelectItem value="embed">Embed (Código/Vídeo)</SelectItem>
                                                    <SelectItem value="slider">Control Deslizante (Slider)</SelectItem>
                                                    <SelectItem value="repeater">Repeater (Repetidor)</SelectItem>
                                                    <SelectItem value="container">Contenedor (Grupo)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Button 
                                                variant="ghost" 
                                                type="button" 
                                                onClick={() => removeField(index)} 
                                                size="icon" 
                                                className="h-9 w-9 shrink-0 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md"
                                            >
                                                <Trash className="h-4 w-4" />
                                                <span className="sr-only">Eliminar</span>
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {(field.type === 'repeater' || field.type === 'container') && field.fields && (
                                    <div className="ml-4 border-l border-zinc-200 dark:border-zinc-800 pl-4 mt-3 pt-1">
                                        <CustomFieldManager
                                            fields={field.fields || []}
                                            setFields={(newRepeaterFields) => updateRepeaterFields(index, newRepeaterFields)}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </ReactSortable>
            </div>

            <div className="bg-zinc-100/30 dark:bg-zinc-950/20 border border-dashed border-zinc-200 dark:border-zinc-850 rounded-xl p-4 space-y-3">
                <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    Nuevo Campo
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Etiqueta</Label>
                        <Input
                            className="h-9 bg-white dark:bg-[#161615]"
                            value={newField.label}
                            onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                            placeholder="Ej. Enlace de Destino"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Clave (Key única)</Label>
                        <Input
                            className="h-9 bg-white dark:bg-[#161615]"
                            value={newField.key}
                            onChange={(e) => setNewField({ ...newField, key: e.target.value.replace(/[^a-zA-Z0-9-_]/g, '') })}
                            placeholder="Ej. destination_url"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Tipo de Campo</Label>
                        <div className="flex items-center gap-2">
                            <Select 
                                onValueChange={(value) => setNewField({ ...newField, type: value })} 
                                value={newField.type}
                            >
                                <SelectTrigger className="h-9 bg-white dark:bg-[#161615] flex-1">
                                    <SelectValue placeholder="Tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="text">Texto</SelectItem>
                                    <SelectItem value="number">Número</SelectItem>
                                    <SelectItem value="date">Fecha</SelectItem>
                                    <SelectItem value="url">Enlace / URL</SelectItem>
                                    <SelectItem value="textarea">Área de Texto</SelectItem>
                                    <SelectItem value="image">Imagen (Media)</SelectItem>
                                    <SelectItem value="document">Documento / Archivo</SelectItem>
                                    <SelectItem value="html_editor">Editor HTML (Rich Text)</SelectItem>
                                    <SelectItem value="embed">Embed (Código/Vídeo)</SelectItem>
                                    <SelectItem value="slider">Control Deslizante (Slider)</SelectItem>
                                    <SelectItem value="repeater">Repeater (Repetidor)</SelectItem>
                                    <SelectItem value="container">Contenedor (Grupo)</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button 
                                type="button" 
                                onClick={addField} 
                                className="h-9 px-4 bg-red-600 hover:bg-red-700 text-white dark:bg-red-500 dark:hover:bg-red-600 shrink-0 flex items-center gap-1.5"
                            >
                                <Plus className="h-4 w-4" />
                                <span>Agregar</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
