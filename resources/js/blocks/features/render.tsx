import { cn } from '@/lib/utils';
import { BLOCK_ICONS } from '../icons';
import { type BlockRenderProps, str } from '../types';

interface Feature {
    icon?: string;
    title?: string;
    text?: string;
}

const COLUMNS: Record<string, string> = { '2': 'sm:grid-cols-2', '3': 'sm:grid-cols-2 lg:grid-cols-3', '4': 'sm:grid-cols-2 lg:grid-cols-4' };

export default function FeaturesRender({ data }: BlockRenderProps) {
    const items = (Array.isArray(data.items) ? data.items : []) as unknown as Feature[];
    if (items.length === 0 && !str(data.title)) return null;

    return (
        <section className="space-y-8">
            {(str(data.title) || str(data.intro)) && (
                <div className="max-w-2xl space-y-2">
                    {str(data.title) && <h2 className="text-2xl font-bold tracking-tight text-balance">{str(data.title)}</h2>}
                    {str(data.intro) && <p className="leading-relaxed text-[#706f6c] dark:text-[#A1A09A]">{str(data.intro)}</p>}
                </div>
            )}
            <ul className={cn('grid gap-6', COLUMNS[str(data.columns)] ?? COLUMNS['3'])}>
                {items.map((item, index) => {
                    const Icon = BLOCK_ICONS[item.icon ?? ''] ?? BLOCK_ICONS.sparkles;
                    return (
                        <li key={index} className="space-y-2">
                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#f53003]/10 text-[#f53003] dark:bg-[#FF4433]/15 dark:text-[#FF4433]">
                                <Icon className="h-5 w-5" aria-hidden="true" />
                            </span>
                            {item.title && <h3 className="font-semibold">{item.title}</h3>}
                            {item.text && <p className="text-sm leading-relaxed text-[#706f6c] dark:text-[#A1A09A]">{item.text}</p>}
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
