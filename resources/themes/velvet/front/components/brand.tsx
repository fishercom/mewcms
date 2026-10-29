import { cn } from '@/lib/utils';
import { PawPrint } from 'lucide-react';

/** Wordmark of the boutique: a paw in a ring and the site name in the display serif */
export function VelvetBrand({ name, tagline, light = false }: { name: string; tagline?: string; light?: boolean }) {
    return (
        <span className="inline-flex items-center gap-3">
            <span
                className={cn(
                    'inline-flex h-10 w-10 items-center justify-center rounded-full border',
                    light ? 'border-brass-light/60 text-brass-light' : 'border-brass/50 text-forest',
                )}
            >
                <PawPrint className="h-[18px] w-[18px]" strokeWidth={1.6} aria-hidden="true" />
            </span>
            <span className="flex flex-col leading-none">
                <span className={cn('font-display text-[1.6rem] font-semibold tracking-tight', light ? 'text-ivory' : 'text-ink')}>{name}</span>
                {tagline && (
                    <span className={cn('mt-1 text-[0.62rem] font-medium tracking-[0.32em] uppercase', light ? 'text-ivory/60' : 'text-stone')}>
                        {tagline}
                    </span>
                )}
            </span>
        </span>
    );
}

/** Small uppercase label above a title */
export function Eyebrow({ children, light = false, className }: { children: React.ReactNode; light?: boolean; className?: string }) {
    return (
        <p
            className={cn(
                'inline-flex items-center gap-3 text-[0.7rem] font-medium tracking-[0.3em] uppercase',
                light ? 'text-brass-light' : 'text-brass',
                className,
            )}
        >
            <span className={cn('h-px w-8', light ? 'bg-brass-light/70' : 'bg-brass/70')} aria-hidden="true" />
            {children}
        </p>
    );
}

/** Title in the display serif; words wrapped in *asterisks* are set in italics */
export function DisplayTitle({ text, as: Tag = 'h2', className }: { text: string; as?: 'h1' | 'h2' | 'h3'; className?: string }) {
    const parts = text.split(/(\*[^*]+\*)/g).filter(Boolean);

    return (
        <Tag className={cn('font-display leading-[1.02] font-medium tracking-tight text-balance', className)}>
            {parts.map((part, index) =>
                part.startsWith('*') && part.endsWith('*') ? (
                    <em key={index} className="text-brass font-normal italic">
                        {part.slice(1, -1)}
                    </em>
                ) : (
                    <span key={index}>{part}</span>
                ),
            )}
        </Tag>
    );
}
