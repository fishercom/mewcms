import { MediaImage } from '@/components/media-image';
import { cn } from '@/lib/utils';
import { type BlockRenderProps, str } from '../types';

// The page column is narrow: "wide" and "full" break out of it on larger screens
const WIDTHS: Record<string, string> = {
    content: 'w-full',
    wide: 'w-full lg:-mx-24 lg:w-[calc(100%+12rem)]',
    full: 'relative left-1/2 w-screen max-w-none -translate-x-1/2',
};

const SIZES: Record<string, string> = {
    content: '(max-width: 768px) 100vw, 768px',
    wide: '(max-width: 1024px) 100vw, 1024px',
    full: '100vw',
};

export default function ImageRender({ data, editing }: BlockRenderProps) {
    const src = str(data.src);
    if (!src) return null;

    const size = str(data.size) || 'content';
    const link = str(data.link);
    const caption = str(data.caption);
    const image = (
        <MediaImage
            src={src}
            alt={str(data.alt) || undefined}
            sizes={SIZES[size]}
            className={cn('h-auto w-full object-cover', size !== 'full' && 'rounded-xl')}
        />
    );

    return (
        <figure className={cn(editing ? 'w-full' : (WIDTHS[size] ?? WIDTHS.content))}>
            {link && !editing ? (
                <a href={link} className="block transition-opacity hover:opacity-90">
                    {image}
                </a>
            ) : (
                image
            )}
            {caption && <figcaption className="mt-2 text-center text-xs text-[#706f6c] dark:text-[#A1A09A]">{caption}</figcaption>}
        </figure>
    );
}
