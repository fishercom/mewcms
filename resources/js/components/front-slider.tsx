import React from 'react';
import { CmsSlider } from '@/types/models/cms-slider';

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
        <div className="relative w-full aspect-[21/9] sm:aspect-[24/9] md:aspect-[32/10] overflow-hidden rounded-2xl border border-zinc-200/50 dark:border-zinc-850 shadow-lg group bg-zinc-950">
            {/* Slides container */}
            <div className="relative w-full h-full">
                {slides.map((slide, idx) => {
                    const isActive = idx === currentIndex;
                    const transitionStyle = {
                        transitionDuration: `${transitionSpeed}ms`,
                    };

                    let slideClass = "absolute inset-0 w-full h-full transition-all ease-in-out ";
                    if (effect === 'fade') {
                        slideClass += isActive ? "opacity-100 z-10" : "opacity-0 z-0";
                    } else {
                        // Slide effect (horizontal translating transition)
                        slideClass += isActive 
                            ? "translate-x-0 z-10" 
                            : idx < currentIndex 
                                ? "-translate-x-full z-0" 
                                : "translate-x-full z-0";
                    }

                    return (
                        <div key={slide.id || idx} className={slideClass} style={transitionStyle}>
                            <img
                                src={slide.image_url}
                                alt={slide.title || 'Slide'}
                                className="w-full h-full object-cover brightness-[0.7] dark:brightness-[0.6]"
                            />
                            
                            {/* Slide Text Caption Content */}
                            {(slide.title || slide.caption) && (
                                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-8 sm:p-12 md:p-16 z-20 text-white select-none">
                                    <div className="max-w-2xl space-y-2 sm:space-y-3 animate-in fade-in slide-in-from-bottom-6 duration-700">
                                        {slide.title && (
                                            <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
                                                {slide.title}
                                            </h2>
                                        )}
                                        {slide.caption && (
                                            <p className="text-xs sm:text-base md:text-lg text-zinc-200 font-normal line-clamp-2 max-w-xl">
                                                {slide.caption}
                                            </p>
                                        )}
                                        {slide.link_url && (
                                            <div className="pt-2">
                                                <a
                                                    href={slide.link_url}
                                                    className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold bg-red-655 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white transition-all transform hover:-translate-y-0.5 duration-200 shadow-md"
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
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/30 text-white hover:bg-black/60 backdrop-blur-xs border border-white/10 transition-all opacity-0 group-hover:opacity-100 focus:outline-none cursor-pointer"
                    >
                        &#10094;
                    </button>
                    <button
                        type="button"
                        onClick={nextSlide}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/30 text-white hover:bg-black/60 backdrop-blur-xs border border-white/10 transition-all opacity-0 group-hover:opacity-100 focus:outline-none cursor-pointer"
                    >
                        &#10095;
                    </button>
                </>
            )}

            {/* Navigation Dots */}
            {dots && slides.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
                    {slides.map((_, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => setCurrentIndex(idx)}
                            className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                                idx === currentIndex 
                                    ? "bg-white w-6" 
                                    : "bg-white/40 hover:bg-white/70"
                            }`}
                            title={`Go to slide ${idx + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
