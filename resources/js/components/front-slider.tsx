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
        <div className="group relative min-h-[380px] sm:min-h-[440px] md:min-h-[500px] w-full overflow-hidden rounded-3xl border border-border/60 bg-zinc-950 shadow-2xl">
            {/* Slides container */}
            <div className="relative h-full w-full min-h-[380px] sm:min-h-[440px] md:min-h-[500px]">
                {slides.map((slide, idx) => {
                    const isActive = idx === currentIndex;
                    const transitionStyle = {
                        transitionDuration: `${transitionSpeed}ms`,
                    };

                    let slideClass = 'absolute inset-0 w-full h-full transition-all ease-in-out ';
                    if (effect === 'fade') {
                        slideClass += isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none';
                    } else {
                        slideClass += isActive ? 'translate-x-0 z-10' : idx < currentIndex ? '-translate-x-full z-0 pointer-events-none' : 'translate-x-full z-0 pointer-events-none';
                    }

                    return (
                        <div key={slide.id || idx} className={slideClass} style={transitionStyle}>
                            <img
                                src={slide.image_url}
                                alt={slide.title || 'Slide'}
                                className="h-full w-full object-cover brightness-[0.6] dark:brightness-[0.5] scale-105 transition-transform duration-700 ease-out"
                            />

                            {/* Slide Text Caption Content */}
                            {(slide.title || slide.caption) && (
                                <div className="absolute inset-0 z-20 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/40 to-transparent p-8 text-white select-none sm:p-14 md:p-18">
                                    <div className="max-w-2xl space-y-3 animate-in fade-in slide-in-from-bottom-6 duration-700">
                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wider text-white uppercase backdrop-blur-md">
                                            MewCMS Destacado
                                        </span>
                                        {slide.title && (
                                            <h2 className="text-2xl font-black tracking-tight sm:text-4xl md:text-5xl leading-tight">
                                                {slide.title}
                                            </h2>
                                        )}
                                        {slide.caption && (
                                            <p className="line-clamp-3 max-w-xl text-xs sm:text-sm md:text-base font-normal text-zinc-300 leading-relaxed">
                                                {slide.caption}
                                            </p>
                                        )}
                                        {slide.link_url && (
                                            <div className="pt-3">
                                                <a
                                                    href={slide.link_url}
                                                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition-all hover:scale-[1.02] hover:from-violet-700 hover:to-indigo-700 active:scale-95"
                                                >
                                                    <span>Explorar Sección</span>
                                                    <span>&rarr;</span>
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
