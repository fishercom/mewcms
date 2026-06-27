import React, { useState, FormEventHandler } from 'react';
import { Link, usePage } from '@inertiajs/react';
import ModuleLayout from '@/layouts/module/layout';
import FormLayout from '@/layouts/module/Form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateSlider } from '@/services/sliders';
import { CmsSlider, CmsSlide } from '@/types/models/cms-slider';
import { ReactSortable } from 'react-sortablejs';
import QuickMediaDrawer from '@/components/quick-media-drawer';
import { GripVertical, Plus, Trash2, Image as ImageIcon, UploadCloud, Eye, EyeOff } from 'lucide-react';

interface EditorSlide extends CmsSlide {
    id: number | string;
}

export default function Edit() {
    const { slider, slides: initialSlides = [] } = usePage<{ slider: CmsSlider; slides: CmsSlide[] }>().props;

    const [name, setName] = useState(slider.name);
    const [key, setKey] = useState(slider.key);
    const [description, setDescription] = useState(slider.description || '');
    const [autoplay, setAutoplay] = useState(slider.settings?.autoplay ?? true);
    const [autoplaySpeed, setAutoplaySpeed] = useState(slider.settings?.autoplaySpeed ?? 3000);
    const [transitionSpeed, setTransitionSpeed] = useState(slider.settings?.transitionSpeed ?? 500);
    const [effect, setEffect] = useState<'slide' | 'fade'>(slider.settings?.effect ?? 'slide');
    const [loop, setLoop] = useState(slider.settings?.loop ?? true);
    const [dots, setDots] = useState(slider.settings?.dots ?? true);
    const [arrows, setArrows] = useState(slider.settings?.arrows ?? true);

    // Slide manager state
    const [slides, setSlides] = useState<EditorSlide[]>(
        initialSlides.map((s, idx) => ({ ...s, id: s.id || `existing_${idx}` }))
    );

    // Media Drawer state
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [activeSlideIndex, setActiveSlideIndex] = useState<number | null>(null);
    const [manualUrls, setManualUrls] = useState<Record<number, boolean>>({});

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const handleAddSlide = () => {
        const newSlide: EditorSlide = {
            id: `temp_${Math.random().toString(36).substring(2, 9)}`,
            title: '',
            caption: '',
            image_url: '',
            link_url: '',
            position: slides.length,
            active: true,
        };
        setSlides([...slides, newSlide]);
    };

    const handleRemoveSlide = (index: number) => {
        if (window.confirm('¿Deseas quitar esta diapositiva? Guarde los cambios para confirmar.')) {
            setSlides(slides.filter((_, i) => i !== index));
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleUpdateSlideField = (index: number, field: keyof CmsSlide, val: any) => {
        const updated = slides.map((s, i) => (i === index ? { ...s, [field]: val } : s));
        setSlides(updated);
    };

    const handleOpenMediaDrawer = (index: number) => {
        setActiveSlideIndex(index);
        setIsDrawerOpen(true);
    };

    const handleSelectMedia = (url: string) => {
        if (activeSlideIndex !== null) {
            handleUpdateSlideField(activeSlideIndex, 'image_url', url);
        }
        setIsDrawerOpen(false);
        setActiveSlideIndex(null);
    };

    const toggleManualUrl = (index: number) => {
        setManualUrls((prev) => ({ ...prev, [index]: !prev[index] }));
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        // Prepare slides for submission: map temp IDs to null so backend handles creation vs update
        const preparedSlides = slides.map((s, index) => ({
            id: typeof s.id === 'string' && s.id.startsWith('temp_') ? null : s.id,
            title: s.title,
            caption: s.caption,
            image_url: s.image_url,
            link_url: s.link_url,
            active: s.active,
            position: index,
        }));

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
            slides: preparedSlides,
        };

        updateSlider(slider.id, sliderData, {
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
        <ModuleLayout view={`Editar: ${slider.name}`}>
            <FormLayout>
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* General Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                            <h3 className="text-sm font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                                Información General
                            </h3>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nombre del Slider</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={processing}
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
                                    className="font-mono text-sm bg-white dark:bg-[#161615]"
                                />
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
                                className="bg-white dark:bg-[#161615]"
                            />
                        </div>
                    </div>

                    {/* Settings Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                            <h3 className="text-sm font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                                Configuración de Reproducción y Efectos
                            </h3>
                        </div>

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
                                <Label htmlFor="autoplay" className="cursor-pointer font-semibold leading-none">Autoplay (Reproducción Automática)</Label>
                            </div>

                            <div className="flex items-center space-x-3 bg-zinc-50/50 dark:bg-zinc-900/10 p-3 rounded-lg border border-zinc-200/50 dark:border-zinc-800/50">
                                <Checkbox
                                    id="loop"
                                    checked={loop}
                                    onCheckedChange={(checked) => setLoop(Boolean(checked))}
                                    disabled={processing}
                                />
                                <Label htmlFor="loop" className="cursor-pointer font-semibold leading-none">Loop Infinito</Label>
                            </div>

                            <div className="flex items-center space-x-3 bg-zinc-50/50 dark:bg-zinc-900/10 p-3 rounded-lg border border-zinc-200/50 dark:border-zinc-800/50">
                                <Checkbox
                                    id="dots"
                                    checked={dots}
                                    onCheckedChange={(checked) => setDots(Boolean(checked))}
                                    disabled={processing}
                                />
                                <Label htmlFor="dots" className="cursor-pointer font-semibold leading-none">Mostrar Paginación (Puntos)</Label>
                            </div>

                            <div className="flex items-center space-x-3 bg-zinc-50/50 dark:bg-zinc-900/10 p-3 rounded-lg border border-zinc-200/50 dark:border-zinc-800/50">
                                <Checkbox
                                    id="arrows"
                                    checked={arrows}
                                    onCheckedChange={(checked) => setArrows(Boolean(checked))}
                                    disabled={processing}
                                />
                                <Label htmlFor="arrows" className="cursor-pointer font-semibold leading-none">Mostrar Flechas de Navegación</Label>
                            </div>
                        </div>
                    </div>

                    {/* Slides List Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                            <div>
                                <h3 className="text-sm font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                                    Diapositivas (Slides)
                                </h3>
                                <p className="text-xs text-zinc-400 mt-0.5">Arriba y abajo para reordenar el carrusel</p>
                            </div>
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleAddSlide}
                                className="bg-zinc-800 hover:bg-zinc-900 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 flex items-center gap-1 h-8 px-3"
                            >
                                <Plus className="h-4 w-4" />
                                <span>Añadir Diapositiva</span>
                            </Button>
                        </div>

                        {slides.length > 0 ? (
                            <ReactSortable
                                list={slides}
                                setList={(val) => setSlides(val as EditorSlide[])}
                                handle=".drag-handle"
                                className="space-y-4"
                            >
                                {slides.map((slide, index) => {
                                    const showManual = manualUrls[index] || false;
                                    return (
                                        <div
                                            key={slide.id}
                                            className="bg-zinc-50/30 dark:bg-zinc-900/10 border border-zinc-250 dark:border-zinc-800 rounded-xl p-4 flex gap-4 items-start relative hover:border-zinc-350 dark:hover:border-zinc-700 transition-colors shadow-xs"
                                        >
                                            {/* Drag handle */}
                                            <div className="drag-handle cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 p-1.5 self-center shrink-0">
                                                <GripVertical className="h-5 w-5" />
                                            </div>

                                            {/* Slide Image Editor */}
                                            <div className="w-36 shrink-0 space-y-2">
                                                {slide.image_url ? (
                                                    <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950">
                                                        <img
                                                            src={slide.image_url}
                                                            alt={slide.title || 'Slide Image'}
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={() => handleOpenMediaDrawer(index)}
                                                            className="absolute bottom-1 right-1 h-7 px-2 text-[10px] bg-black/60 text-white hover:bg-black/80 backdrop-blur-xs border-0"
                                                        >
                                                            Cambiar
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div
                                                        onClick={() => handleOpenMediaDrawer(index)}
                                                        className="aspect-[4/3] border border-dashed border-zinc-350 dark:border-zinc-850 rounded-lg flex flex-col items-center justify-center bg-white dark:bg-zinc-900/50 cursor-pointer hover:border-red-500/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-900 transition-all text-center group"
                                                    >
                                                        <UploadCloud className="h-5 w-5 text-zinc-400 group-hover:text-red-500 transition-colors mb-1" />
                                                        <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-450 group-hover:text-red-500">
                                                            Elegir Imagen
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleManualUrl(index)}
                                                        className="text-[9px] text-zinc-450 hover:underline"
                                                    >
                                                        {showManual ? 'Ocultar URL manual' : 'Editar URL manual'}
                                                    </button>
                                                </div>

                                                {showManual && (
                                                    <Input
                                                        type="text"
                                                        placeholder="URL de la imagen"
                                                        value={slide.image_url}
                                                        onChange={(e) => handleUpdateSlideField(index, 'image_url', e.target.value)}
                                                        className="text-[10px] h-7 bg-white dark:bg-[#161615]"
                                                    />
                                                )}
                                            </div>

                                            {/* Slide Fields */}
                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 min-w-0">
                                                <div className="grid gap-1">
                                                    <Label className="text-[11px] font-medium text-zinc-450">Título</Label>
                                                    <Input
                                                        type="text"
                                                        value={slide.title || ''}
                                                        onChange={(e) => handleUpdateSlideField(index, 'title', e.target.value)}
                                                        placeholder="Título de la diapositiva"
                                                        className="h-8 text-xs bg-white dark:bg-[#161615]"
                                                    />
                                                </div>

                                                <div className="grid gap-1">
                                                    <Label className="text-[11px] font-medium text-zinc-450">Enlace / URL de destino</Label>
                                                    <Input
                                                        type="text"
                                                        value={slide.link_url || ''}
                                                        onChange={(e) => handleUpdateSlideField(index, 'link_url', e.target.value)}
                                                        placeholder="https://ejemplo.com/pagina"
                                                        className="h-8 text-xs bg-white dark:bg-[#161615]"
                                                    />
                                                </div>

                                                <div className="grid gap-1 md:col-span-2">
                                                    <Label className="text-[11px] font-medium text-zinc-450">Subtítulo / Leyenda (Caption)</Label>
                                                    <Input
                                                        type="text"
                                                        value={slide.caption || ''}
                                                        onChange={(e) => handleUpdateSlideField(index, 'caption', e.target.value)}
                                                        placeholder="Texto secundario o descripción..."
                                                        className="h-8 text-xs bg-white dark:bg-[#161615]"
                                                    />
                                                </div>
                                            </div>

                                            {/* Slide Actions (Status & Trash) */}
                                            <div className="flex flex-col items-end justify-between self-stretch shrink-0 pb-1 pt-1 pl-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleUpdateSlideField(index, 'active', !slide.active)}
                                                    className={`p-1.5 rounded-md border transition-colors ${
                                                        slide.active
                                                            ? 'border-green-200 bg-green-50/50 text-green-750 hover:bg-green-55 dark:border-green-950/20 dark:bg-green-950/10 dark:text-green-400'
                                                            : 'border-zinc-200 bg-zinc-100 text-zinc-450 hover:bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-650'
                                                    }`}
                                                    title={slide.active ? 'Diapositiva Activa' : 'Diapositiva Inactiva'}
                                                >
                                                    {slide.active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                                                </button>

                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleRemoveSlide(index)}
                                                    className="h-7 w-7 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                                                    title="Eliminar Diapositiva"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </ReactSortable>
                        ) : (
                            <div className="text-center py-10 border border-dashed border-zinc-200 dark:border-zinc-850 rounded-xl bg-zinc-550/5">
                                <ImageIcon className="mx-auto h-8 w-8 text-zinc-350 dark:text-zinc-500 mb-2" />
                                <p className="text-xs text-zinc-400 italic">No hay diapositivas en este slider.</p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAddSlide}
                                    className="mt-3 text-xs"
                                >
                                    Agregar la Primera Diapositiva
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                        <Button
                            type="submit"
                            disabled={processing}
                            className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-500 dark:hover:bg-red-600 px-6 h-10"
                        >
                            {processing ? 'Guardando...' : 'Guardar Slider'}
                        </Button>
                        <Button asChild variant="ghost" className="h-10 px-4">
                            <Link href={route('sliders.index')}>Cancelar</Link>
                        </Button>
                    </div>
                </form>
            </FormLayout>

            {/* Media Drawer selection */}
            <QuickMediaDrawer
                isOpen={isDrawerOpen}
                onClose={() => {
                    setIsDrawerOpen(false);
                    setActiveSlideIndex(null);
                }}
                onSelect={handleSelectMedia}
                initialType="Images"
            />
        </ModuleLayout>
    );
}
