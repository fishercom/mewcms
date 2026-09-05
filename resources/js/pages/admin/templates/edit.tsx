import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import FormLayout from '@/layouts/module/Form';
import ModuleLayout from '@/layouts/module/layout';
import { updateTemplate } from '@/services/templates';
import { Link, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

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

        updateTemplate(
            filename,
            {
                name,
                content: finalContent,
            },
            {
                onSuccess: () => {
                    setProcessing(false);
                },
                onError: (err: Record<string, string>) => {
                    setErrors(err);
                    setProcessing(false);
                },
            },
        );
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
                            className="cursor-not-allowed bg-gray-50 font-mono text-sm text-gray-500 dark:bg-[#1c1c1a]"
                        />
                        <p className="text-xs text-gray-400">Para cambiar el nombre del archivo, cámbielo en el sistema de archivos del servidor.</p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="content">Código de la Plantilla (React / TypeScript)</Label>
                        <div className="overflow-hidden rounded-md border border-gray-800 bg-gray-900">
                            <div className="flex items-center justify-between border-b border-gray-900 bg-gray-800/60 px-4 py-2 font-mono text-xs text-gray-400">
                                <span>{`${filename}.tsx`}</span>
                                <span className="font-semibold text-red-400">TSX</span>
                            </div>
                            <Textarea
                                id="content"
                                required
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                disabled={processing}
                                className="min-h-[400px] resize-y border-0 bg-gray-900 p-4 font-mono text-sm leading-relaxed text-gray-100 focus-visible:ring-0"
                                placeholder="// Escribe el código de tu componente React..."
                                spellCheck={false}
                            />
                        </div>
                        {errors.content && <span className="text-xs text-red-500">{errors.content}</span>}
                    </div>

                    <div className="flex items-center gap-4">
                        <Button disabled={processing} className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600">
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
