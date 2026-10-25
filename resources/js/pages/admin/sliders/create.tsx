import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FormLayout from '@/layouts/module/Form';
import ModuleLayout from '@/layouts/module/layout';
import { createSlider } from '@/services/sliders';
import { Link } from '@inertiajs/react';
import { FormEventHandler, useEffect, useState } from 'react';

export default function Create() {
    const [name, setName] = useState('');
    const [key, setKey] = useState('');
    const [description, setDescription] = useState('');
    const [autoplay, setAutoplay] = useState(true);
    const [autoplaySpeed, setAutoplaySpeed] = useState(3000);
    const [transitionSpeed, setTransitionSpeed] = useState(500);
    const [effect, setEffect] = useState<'slide' | 'fade'>('slide');
    const [loop, setLoop] = useState(true);
    const [dots, setDots] = useState(true);
    const [arrows, setArrows] = useState(true);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    // Auto-generate key from name
    useEffect(() => {
        const slug = name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // remove accents
            .replace(/[^a-z0-9\s_-]/g, '') // remove special chars
            .replace(/\s+/g, '_'); // replace spaces with underscores
        setKey(slug);
    }, [name]);

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        const sliderData = {
            name,
            key,
            description,
            settings: {
                autoplay,
                autoplaySpeed,
                transitionSpeed,
                effect,
                loop,
                dots,
                arrows,
            },
        };

        createSlider(sliderData, {
            onSuccess: () => {
                setProcessing(false);
            },
            onError: (err: Record<string, string>) => {
                setErrors(err);
                setProcessing(false);
            },
        });
    };

    return (
        <ModuleLayout view="Crear Slider">
            <FormLayout>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <h3 className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">Información General</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nombre del Slider</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={processing}
                                    placeholder="e.g. Carrusel de Inicio"
                                    className="bg-card"
                                />
                                {errors.name && <span className="text-destructive text-xs">{errors.name}</span>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="key">Clave (Key identificadora)</Label>
                                <Input
                                    id="key"
                                    type="text"
                                    required
                                    value={key}
                                    onChange={(e) => setKey(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                                    disabled={processing}
                                    placeholder="e.g. carrusel_inicio"
                                    className="bg-card font-mono text-sm"
                                />
                                <span className="text-muted-foreground text-[10px]">
                                    Usada para cargar este slider en el código/plantillas. Caracteres alfanuméricos y guiones.
                                </span>
                                {errors.key && <span className="text-destructive text-xs">{errors.key}</span>}
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Descripción</Label>
                            <Input
                                id="description"
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                disabled={processing}
                                placeholder="Describa dónde se utiliza este slider o su propósito..."
                                className="bg-card"
                            />
                            {errors.description && <span className="text-destructive text-xs">{errors.description}</span>}
                        </div>
                    </div>

                    <hr className="border-border" />

                    <div className="space-y-4">
                        <h3 className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">Configuración del Slider</h3>

                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="grid gap-2">
                                <Label htmlFor="effect">Efecto de Transición</Label>
                                <Select value={effect} onValueChange={(val: 'slide' | 'fade') => setEffect(val)} disabled={processing}>
                                    <SelectTrigger className="bg-card">
                                        <SelectValue placeholder="Efecto" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="slide">Slide (Deslizar)</SelectItem>
                                        <SelectItem value="fade">Fade (Desvanecer)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="autoplaySpeed">Tiempo por Diapositiva (ms)</Label>
                                <Input
                                    id="autoplaySpeed"
                                    type="number"
                                    min={500}
                                    step={100}
                                    value={autoplaySpeed}
                                    onChange={(e) => setAutoplaySpeed(Number(e.target.value))}
                                    disabled={processing || !autoplay}
                                    className="bg-card"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="transitionSpeed">Velocidad de Transición (ms)</Label>
                                <Input
                                    id="transitionSpeed"
                                    type="number"
                                    min={50}
                                    step={50}
                                    value={transitionSpeed}
                                    onChange={(e) => setTransitionSpeed(Number(e.target.value))}
                                    disabled={processing}
                                    className="bg-card"
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 pt-2 md:grid-cols-2">
                            <div className="border-border bg-muted/50 flex items-center space-x-3 rounded-lg border p-3">
                                <Checkbox
                                    id="autoplay"
                                    checked={autoplay}
                                    onCheckedChange={(checked) => setAutoplay(Boolean(checked))}
                                    disabled={processing}
                                />
                                <div className="grid gap-0.5 leading-none">
                                    <Label htmlFor="autoplay" className="cursor-pointer">
                                        Autoplay (Reproducción Automática)
                                    </Label>
                                    <span className="text-muted-foreground text-[10px]">Las diapositivas avanzarán automáticamente.</span>
                                </div>
                            </div>

                            <div className="border-border bg-muted/50 flex items-center space-x-3 rounded-lg border p-3">
                                <Checkbox id="loop" checked={loop} onCheckedChange={(checked) => setLoop(Boolean(checked))} disabled={processing} />
                                <div className="grid gap-0.5 leading-none">
                                    <Label htmlFor="loop" className="cursor-pointer">
                                        Loop Infinito
                                    </Label>
                                    <span className="text-muted-foreground text-[10px]">El slider volverá a empezar al llegar al final.</span>
                                </div>
                            </div>

                            <div className="border-border bg-muted/50 flex items-center space-x-3 rounded-lg border p-3">
                                <Checkbox id="dots" checked={dots} onCheckedChange={(checked) => setDots(Boolean(checked))} disabled={processing} />
                                <div className="grid gap-0.5 leading-none">
                                    <Label htmlFor="dots" className="cursor-pointer">
                                        Mostrar Paginación (Puntos)
                                    </Label>
                                    <span className="text-muted-foreground text-[10px]">
                                        Muestra pequeños puntos indicadores en la parte inferior.
                                    </span>
                                </div>
                            </div>

                            <div className="border-border bg-muted/50 flex items-center space-x-3 rounded-lg border p-3">
                                <Checkbox
                                    id="arrows"
                                    checked={arrows}
                                    onCheckedChange={(checked) => setArrows(Boolean(checked))}
                                    disabled={processing}
                                />
                                <div className="grid gap-0.5 leading-none">
                                    <Label htmlFor="arrows" className="cursor-pointer">
                                        Mostrar Flechas de Navegación
                                    </Label>
                                    <span className="text-muted-foreground text-[10px]">Muestra flechas laterales para avanzar o retroceder.</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 pt-4">
                        <Button type="submit" disabled={processing} className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6">
                            {processing ? 'Guardando...' : 'Crear Slider'}
                        </Button>
                        <Button asChild variant="ghost" className="h-10 px-4">
                            <Link href={route('sliders.index')}>Cancelar</Link>
                        </Button>
                    </div>
                </form>
            </FormLayout>
        </ModuleLayout>
    );
}
