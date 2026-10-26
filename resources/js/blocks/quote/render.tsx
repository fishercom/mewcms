import { MediaImage } from '@/components/media-image';
import { cn } from '@/lib/utils';
import { type BlockRenderProps, str } from '../types';

export default function QuoteRender({ data }: BlockRenderProps) {
    const text = str(data.text);
    if (!text) return null;
    const style = str(data.style) || 'simple';
    const photo = str(data.photo);

    return (
        <figure
            className={cn(
                style === 'simple' && 'border-l-4 border-[#f53003] pl-5 dark:border-[#FF4433]',
                style === 'card' && 'rounded-2xl border border-[#19140015] bg-white p-6 shadow-xs sm:p-8 dark:border-[#3E3E3A]/40 dark:bg-[#161615]',
                style === 'large' && 'mx-auto max-w-2xl text-center',
            )}
        >
            <blockquote className={cn('leading-relaxed text-balance', style === 'large' ? 'text-2xl font-medium sm:text-3xl' : 'text-lg')}>
                <p>{style === 'large' ? `“${text}”` : text}</p>
            </blockquote>
            {(str(data.author) || photo) && (
                <figcaption className={cn('mt-4 flex items-center gap-3', style === 'large' && 'justify-center')}>
                    {photo && <MediaImage src={photo} alt="" sizes="48px" className="h-11 w-11 rounded-full object-cover" />}
                    <span className="text-sm">
                        {str(data.author) && <span className="block font-semibold">{str(data.author)}</span>}
                        {str(data.role) && <span className="block text-[#706f6c] dark:text-[#A1A09A]">{str(data.role)}</span>}
                    </span>
                </figcaption>
            )}
        </figure>
    );
}
