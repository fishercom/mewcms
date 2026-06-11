import { useState, useEffect, FormEventHandler } from 'react';
import { Link, usePage } from '@inertiajs/react';
import ModuleLayout from '@/layouts/module/layout';
import FormLayout from '@/layouts/module/Form';
import { createTemplate } from '@/services/templates';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function Create() {
    const { defaultBoilerplate = '' } = usePage<{ defaultBoilerplate?: string }>().props;

    const [name, setName] = useState('');
    const [filename, setFilename] = useState('');
    const [content, setContent] = useState(defaultBoilerplate);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    // Auto-generate safe filename slug from template name
    useEffect(() => {
        const slug = name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // remove accents
            .replace(/[^a-z0-9\s_-]/g, '') // remove special chars
            .replace(/\s+/g, '-'); // replace spaces with hyphens
        setFilename(slug);
    }, [name]);

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        // Add the comment directive block to content if not already exists
        let finalContent = content;
        if (!content.includes('Template Name:')) {
            finalContent = `/**\n * Template Name: ${name}\n */\n${content}`;
        }

        createTemplate(
            {
                name,
                filename,
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
            }
        );
    };

    return (
        <ModuleLayout view="Crear">
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
                        <Label htmlFor="filename">Nombre del Archivo</Label>
                        <div className="flex items-center gap-1">
                            <Input
                                id="filename"
                                type="text"
                                required
                                value={filename}
                                onChange={(e) => setFilename(e.target.value)}
                                disabled={processing}
                                placeholder="contacto-principal"
                                className="font-mono text-sm"
                            />
                            <span className="text-sm font-semibold text-gray-400">.tsx</span>
                        </div>
                        <p className="text-xs text-gray-400">
                            Debe constar de caracteres alfanuméricos, guiones o guiones bajos.
                        </p>
                        {errors.filename && <span className="text-xs text-red-500">{errors.filename}</span>}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="content">Código de la Plantilla (React / TypeScript)</Label>
                        <div className="border rounded-md overflow-hidden bg-gray-900 border-gray-800">
                            <div className="bg-gray-800/60 px-4 py-2 border-b border-gray-900 text-xs text-gray-400 font-mono flex items-center justify-between">
                                <span>{filename ? `${filename}.tsx` : 'template.tsx'}</span>
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
                            {processing ? 'Guardando...' : 'Guardar'}
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
