import { usePage } from '@inertiajs/react';
import { type ImgHTMLAttributes } from 'react';

/** Library details the server sends for the images on a public page, keyed by URL */
export interface MediaInfo {
    alt: string | null;
    caption: string | null;
    srcset: string | null;
    width: number | null;
    height: number | null;
}

interface MediaImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
    src: string;
    /** Used when the library has no alt text for this image */
    fallbackAlt?: string;
}

/**
 * Public image tag: adds the library's responsive versions (srcset), its size and alt text
 * when the page props carry them ("media"); otherwise it is a plain <img>.
 */
export function MediaImage({ src, alt, fallbackAlt = '', sizes = '100vw', loading = 'lazy', ...props }: MediaImageProps) {
    const { media } = usePage<{ media?: Record<string, MediaInfo> }>().props;
    const info = media?.[src];

    return (
        <img
            src={src}
            alt={alt ?? (info?.alt || fallbackAlt)}
            srcSet={info?.srcset ?? undefined}
            sizes={info?.srcset ? sizes : undefined}
            width={info?.width ?? undefined}
            height={info?.height ?? undefined}
            loading={loading}
            decoding="async"
            {...props}
        />
    );
}
