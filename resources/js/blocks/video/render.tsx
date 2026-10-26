import { CirclePlay } from 'lucide-react';
import { type BlockRenderProps, str } from '../types';

const RATIOS: Record<string, string> = {
    '16:9': 'aspect-video',
    '4:3': 'aspect-[4/3]',
    '1:1': 'aspect-square',
    '9:16': 'aspect-[9/16] max-w-sm mx-auto',
};

export default function VideoRender({ data, editing }: BlockRenderProps) {
    // The server turns an allowed YouTube/Vimeo link into a privacy-friendly embed URL
    const embed = str(data.embed);
    const file = str(data.file);
    const title = str(data.title) || 'Video';
    const ratio = RATIOS[str(data.ratio)] ?? RATIOS['16:9'];
    if (!embed && !file && !str(data.url)) return null;

    return (
        <figure>
            <div className={`${ratio} w-full overflow-hidden rounded-xl bg-black`}>
                {editing || (!embed && !file) ? (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-white/80">
                        <CirclePlay className="h-12 w-12" />
                        <span className="max-w-[80%] truncate text-xs">{str(data.url) || file}</span>
                    </div>
                ) : embed ? (
                    <iframe
                        src={embed}
                        title={title}
                        loading="lazy"
                        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                        referrerPolicy="strict-origin-when-cross-origin"
                        className="h-full w-full border-0"
                    />
                ) : (
                    <video src={file} controls preload="metadata" className="h-full w-full" aria-label={title} />
                )}
            </div>
            {str(data.caption) && (
                <figcaption className="mt-2 text-center text-xs text-[#706f6c] dark:text-[#A1A09A]">{str(data.caption)}</figcaption>
            )}
        </figure>
    );
}
