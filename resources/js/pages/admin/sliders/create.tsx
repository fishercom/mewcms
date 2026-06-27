import React, { useState, useEffect, FormEventHandler } from 'react';
import { Link } from '@inertiajs/react';
import ModuleLayout from '@/layouts/module/layout';
import FormLayout from '@/layouts/module/Form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createSlider } from '@/services/sliders';

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
                        <h3 className="text-sm font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                            Información General
                        </h3>
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
                                    className="bg-white dark:bg-[#161615]"
                                />
                                {errors.name && <span className="text-xs text-red-500">{errors.name}</span>}
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
                                    className="font-mono text-sm bg-white dark:bg-[#161615]"
                                />
                                <span className="text-[10px] text-zinc-400">
                                    Usada para cargar este slider en el código/plantillas. Caracteres alfanuméricos y guiones.
                                </span>
                                {errors.key && <span className="text-xs text-red-500">{errors.key}</span>}
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
                                className="bg-white dark:bg-[#161615]"
                            />
                            {errors.description && <span className="text-xs text-red-500">{errors.description}</span>}
                        </div>
                    </div>

                    <hr className="border-zinc-200 dark:border-zinc-800" />

                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                            Configuración del Slider
                        </h3>

                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="grid gap-2">
                                <Label htmlFor="effect">Efecto de Transición</Label>
                                <Select
                                    value={effect}
                                    onValueChange={(val: 'slide' | 'fade') => setEffect(val)}
                                    disabled={processing}
                                >
                                    <SelectTrigger className="bg-white dark:bg-[#161615]">
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
                                    className="bg-white dark:bg-[#161615]"
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
                                    className="bg-white dark:bg-[#161615]"
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 pt-2">
                            <div className="flex items-center space-x-3 bg-zinc-50/50 dark:bg-zinc-900/10 p-3 rounded-lg border border-zinc-200/50 dark:border-zinc-800/50">
                                <Checkbox
                                    id="autoplay"
                                    checked={autoplay}
                                    onCheckedChange={(checked) => setAutoplay(Boolean(checked))}
                                    disabled={processing}
                                />
                                <div className="grid gap-0.5 leading-none">
                                    <Label htmlFor="autoplay" className="cursor-pointer">Autoplay (Reproducción Automática)</Label>
                                    <span className="text-[10px] text-zinc-400">
                                        Las diapositivas avanzarán automáticamente.
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 bg-zinc-50/50 dark:bg-zinc-900/10 p-3 rounded-lg border border-zinc-200/50 dark:border-zinc-800/50">
                                <Checkbox
                                    id="loop"
                                    checked={loop}
                                    onCheckedChange={(checked) => setLoop(Boolean(checked))}
                                    disabled={processing}
                                />
                                <div className="grid gap-0.5 leading-none">
                                    <Label htmlFor="loop" className="cursor-pointer">Loop Infinito</Label>
                                    <span className="text-[10px] text-zinc-400">
                                        El slider volverá a empezar al llegar al final.
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 bg-zinc-50/50 dark:bg-zinc-900/10 p-3 rounded-lg border border-zinc-200/50 dark:border-zinc-800/50">
                                <Checkbox
                                    id="dots"
                                    checked={dots}
                                    onCheckedChange={(checked) => setDots(Boolean(checked))}
                                    disabled={processing}
                                />
                                <div className="grid gap-0.5 leading-none">
                                    <Label htmlFor="dots" className="cursor-pointer">Mostrar Paginación (Puntos)</Label>
                                    <span className="text-[10px] text-zinc-400">
                                        Muestra pequeños puntos indicadores en la parte inferior.
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 bg-zinc-50/50 dark:bg-zinc-900/10 p-3 rounded-lg border border-zinc-200/50 dark:border-zinc-800/50">
                                <Checkbox
                                    id="arrows"
                                    checked={arrows}
                                    onCheckedChange={(checked) => setArrows(Boolean(checked))}
                                    disabled={processing}
                                />
                                <div className="grid gap-0.5 leading-none">
                                    <Label htmlFor="arrows" className="cursor-pointer">Mostrar Flechas de Navegación</Label>
                                    <span className="text-[10px] text-zinc-400">
                                        Muestra flechas laterales para avanzar o retroceder.
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 pt-4">
                        <Button
                            type="submit"
                            disabled={processing}
                            className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-500 dark:hover:bg-red-600 px-6 h-10"
                        >
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
