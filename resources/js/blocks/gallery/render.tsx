import { MediaImage } from '@/components/media-image';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { type BlockRenderProps, str } from '../types';

interface GalleryImage {
    src: string;
    alt?: string;
    caption?: string;
}

const COLUMNS: Record<string, string> = {
    '2': 'grid-cols-2',
    '3': 'grid-cols-2 sm:grid-cols-3',
    '4': 'grid-cols-2 sm:grid-cols-4',
    '5': 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5',
    '6': 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6',
};
const GAPS: Record<string, string> = { none: 'gap-0', sm: 'gap-1.5', md: 'gap-3', lg: 'gap-5' };
const CROPS: Record<string, string> = { square: 'aspect-square object-cover', landscape: 'aspect-[4/3] object-cover', none: 'h-auto' };

export default function GalleryRender({ data, editing }: BlockRenderProps) {
    const images = (Array.isArray(data.images) ? data.images : []) as unknown as GalleryImage[];
    const [open, setOpen] = useState<number | null>(null);
    const columns = str(data.columns) || '3';

    const step = useCallback((delta: number) => setOpen((i) => (i === null ? i : (i + delta + images.length) % images.length)), [images.length]);

    // Keyboard navigation while the lightbox is open (client only: it starts closed on the server)
    useEffect(() => {
        if (open === null) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(null);
            if (e.key === 'ArrowRight') step(1);
            if (e.key === 'ArrowLeft') step(-1);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, step]);

    if (images.length === 0) return null;
    const current = open !== null ? images[open] : null;

    return (
        <>
            <ul className={cn('grid', COLUMNS[columns] ?? COLUMNS['3'], GAPS[str(data.gap)] ?? GAPS.md)}>
                {images.map((image, index) => (
                    <li key={index}>
                        <figure>
                            <button
                                type="button"
                                onClick={() => !editing && setOpen(index)}
                                className="block w-full overflow-hidden rounded-lg focus-visible:ring-2 focus-visible:ring-[#f53003]/50 focus-visible:outline-none"
                                aria-label={`Ampliar imagen ${index + 1} de ${images.length}`}
                            >
                                <MediaImage
                                    src={image.src}
                                    alt={image.alt || undefined}
                                    fallbackAlt={image.caption ?? ''}
                                    sizes={`(max-width: 640px) 50vw, ${Math.round(100 / Number(columns))}vw`}
                                    className={cn(
                                        'w-full transition-transform duration-300 hover:scale-[1.03]',
                                        CROPS[str(data.crop)] ?? CROPS.square,
                                    )}
                                />
                            </button>
                            {image.caption && <figcaption className="mt-1.5 text-xs text-[#706f6c] dark:text-[#A1A09A]">{image.caption}</figcaption>}
                        </figure>
                    </li>
                ))}
            </ul>

            {current && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={current.caption || 'Imagen ampliada'}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
                    onClick={() => setOpen(null)}
                >
                    <button
                        type="button"
                        className="absolute top-4 right-4 rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white"
                        aria-label="Cerrar"
                    >
                        <X className="h-6 w-6" />
                    </button>
                    {images.length > 1 && (
                        <>
                            <button
                                type="button"
                                className="absolute left-2 rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white sm:left-4"
                                aria-label="Imagen anterior"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    step(-1);
                                }}
                            >
                                <ChevronLeft className="h-8 w-8" />
                            </button>
                            <button
                                type="button"
                                className="absolute right-2 rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white sm:right-4"
                                aria-label="Imagen siguiente"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    step(1);
                                }}
                            >
                                <ChevronRight className="h-8 w-8" />
                            </button>
                        </>
                    )}
                    <figure className="max-h-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
                        <MediaImage
                            src={current.src}
                            alt={current.alt || undefined}
                            fallbackAlt={current.caption ?? ''}
                            sizes="100vw"
                            loading="eager"
                            className="max-h-[85vh] w-auto rounded-lg object-contain"
                        />
                        {current.caption && <figcaption className="mt-3 text-center text-sm text-white/80">{current.caption}</figcaption>}
                    </figure>
                </div>
            )}
        </>
    );
}
