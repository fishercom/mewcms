import { MediaImage } from '@/components/media-image';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';
import { type BlockRenderProps, str } from '../types';

const HEIGHTS: Record<string, string> = {
    sm: 'min-h-[16rem] py-12',
    md: 'min-h-[22rem] py-16',
    lg: 'min-h-[30rem] py-24',
};

export default function HeroRender({ data, editing }: BlockRenderProps) {
    const image = str(data.image);
    const center = data.align === 'center';
    const overlay = typeof data.overlay === 'number' ? data.overlay : 45;
    const buttons = [
        { label: str(data.button_label), url: str(data.button_url), primary: true },
        { label: str(data.secondary_label), url: str(data.secondary_url), primary: false },
    ].filter((b) => b.label && b.url);

    return (
        <section
            className={cn(
                'relative isolate flex w-full items-center overflow-hidden rounded-2xl px-6 sm:px-12',
                HEIGHTS[str(data.height)] ?? HEIGHTS.md,
                image ? 'text-white' : 'bg-[#f53003]/5 text-[#1b1b18] dark:bg-[#FF4433]/10 dark:text-[#EDEDEC]',
            )}
        >
            {image && (
                <>
                    <MediaImage src={image} alt="" loading="eager" sizes="100vw" className="absolute inset-0 -z-20 h-full w-full object-cover" />
                    <div className="absolute inset-0 -z-10 bg-black" style={{ opacity: overlay / 100 }} aria-hidden="true" />
                </>
            )}
            <div className={cn('max-w-2xl space-y-4', center && 'mx-auto text-center')}>
                {str(data.eyebrow) && (
                    <p
                        className={cn(
                            'text-xs font-semibold tracking-widest uppercase',
                            image ? 'text-white/80' : 'text-[#f53003] dark:text-[#FF4433]',
                        )}
                    >
                        {str(data.eyebrow)}
                    </p>
                )}
                {str(data.title) && <h2 className="text-3xl leading-tight font-bold tracking-tight text-balance sm:text-5xl">{str(data.title)}</h2>}
                {str(data.subtitle) && (
                    <p className={cn('text-base leading-relaxed sm:text-lg', image ? 'text-white/85' : 'text-[#706f6c] dark:text-[#A1A09A]')}>
                        {str(data.subtitle)}
                    </p>
                )}
                {buttons.length > 0 && (
                    <div className={cn('flex flex-wrap gap-3 pt-2', center && 'justify-center')}>
                        {buttons.map((button) => (
                            <a
                                key={button.label}
                                href={editing ? undefined : button.url}
                                className={cn(
                                    'inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors',
                                    button.primary
                                        ? 'bg-[#f53003] text-white hover:bg-[#d92a02] dark:bg-[#FF4433]'
                                        : image
                                          ? 'border border-white/40 text-white hover:bg-white/10'
                                          : 'border border-[#19140035] hover:border-[#1915014a] dark:border-[#3E3E3A]',
                                )}
                            >
                                {button.label}
                                {button.primary && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
