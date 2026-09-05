import { CmsSlider } from '@/types/models/cms-slider';
import React from 'react';

interface FrontSliderProps {
    slider: CmsSlider;
}

export default function FrontSlider({ slider }: FrontSliderProps) {
    const slides = slider.slides || [];
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const settings = slider.settings || {};
    const autoplay = settings.autoplay ?? true;
    const autoplaySpeed = settings.autoplaySpeed ?? 3000;
    const transitionSpeed = settings.transitionSpeed ?? 500;
    const effect = settings.effect ?? 'slide';
    const loop = settings.loop ?? true;
    const dots = settings.dots ?? true;
    const arrows = settings.arrows ?? true;

    const nextSlide = React.useCallback(() => {
        setCurrentIndex((prev) => {
            if (prev === slides.length - 1) {
                return loop ? 0 : prev;
            }
            return prev + 1;
        });
    }, [slides.length, loop]);

    const prevSlide = () => {
        setCurrentIndex((prev) => {
            if (prev === 0) {
                return loop ? slides.length - 1 : prev;
            }
            return prev - 1;
        });
    };

    React.useEffect(() => {
        if (!autoplay || slides.length <= 1) return;
        const timer = setInterval(() => {
            nextSlide();
        }, autoplaySpeed);
        return () => clearInterval(timer);
    }, [autoplay, autoplaySpeed, nextSlide, slides.length]);

    if (slides.length === 0) return null;

    return (
        <div className="dark:border-zinc-850 group relative aspect-[21/9] w-full overflow-hidden rounded-2xl border border-zinc-200/50 bg-zinc-950 shadow-lg sm:aspect-[24/9] md:aspect-[32/10]">
            {/* Slides container */}
            <div className="relative h-full w-full">
                {slides.map((slide, idx) => {
                    const isActive = idx === currentIndex;
                    const transitionStyle = {
                        transitionDuration: `${transitionSpeed}ms`,
                    };

                    let slideClass = 'absolute inset-0 w-full h-full transition-all ease-in-out ';
                    if (effect === 'fade') {
                        slideClass += isActive ? 'opacity-100 z-10' : 'opacity-0 z-0';
                    } else {
                        // Slide effect (horizontal translating transition)
                        slideClass += isActive ? 'translate-x-0 z-10' : idx < currentIndex ? '-translate-x-full z-0' : 'translate-x-full z-0';
                    }

                    return (
                        <div key={slide.id || idx} className={slideClass} style={transitionStyle}>
                            <img
                                src={slide.image_url}
                                alt={slide.title || 'Slide'}
                                className="h-full w-full object-cover brightness-[0.7] dark:brightness-[0.6]"
                            />

                            {/* Slide Text Caption Content */}
                            {(slide.title || slide.caption) && (
                                <div className="absolute inset-0 z-20 flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/30 to-transparent p-8 text-white select-none sm:p-12 md:p-16">
                                    <div className="animate-in fade-in slide-in-from-bottom-6 max-w-2xl space-y-2 duration-700 sm:space-y-3">
                                        {slide.title && (
                                            <h2 className="text-2xl leading-tight font-extrabold tracking-tight sm:text-4xl md:text-5xl">
                                                {slide.title}
                                            </h2>
                                        )}
                                        {slide.caption && (
                                            <p className="line-clamp-2 max-w-xl text-xs font-normal text-zinc-200 sm:text-base md:text-lg">
                                                {slide.caption}
                                            </p>
                                        )}
                                        {slide.link_url && (
                                            <div className="pt-2">
                                                <a
                                                    href={slide.link_url}
                                                    className="bg-red-655 inline-flex transform items-center justify-center rounded-lg px-5 py-2.5 text-xs font-semibold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-700 sm:text-sm dark:bg-red-500 dark:hover:bg-red-600"
                                                >
                                                    Más información
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Navigation Arrows */}
            {arrows && slides.length > 1 && (
                <>
                    <button
                        type="button"
                        onClick={prevSlide}
                        className="absolute top-1/2 left-4 z-30 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-black/30 text-white opacity-0 backdrop-blur-xs transition-all group-hover:opacity-100 hover:bg-black/60 focus:outline-none sm:h-12 sm:w-12"
                    >
                        &#10094;
                    </button>
                    <button
                        type="button"
                        onClick={nextSlide}
                        className="absolute top-1/2 right-4 z-30 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-black/30 text-white opacity-0 backdrop-blur-xs transition-all group-hover:opacity-100 hover:bg-black/60 focus:outline-none sm:h-12 sm:w-12"
                    >
                        &#10095;
                    </button>
                </>
            )}

            {/* Navigation Dots */}
            {dots && slides.length > 1 && (
                <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2">
                    {slides.map((_, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => setCurrentIndex(idx)}
                            className={`h-2 w-2 cursor-pointer rounded-full transition-all duration-300 ${
                                idx === currentIndex ? 'w-6 bg-white' : 'bg-white/40 hover:bg-white/70'
                            }`}
                            title={`Go to slide ${idx + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
