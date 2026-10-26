import { cn } from '@/lib/utils';
import { type BlockRenderProps, str } from '../types';

const STYLES: Record<string, { box: string; text: string; button: string }> = {
    accent: { box: 'bg-[#f53003] text-white dark:bg-[#E62D00]', text: 'text-white/85', button: 'bg-white text-[#1b1b18] hover:bg-white/90' },
    soft: {
        box: 'border border-[#19140015] bg-[#f53003]/5 text-[#1b1b18] dark:border-[#3E3E3A]/40 dark:bg-[#FF4433]/10 dark:text-[#EDEDEC]',
        text: 'text-[#706f6c] dark:text-[#A1A09A]',
        button: 'bg-[#f53003] text-white hover:bg-[#d92a02] dark:bg-[#FF4433]',
    },
    dark: { box: 'bg-[#1b1b18] text-white dark:bg-[#161615]', text: 'text-white/75', button: 'bg-white text-[#1b1b18] hover:bg-white/90' },
};

export default function CtaRender({ data, editing }: BlockRenderProps) {
    const style = STYLES[str(data.style)] ?? STYLES.accent;
    const label = str(data.button_label);
    const url = str(data.button_url);
    if (!str(data.title) && !str(data.text) && !label) return null;

    return (
        <section
            className={cn('flex w-full flex-col items-start gap-5 rounded-2xl p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10', style.box)}
        >
            <div className="max-w-2xl space-y-2">
                {str(data.title) && <h2 className="text-2xl font-bold tracking-tight text-balance">{str(data.title)}</h2>}
                {str(data.text) && <p className={cn('text-sm leading-relaxed sm:text-base', style.text)}>{str(data.text)}</p>}
            </div>
            {label && url && (
                <a
                    href={editing ? undefined : url}
                    className={cn('inline-flex shrink-0 items-center rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors', style.button)}
                >
                    {label}
                </a>
            )}
        </section>
    );
}
