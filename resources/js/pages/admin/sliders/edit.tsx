import QuickMediaDrawer from '@/components/quick-media-drawer';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FormLayout from '@/layouts/module/Form';
import ModuleLayout from '@/layouts/module/layout';
import { updateSlider } from '@/services/sliders';
import { CmsSlide, CmsSlider } from '@/types/models/cms-slider';
import { Link, usePage } from '@inertiajs/react';
import { Eye, EyeOff, GripVertical, Image as ImageIcon, Plus, Trash2, UploadCloud } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import { ReactSortable } from 'react-sortablejs';

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
    const [slides, setSlides] = useState<EditorSlide[]>(initialSlides.map((s, idx) => ({ ...s, id: s.id || `existing_${idx}` })));

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
                        <div className="border-border flex items-center justify-between border-b pb-2">
                            <h3 className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">Información General</h3>
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
                                    className="bg-card font-mono text-sm"
                                />
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
                                className="bg-card"
                            />
                        </div>
                    </div>

                    {/* Settings Section */}
                    <div className="space-y-4">
                        <div className="border-border flex items-center justify-between border-b pb-2">
                            <h3 className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
                                Configuración de Reproducción y Efectos
                            </h3>
                        </div>

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
                                <Label htmlFor="autoplay" className="cursor-pointer leading-none font-semibold">
                                    Autoplay (Reproducción Automática)
                                </Label>
                            </div>

                            <div className="border-border bg-muted/50 flex items-center space-x-3 rounded-lg border p-3">
                                <Checkbox id="loop" checked={loop} onCheckedChange={(checked) => setLoop(Boolean(checked))} disabled={processing} />
                                <Label htmlFor="loop" className="cursor-pointer leading-none font-semibold">
                                    Loop Infinito
                                </Label>
                            </div>

                            <div className="border-border bg-muted/50 flex items-center space-x-3 rounded-lg border p-3">
                                <Checkbox id="dots" checked={dots} onCheckedChange={(checked) => setDots(Boolean(checked))} disabled={processing} />
                                <Label htmlFor="dots" className="cursor-pointer leading-none font-semibold">
                                    Mostrar Paginación (Puntos)
                                </Label>
                            </div>

                            <div className="border-border bg-muted/50 flex items-center space-x-3 rounded-lg border p-3">
                                <Checkbox
                                    id="arrows"
                                    checked={arrows}
                                    onCheckedChange={(checked) => setArrows(Boolean(checked))}
                                    disabled={processing}
                                />
                                <Label htmlFor="arrows" className="cursor-pointer leading-none font-semibold">
                                    Mostrar Flechas de Navegación
                                </Label>
                            </div>
                        </div>
                    </div>

                    {/* Slides List Section */}
                    <div className="space-y-4">
                        <div className="border-border flex items-center justify-between border-b pb-2">
                            <div>
                                <h3 className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">Diapositivas (Slides)</h3>
                                <p className="text-muted-foreground mt-0.5 text-xs">Arriba y abajo para reordenar el carrusel</p>
                            </div>
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleAddSlide}
                                className="bg-muted hover:bg-muted flex h-8 items-center gap-1 px-3 text-white"
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
                                            className="border-border hover:border-border-strong bg-muted/50 relative flex items-start gap-4 rounded-xl border p-4 shadow-xs transition-colors"
                                        >
                                            {/* Drag handle */}
                                            <div className="drag-handle text-muted-foreground hover:text-muted-foreground shrink-0 cursor-grab self-center p-1.5 active:cursor-grabbing">
                                                <GripVertical className="h-5 w-5" />
                                            </div>

                                            {/* Slide Image Editor */}
                                            <div className="w-36 shrink-0 space-y-2">
                                                {slide.image_url ? (
                                                    <div className="border-border bg-muted relative aspect-[4/3] overflow-hidden rounded-lg border">
                                                        <img
                                                            src={slide.image_url}
                                                            alt={slide.title || 'Slide Image'}
                                                            className="h-full w-full object-cover"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={() => handleOpenMediaDrawer(index)}
                                                            className="absolute right-1 bottom-1 h-7 border-0 bg-black/60 px-2 text-[10px] text-white backdrop-blur-xs hover:bg-black/80"
                                                        >
                                                            Cambiar
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div
                                                        onClick={() => handleOpenMediaDrawer(index)}
                                                        className="border-border-strong group bg-card hover:border-primary/50 hover:bg-muted/50 flex aspect-[4/3] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed text-center transition-all"
                                                    >
                                                        <UploadCloud className="text-muted-foreground group-hover:text-primary mb-1 h-5 w-5 transition-colors" />
                                                        <span className="text-muted-foreground group-hover:text-primary text-[10px] font-semibold">
                                                            Elegir Imagen
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleManualUrl(index)}
                                                        className="text-muted-foreground text-[9px] hover:underline"
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
                                                        className="bg-card h-7 text-[10px]"
                                                    />
                                                )}
                                            </div>

                                            {/* Slide Fields */}
                                            <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 md:grid-cols-2">
                                                <div className="grid gap-1">
                                                    <Label className="text-muted-foreground text-[11px] font-medium">Título</Label>
                                                    <Input
                                                        type="text"
                                                        value={slide.title || ''}
                                                        onChange={(e) => handleUpdateSlideField(index, 'title', e.target.value)}
                                                        placeholder="Título de la diapositiva"
                                                        className="bg-card h-8 text-xs"
                                                    />
                                                </div>

                                                <div className="grid gap-1">
                                                    <Label className="text-muted-foreground text-[11px] font-medium">Enlace / URL de destino</Label>
                                                    <Input
                                                        type="text"
                                                        value={slide.link_url || ''}
                                                        onChange={(e) => handleUpdateSlideField(index, 'link_url', e.target.value)}
                                                        placeholder="https://ejemplo.com/pagina"
                                                        className="bg-card h-8 text-xs"
                                                    />
                                                </div>

                                                <div className="grid gap-1 md:col-span-2">
                                                    <Label className="text-muted-foreground text-[11px] font-medium">
                                                        Subtítulo / Leyenda (Caption)
                                                    </Label>
                                                    <Input
                                                        type="text"
                                                        value={slide.caption || ''}
                                                        onChange={(e) => handleUpdateSlideField(index, 'caption', e.target.value)}
                                                        placeholder="Texto secundario o descripción..."
                                                        className="bg-card h-8 text-xs"
                                                    />
                                                </div>
                                            </div>

                                            {/* Slide Actions (Status & Trash) */}
                                            <div className="flex shrink-0 flex-col items-end justify-between self-stretch pt-1 pb-1 pl-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleUpdateSlideField(index, 'active', !slide.active)}
                                                    className={`rounded-md border p-1.5 transition-colors ${
                                                        slide.active
                                                            ? 'text-success hover:bg-success/10 border-success/30 bg-success/50'
                                                            : 'text-muted-foreground border-border bg-muted hover:bg-muted'
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
                                                    className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-7 w-7"
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
                            <div className="bg-muted/5 border-border rounded-xl border border-dashed py-10 text-center">
                                <ImageIcon className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
                                <p className="text-muted-foreground text-xs italic">No hay diapositivas en este slider.</p>
                                <Button type="button" variant="outline" size="sm" onClick={handleAddSlide} className="mt-3 text-xs">
                                    Agregar la Primera Diapositiva
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="border-border flex items-center gap-4 border-t pt-4">
                        <Button type="submit" disabled={processing} className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6">
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
