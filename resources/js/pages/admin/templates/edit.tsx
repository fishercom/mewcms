import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import FormLayout from '@/layouts/module/Form';
import ModuleLayout from '@/layouts/module/layout';
import { t } from '@/lib/i18n';
import { updateTemplate } from '@/services/templates';
import { Link, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

interface EditProps {
    filename: string;
    name: string;
    content: string;
    canEdit: boolean;
    [key: string]: unknown;
}

export default function Edit() {
    const { filename, name: initialName, content: initialContent, canEdit } = usePage<EditProps>().props;

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
        <ModuleLayout view={t('Editar')}>
            <FormLayout>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {!canEdit && (
                        <div className="border-warning/30 bg-warning-soft text-warning rounded-lg border p-3 text-sm">
                            {t(
                                'El editor de plantillas está deshabilitado. Solo un super administrador puede guardar cambios cuando CMS_TEMPLATE_EDITOR está activo.',
                            )}
                        </div>
                    )}
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
                        <Label>{t('Nombre del Archivo (Lectura únicamente)')}</Label>
                        <Input
                            type="text"
                            disabled
                            value={`${filename}.tsx`}
                            className="bg-muted/50 text-muted-foreground cursor-not-allowed font-mono text-sm"
                        />
                        <p className="text-muted-foreground text-xs">
                            {t('Para cambiar el nombre del archivo, cámbielo en el sistema de archivos del servidor.')}
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="content">{t('Código de la Plantilla (React / TypeScript)')}</Label>
                        <div className="border-border-strong bg-muted overflow-hidden rounded-md border">
                            <div className="border-border-strong bg-muted/60 text-muted-foreground flex items-center justify-between border-b px-4 py-2 font-mono text-xs">
                                <span>{`${filename}.tsx`}</span>
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
                        <Button disabled={processing || !canEdit} className="bg-primary text-primary-foreground hover:bg-primary/90">
                            {processing ? t('Guardando...') : t('Guardar Cambios')}
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
