import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CustomField } from '@/types';
import { GripVertical, Plus, Trash } from 'lucide-react';
import React, { useState } from 'react';
import { ReactSortable } from 'react-sortablejs';

interface CustomFieldManagerProps {
    fields: CustomField[];
    setFields: (fields: CustomField[]) => void;
}

export default function CustomFieldManager({ fields, setFields }: CustomFieldManagerProps) {
    const [newField, setNewField] = useState<CustomField>({ label: '', key: '', type: '' });

    const addField = () => {
        if (newField.label && newField.key && newField.type) {
            setFields([...fields, { ...newField, fields: newField.type === 'repeater' || newField.type === 'container' ? [] : undefined }]);
            setNewField({ label: '', key: '', type: '' });
        }
    };

    const updateField = (index: number, updatedField: CustomField) => {
        const updatedFields = fields.map((field, i) => (i === index ? updatedField : field));
        setFields(updatedFields);
    };

    const updateRepeaterFields = (index: number, newRepeaterFields: CustomField[]) => {
        const updatedFields = fields.map((field, i) => (i === index ? { ...field, fields: newRepeaterFields } : field));
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
            <div className="border-border flex items-center justify-between border-b pb-2">
                <h3 className="text-foreground text-base font-bold">Configuración de Campos Personalizados</h3>
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
                            className="animate-in fade-in-50 border-border bg-muted/50 hover:border-border relative flex items-start gap-4 rounded-xl border p-4 shadow-xs transition-colors duration-200"
                        >
                            {/* Drag handle */}
                            <div className="drag-handle hover:text-foreground text-muted-foreground shrink-0 cursor-grab self-center p-1.5 active:cursor-grabbing">
                                <GripVertical className="h-5 w-5" />
                            </div>

                            {/* Field Editor Contents */}
                            <div className="min-w-0 flex-1 space-y-3">
                                <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-muted-foreground text-xs font-semibold">Etiqueta</Label>
                                        <Input
                                            className="bg-card h-9"
                                            value={field.label}
                                            onChange={(e) => updateField(index, { ...field, label: e.target.value })}
                                            placeholder="Ej. Imagen de Cabecera"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-muted-foreground text-xs font-semibold">Clave (Key única)</Label>
                                        <Input
                                            className="bg-card h-9"
                                            value={field.key}
                                            onChange={(e) => updateField(index, { ...field, key: e.target.value.replace(/[^a-zA-Z0-9-_]/g, '') })}
                                            placeholder="Ej. header_image"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-muted-foreground text-xs font-semibold">Tipo de Campo</Label>
                                        <div className="flex items-center gap-2">
                                            <Select onValueChange={(value) => updateField(index, { ...field, type: value })} value={field.type}>
                                                <SelectTrigger className="bg-card h-9 flex-1">
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
                                                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-9 w-9 shrink-0 rounded-md"
                                            >
                                                <Trash className="h-4 w-4" />
                                                <span className="sr-only">Eliminar</span>
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {(field.type === 'repeater' || field.type === 'container') && field.fields && (
                                    <div className="border-border mt-3 ml-4 border-l pt-1 pl-4">
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

            <div className="border-border bg-muted/30 space-y-3 rounded-xl border border-dashed p-4">
                <div className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">Nuevo Campo</div>
                <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-3">
                    <div className="space-y-1.5">
                        <Label className="text-muted-foreground text-xs font-semibold">Etiqueta</Label>
                        <Input
                            className="bg-card h-9"
                            value={newField.label}
                            onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                            placeholder="Ej. Enlace de Destino"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-muted-foreground text-xs font-semibold">Clave (Key única)</Label>
                        <Input
                            className="bg-card h-9"
                            value={newField.key}
                            onChange={(e) => setNewField({ ...newField, key: e.target.value.replace(/[^a-zA-Z0-9-_]/g, '') })}
                            placeholder="Ej. destination_url"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-muted-foreground text-xs font-semibold">Tipo de Campo</Label>
                        <div className="flex items-center gap-2">
                            <Select onValueChange={(value) => setNewField({ ...newField, type: value })} value={newField.type}>
                                <SelectTrigger className="bg-card h-9 flex-1">
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
                                className="bg-primary text-primary-foreground hover:bg-primary/90 flex h-9 shrink-0 items-center gap-1.5 px-4"
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
