import { useState, FormEventHandler } from 'react';
import { Link, usePage } from '@inertiajs/react';
import ModuleLayout from '@/layouts/module/layout';
import FormLayout from '@/layouts/module/Form';
import { updateTemplate } from '@/services/templates';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface EditProps {
    filename: string;
    name: string;
    content: string;
    [key: string]: unknown;
}

export default function Edit() {
    const { filename, name: initialName, content: initialContent } = usePage<EditProps>().props;

    const [name, setName] = useState(initialName);
    const [content, setContent] = useState(initialContent);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        // Replace the template name directive in content if exists
        let finalContent = content;
        if (content.includes('Template Name:')) {
            finalContent = content.replace(/(Template\s+Name:\s*)([^\r\n*]+)/i, `$1${name}`);
        } else {
            finalContent = `/**\n * Template Name: ${name}\n */\n${content}`;
        }

        updateTemplate(filename, {
            name,
            content: finalContent
        }, {
            onSuccess: () => {
                setProcessing(false);
            },
            onError: (err: Record<string, string>) => {
                setErrors(err);
                setProcessing(false);
            }
        });
    };

    return (
        <ModuleLayout view="Editar">
            <FormLayout>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nombre de la Plantilla</Label>
                        <Input
                            id="name"
                            type="text"
                            required
                            autoFocus
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={processing}
                            placeholder="e.g. Contacto Principal"
                        />
                        {errors.name && <span className="text-xs text-red-500">{errors.name}</span>}
                    </div>

                    <div className="grid gap-2">
                        <Label>Nombre del Archivo (Lectura únicamente)</Label>
                        <Input
                            type="text"
                            disabled
                            value={`${filename}.tsx`}
                            className="font-mono text-sm bg-gray-50 text-gray-500 cursor-not-allowed dark:bg-[#1c1c1a]"
                        />
                        <p className="text-xs text-gray-400">
                            Para cambiar el nombre del archivo, cámbielo en el sistema de archivos del servidor.
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="content">Código de la Plantilla (React / TypeScript)</Label>
                        <div className="border rounded-md overflow-hidden bg-gray-900 border-gray-800">
                            <div className="bg-gray-800/60 px-4 py-2 border-b border-gray-900 text-xs text-gray-400 font-mono flex items-center justify-between">
                                <span>{`${filename}.tsx`}</span>
                                <span className="text-red-400 font-semibold">TSX</span>
                            </div>
                            <Textarea
                                id="content"
                                required
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                disabled={processing}
                                className="font-mono text-sm leading-relaxed p-4 bg-gray-900 text-gray-100 border-0 focus-visible:ring-0 resize-y min-h-[400px]"
                                placeholder="// Escribe el código de tu componente React..."
                                spellCheck={false}
                            />
                        </div>
                        {errors.content && <span className="text-xs text-red-500">{errors.content}</span>}
                    </div>

                    <div className="flex items-center gap-4">
                        <Button disabled={processing} className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-500 dark:hover:bg-red-600">
                            {processing ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                        <Link href="/admin/templates" className="text-sm text-gray-500 hover:underline">
                            Cancelar
                        </Link>
                    </div>
                </form>
            </FormLayout>
        </ModuleLayout>
    );
}
