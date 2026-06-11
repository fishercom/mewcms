import React from 'react';
import Tiptap from '@/components/tiptap-editor';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { CustomField } from '@/types';
import { DayPicker } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, UploadCloud, Trash2, FileText, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import QuickMediaDrawer from '@/components/quick-media-drawer';
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


interface JsonObject { [key: string]: JsonValue }
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
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 p-3 flex items-center justify-between gap-4 transition-all duration-200 hover:border-zinc-300 dark:hover:border-zinc-700">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 shrink-0">
              <img src={value} alt={field.label} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                {filename}
              </div>
              <div className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
                {value}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs"
              onClick={() => setIsDrawerOpen(true)}
            >
              Cambiar
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
              onClick={() => onChange('')}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div 
          onClick={() => setIsDrawerOpen(true)}
          className="flex flex-col items-center justify-center p-6 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 hover:border-red-500/40 dark:hover:border-red-500/30 transition-all cursor-pointer text-center group"
        >
          <UploadCloud className="h-7 w-7 text-zinc-400 group-hover:text-red-500 transition-colors mb-2" />
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-red-500 transition-colors">
            Seleccionar Imagen
          </span>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">
            Biblioteca de Medios Rápida
          </span>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowManualUrl(!showManualUrl)}
          className="text-[10px] text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors underline focus:outline-none"
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
            className="text-xs h-8 bg-white dark:bg-[#161615]"
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
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 p-3 flex items-center justify-between gap-4 transition-all duration-200 hover:border-zinc-300 dark:hover:border-zinc-700">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 shrink-0">
              <FileText className="h-5 w-5 text-red-500 dark:text-red-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                {filename}
              </div>
              <div className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
                {value}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs"
              onClick={() => setIsDrawerOpen(true)}
            >
              Cambiar
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
              onClick={() => onChange('')}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div 
          onClick={() => setIsDrawerOpen(true)}
          className="flex flex-col items-center justify-center p-6 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 hover:border-red-500/40 dark:hover:border-red-500/30 transition-all cursor-pointer text-center group"
        >
          <UploadCloud className="h-7 w-7 text-zinc-400 group-hover:text-red-500 transition-colors mb-2" />
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-red-500 transition-colors">
            Seleccionar Archivo / Documento
          </span>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">
            Biblioteca de Medios Rápida
          </span>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowManualUrl(!showManualUrl)}
          className="text-[10px] text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors underline focus:outline-none"
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
            className="text-xs h-8 bg-white dark:bg-[#161615]"
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
  const rawItems = (values?.[field.key] as JsonArray) as JsonObject[] | undefined;

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
      <div className="flex items-center justify-between border-b border-zinc-200/50 dark:border-zinc-800/50 pb-2">
        <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{field.label}</div>
        <Button 
          type="button" 
          size="sm" 
          onClick={addItem}
          className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-500 dark:hover:bg-red-600 flex items-center gap-1.5 h-8 px-3"
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
                className="bg-zinc-50/30 dark:bg-zinc-900/10 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 relative transition-all duration-200 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-xs"
              >
                <div className="flex justify-between items-center border-b border-zinc-200/60 dark:border-zinc-800/60 pb-3 mb-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-250 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                    Elemento {idx + 1}
                  </span>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 rounded-full text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20" 
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
        <div className="text-center py-6 border border-dashed border-zinc-200 dark:border-zinc-850 rounded-xl bg-zinc-50/10 dark:bg-zinc-900/5">
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
    <div className="bg-zinc-50/20 dark:bg-zinc-900/5 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 relative space-y-4">
      <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 border-b border-zinc-200/60 dark:border-zinc-800/60 pb-2.5">
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
      value: (typeof value === 'string' || typeof value === 'number') ? String(value) : '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(field.key, e.target.value),
      className: 'w-full'
    };

    switch (field.type) {
      case 'number':
        return <Input type="number" {...common} />;
      case 'date':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !value && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? format(new Date(value as string), "PPP") : <span>Pick a date</span>}
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
        return (
          <Tiptap
            value={typeof value === 'string' ? value : ''}
            onChange={(html) => onChange(field.key, html)}
          />
        );
      case 'embed':
        return <textarea {...common} rows={4} />;
      case 'image':
        return (
          <ImageFieldRenderer
            field={field}
            value={typeof value === 'string' ? value : ''}
            onChange={(val) => onChange(field.key, val)}
          />
        );
      case 'document':
        return (
          <DocumentFieldRenderer
            value={typeof value === 'string' ? value : ''}
            onChange={(val) => onChange(field.key, val)}
          />
        );
      case 'text':
      default:
        return <Input type="text" {...common} />;
    }
  };

  return (
    <div className="space-y-4">
      {fields?.map((field) => (
        <div key={field.key} className="space-y-2">
          {field.type !== 'container' && field.type !== 'repeater' && (
            <Label htmlFor={field.key}>{field.label}</Label>
          )}
          {field.type === 'container' && (
            <ContainerField field={field} values={values} onChange={onChange} />
          )}
          {field.type === 'repeater' && (
            <RepeaterField field={field} values={values} onChange={onChange} />
          )}
          {field.type !== 'container' && field.type !== 'repeater' && renderSimpleField(field)}
        </div>
      ))}
    </div>
  );
}


