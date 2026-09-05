import QuickMediaDrawer from '@/components/quick-media-drawer';
import Tiptap from '@/components/tiptap-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { CustomField } from '@/types';
import axios from 'axios';
import { format } from 'date-fns';
import { CalendarIcon, FileText, Plus, Trash2, UploadCloud } from 'lucide-react';
import React from 'react';
import { DayPicker } from 'react-day-picker';
// react-day-picker base styles. If Tailwind purges them, consider importing via CSS entry.
import 'react-day-picker/style.css';
// Using the core widget to avoid React peer dependency issues

// Eliminamos TinyMCE React por conflicto de versiones; usaremos textarea por ahora

// Types for Uploadcare widget

// Extend the Window interface to include SetUrl
declare global {
    interface Window {
        SetUrl?: (items: Array<{ url: string }>) => void;
    }
}

interface JsonObject {
    [key: string]: JsonValue;
}
type JsonArray = Array<JsonValue>;
type JsonValue = string | number | boolean | null | JsonObject | JsonArray;

interface ImageFieldRendererProps {
    field: CustomField;
    value: string;
    onChange: (value: string) => void;
}

function ImageFieldRenderer({ field, value, onChange }: ImageFieldRendererProps) {
    const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
    const [showManualUrl, setShowManualUrl] = React.useState(false);

    const filename = React.useMemo(() => {
        if (!value) return '';
        try {
            // Handle potential full URLs with domains nicely
            const parts = value.split('/');
            return decodeURIComponent(parts[parts.length - 1]);
        } catch {
            return value;
        }
    }, [value]);

    return (
        <div className="space-y-2">
            {value ? (
                <div className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 transition-all duration-200 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/30 dark:hover:border-zinc-700">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950">
                            <img src={value} alt={field.label} className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="truncate text-xs font-semibold text-zinc-800 dark:text-zinc-200">{filename}</div>
                            <div className="mt-0.5 truncate text-[10px] text-zinc-400 dark:text-zinc-500">{value}</div>
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                        <Button type="button" variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={() => setIsDrawerOpen(true)}>
                            Cambiar
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20"
                            onClick={() => onChange('')}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            ) : (
                <div
                    onClick={() => setIsDrawerOpen(true)}
                    className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 p-6 text-center transition-all hover:border-red-500/40 hover:bg-zinc-50/50 dark:border-zinc-800 dark:hover:border-red-500/30 dark:hover:bg-zinc-900/10"
                >
                    <UploadCloud className="mb-2 h-7 w-7 text-zinc-400 transition-colors group-hover:text-red-500" />
                    <span className="text-xs font-semibold text-zinc-700 transition-colors group-hover:text-red-500 dark:text-zinc-300">
                        Seleccionar Imagen
                    </span>
                    <span className="mt-1 text-[10px] text-zinc-400 dark:text-zinc-500">Biblioteca de Medios Rápida</span>
                </div>
            )}

            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={() => setShowManualUrl(!showManualUrl)}
                    className="text-[10px] text-zinc-400 underline transition-colors hover:text-zinc-600 focus:outline-none dark:text-zinc-500 dark:hover:text-zinc-300"
                >
                    {showManualUrl ? 'Ocultar edición manual' : 'Editar URL manualmente'}
                </button>
            </div>

            {showManualUrl && (
                <div className="mt-1.5">
                    <Input
                        type="text"
                        placeholder="https://ejemplo.com/imagen.jpg"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="h-8 bg-white text-xs dark:bg-[#161615]"
                    />
                </div>
            )}

            <QuickMediaDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onSelect={(url) => {
                    onChange(url);
                    setIsDrawerOpen(false);
                }}
                initialType="Images"
            />
        </div>
    );
}

interface DocumentFieldRendererProps {
    value: string;
    onChange: (value: string) => void;
}

function DocumentFieldRenderer({ value, onChange }: DocumentFieldRendererProps) {
    const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
    const [showManualUrl, setShowManualUrl] = React.useState(false);

    const filename = React.useMemo(() => {
        if (!value) return '';
        try {
            const parts = value.split('/');
            return decodeURIComponent(parts[parts.length - 1]);
        } catch {
            return value;
        }
    }, [value]);

    return (
        <div className="space-y-2">
            {value ? (
                <div className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 transition-all duration-200 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/30 dark:hover:border-zinc-700">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950">
                            <FileText className="h-5 w-5 text-red-500 dark:text-red-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="truncate text-xs font-semibold text-zinc-800 dark:text-zinc-200">{filename}</div>
                            <div className="mt-0.5 truncate text-[10px] text-zinc-400 dark:text-zinc-500">{value}</div>
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                        <Button type="button" variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={() => setIsDrawerOpen(true)}>
                            Cambiar
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20"
                            onClick={() => onChange('')}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            ) : (
                <div
                    onClick={() => setIsDrawerOpen(true)}
                    className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 p-6 text-center transition-all hover:border-red-500/40 hover:bg-zinc-50/50 dark:border-zinc-800 dark:hover:border-red-500/30 dark:hover:bg-zinc-900/10"
                >
                    <UploadCloud className="mb-2 h-7 w-7 text-zinc-400 transition-colors group-hover:text-red-500" />
                    <span className="text-xs font-semibold text-zinc-700 transition-colors group-hover:text-red-500 dark:text-zinc-300">
                        Seleccionar Archivo / Documento
                    </span>
                    <span className="mt-1 text-[10px] text-zinc-400 dark:text-zinc-500">Biblioteca de Medios Rápida</span>
                </div>
            )}

            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={() => setShowManualUrl(!showManualUrl)}
                    className="text-[10px] text-zinc-400 underline transition-colors hover:text-zinc-600 focus:outline-none dark:text-zinc-500 dark:hover:text-zinc-300"
                >
                    {showManualUrl ? 'Ocultar edición manual' : 'Editar URL manualmente'}
                </button>
            </div>

            {showManualUrl && (
                <div className="mt-1.5">
                    <Input
                        type="text"
                        placeholder="https://ejemplo.com/archivo.pdf"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="h-8 bg-white text-xs dark:bg-[#161615]"
                    />
                </div>
            )}

            <QuickMediaDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onSelect={(url) => {
                    onChange(url);
                    setIsDrawerOpen(false);
                }}
                initialType="Files"
            />
        </div>
    );
}

interface SliderFieldRendererProps {
    value: string;
    onChange: (value: string) => void;
}

function SliderFieldRenderer({ value, onChange }: SliderFieldRendererProps) {
    const [sliders, setSliders] = React.useState<Array<{ id: number; name: string; key: string }>>([]);
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        setLoading(true);
        axios
            .get('/admin/api/sliders')
            .then((res) => {
                setSliders(res.data);
            })
            .catch((err) => {
                console.error('Error loading sliders list:', err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    return (
        <Select value={value || ''} onValueChange={onChange}>
            <SelectTrigger className="w-full bg-white dark:bg-[#161615]">
                <SelectValue placeholder={loading ? 'Cargando sliders...' : 'Selecciona un slider'} />
            </SelectTrigger>
            <SelectContent>
                {sliders.length > 0 ? (
                    sliders.map((s) => (
                        <SelectItem key={s.id} value={s.key}>
                            {s.name} ({s.key})
                        </SelectItem>
                    ))
                ) : (
                    <SelectItem value="_none" disabled>
                        No hay sliders creados
                    </SelectItem>
                )}
            </SelectContent>
        </Select>
    );
}

interface CustomFieldRendererProps {
    fields: CustomField[];
    values: Record<string, JsonValue>;
    onChange: (key: string, value: JsonValue) => void;
}

interface RepeaterFieldProps {
    field: CustomField;
    values: Record<string, JsonValue>;
    onChange: (key: string, value: JsonValue) => void;
}

function RepeaterField({ field, values, onChange }: RepeaterFieldProps) {
    const rawItems = values?.[field.key] as JsonArray as JsonObject[] | undefined;

    // Ensure all items in the repeater have a stable unique _id key
    const items = React.useMemo(() => {
        const rawItemsList = rawItems || [];
        let changed = false;
        const nextItems = rawItemsList.map((item) => {
            if (!item || typeof item !== 'object' || !item._id) {
                changed = true;
                return { ...(item || {}), _id: Math.random().toString(36).substring(2, 9) };
            }
            return item;
        });

        if (changed) {
            // Defer updating the parent state to avoid dispatch during render phase
            setTimeout(() => {
                onChange(field.key, nextItems);
            }, 0);
        }
        return nextItems;
    }, [rawItems, field.key, onChange]);

    const addItem = () => {
        const empty: JsonObject = { _id: Math.random().toString(36).substring(2, 9) };
        onChange(field.key, [...items, empty]);
    };

    const removeItem = (idx: number) => {
        const next = items.filter((_, i) => i !== idx);
        onChange(field.key, next);
    };

    const updateItem = (idx: number, subKey: string, subValue: JsonValue) => {
        const next = items.map((it, i) => (i === idx ? { ...it, [subKey]: subValue } : it));
        onChange(field.key, next);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200/50 pb-2 dark:border-zinc-800/50">
                <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{field.label}</div>
                <Button
                    type="button"
                    size="sm"
                    onClick={addItem}
                    className="flex h-8 items-center gap-1.5 bg-red-600 px-3 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                >
                    <Plus className="h-4 w-4" />
                    <span>Añadir</span>
                </Button>
            </div>

            {items.length > 0 ? (
                <div className="space-y-4">
                    {items.map((item, idx) => {
                        const itemKey = (item._id as string) || String(idx);
                        return (
                            <div
                                key={itemKey}
                                className="relative rounded-xl border border-zinc-200 bg-zinc-50/30 p-5 transition-all duration-200 hover:border-zinc-300 hover:shadow-xs dark:border-zinc-800 dark:bg-zinc-900/10 dark:hover:border-zinc-700"
                            >
                                <div className="mb-4 flex items-center justify-between border-b border-zinc-200/60 pb-3 dark:border-zinc-800/60">
                                    <span className="bg-zinc-250 inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wider text-zinc-600 uppercase dark:bg-zinc-800 dark:text-zinc-400">
                                        Elemento {idx + 1}
                                    </span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 rounded-full text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20"
                                        onClick={() => removeItem(idx)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                <CustomFieldRenderer
                                    fields={field.fields || []}
                                    values={(item as JsonObject) || {}}
                                    onChange={(subKey, subValue) => updateItem(idx, subKey, subValue)}
                                />
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="dark:border-zinc-850 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/10 py-6 text-center dark:bg-zinc-900/5">
                    <p className="text-xs text-zinc-400 italic">No se han añadido elementos.</p>
                </div>
            )}
        </div>
    );
}

interface ContainerFieldProps {
    field: CustomField;
    values: Record<string, JsonValue>;
    onChange: (key: string, value: JsonValue) => void;
}

function ContainerField({ field, values, onChange }: ContainerFieldProps) {
    const containerValues = (values?.[field.key] as JsonObject) || {};
    const updateContainer = (subKey: string, subValue: JsonValue) => {
        const next: JsonObject = { ...containerValues, [subKey]: subValue };
        onChange(field.key, next);
    };
    return (
        <div className="relative space-y-4 rounded-xl border border-zinc-200 bg-zinc-50/20 p-5 dark:border-zinc-800 dark:bg-zinc-900/5">
            <div className="border-b border-zinc-200/60 pb-2.5 text-sm font-semibold text-zinc-800 dark:border-zinc-800/60 dark:text-zinc-200">
                {field.label}
            </div>
            <CustomFieldRenderer fields={field.fields || []} values={containerValues} onChange={updateContainer} />
        </div>
    );
}

export default function CustomFieldRenderer({ fields, values, onChange }: CustomFieldRendererProps) {
    const renderSimpleField = (field: CustomField) => {
        const value = (values?.[field.key] as JsonValue) ?? '';
        const common = {
            id: field.key,
            value: typeof value === 'string' || typeof value === 'number' ? String(value) : '',
            onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(field.key, e.target.value),
            className: 'w-full',
        };

        switch (field.type) {
            case 'number':
                return <Input type="number" {...common} />;
            case 'date':
                return (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={'outline'}
                                className={cn('w-full justify-start text-left font-normal', !value && 'text-muted-foreground')}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {value ? format(new Date(value as string), 'PPP') : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <DayPicker
                                mode="single"
                                selected={typeof value === 'string' && value ? new Date(value) : undefined}
                                onSelect={(d) => onChange(field.key, d ? d.toISOString().slice(0, 10) : '')}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                );
            case 'url':
                return <Input type="url" {...common} />;
            case 'textarea':
                return <textarea {...common} rows={4} />;
            case 'html_editor':
                return <Tiptap value={typeof value === 'string' ? value : ''} onChange={(html) => onChange(field.key, html)} />;
            case 'embed':
                return <textarea {...common} rows={4} />;
            case 'image':
                return (
                    <ImageFieldRenderer field={field} value={typeof value === 'string' ? value : ''} onChange={(val) => onChange(field.key, val)} />
                );
            case 'document':
                return <DocumentFieldRenderer value={typeof value === 'string' ? value : ''} onChange={(val) => onChange(field.key, val)} />;
            case 'slider':
                return <SliderFieldRenderer value={typeof value === 'string' ? value : ''} onChange={(val) => onChange(field.key, val)} />;
            case 'text':
            default:
                return <Input type="text" {...common} />;
        }
    };

    return (
        <div className="space-y-4">
            {fields?.map((field) => (
                <div key={field.key} className="space-y-2">
                    {field.type !== 'container' && field.type !== 'repeater' && <Label htmlFor={field.key}>{field.label}</Label>}
                    {field.type === 'container' && <ContainerField field={field} values={values} onChange={onChange} />}
                    {field.type === 'repeater' && <RepeaterField field={field} values={values} onChange={onChange} />}
                    {field.type !== 'container' && field.type !== 'repeater' && renderSimpleField(field)}
                </div>
            ))}
        </div>
    );
}
