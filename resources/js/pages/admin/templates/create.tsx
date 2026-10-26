import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import FormLayout from '@/layouts/module/Form';
import ModuleLayout from '@/layouts/module/layout';
import { t } from '@/lib/i18n';
import { createTemplate } from '@/services/templates';
import { Link, usePage } from '@inertiajs/react';
import { FormEventHandler, useEffect, useState } from 'react';

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
            },
        );
    };

    return (
        <ModuleLayout view={t('Crear')}>
            <FormLayout>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-2">
                        <Label htmlFor="name">{t('Nombre de la Plantilla')}</Label>
                        <Input
                            id="name"
                            type="text"
                            required
                            autoFocus
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={processing}
                            placeholder={t('e.g. Contacto Principal')}
                        />
                        {errors.name && <span className="text-destructive text-xs">{errors.name}</span>}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="filename">{t('Nombre del Archivo')}</Label>
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
                            <span className="text-muted-foreground text-sm font-semibold">.tsx</span>
                        </div>
                        <p className="text-muted-foreground text-xs">{t('Debe constar de caracteres alfanuméricos, guiones o guiones bajos.')}</p>
                        {errors.filename && <span className="text-destructive text-xs">{errors.filename}</span>}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="content">{t('Código de la Plantilla (React / TypeScript)')}</Label>
                        <div className="border-border-strong bg-muted overflow-hidden rounded-md border">
                            <div className="border-border-strong bg-muted/60 text-muted-foreground flex items-center justify-between border-b px-4 py-2 font-mono text-xs">
                                <span>{filename ? `${filename}.tsx` : 'template.tsx'}</span>
                                <span className="text-primary font-semibold">TSX</span>
                            </div>
                            <Textarea
                                id="content"
                                required
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                disabled={processing}
                                className="bg-muted text-muted-foreground/70 min-h-[400px] resize-y border-0 p-4 font-mono text-sm leading-relaxed focus-visible:ring-0"
                                placeholder="// Escribe el código de tu componente React..."
                                spellCheck={false}
                            />
                        </div>
                        {errors.content && <span className="text-destructive text-xs">{errors.content}</span>}
                    </div>

                    <div className="flex items-center gap-4">
                        <Button disabled={processing} className="bg-primary text-primary-foreground hover:bg-primary/90">
                            {processing ? t('Guardando...') : t('Guardar')}
                        </Button>
                        <Link href="/admin/templates" className="text-muted-foreground text-sm hover:underline">
                            {t('Cancelar')}
                        </Link>
                    </div>
                </form>
            </FormLayout>
        </ModuleLayout>
    );
}
