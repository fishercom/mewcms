import { cn } from '@/lib/utils';
import { type BlockRenderProps } from '../types';

interface Stat {
    prefix?: string;
    value?: string;
    suffix?: string;
    label?: string;
}

const COLUMNS = ['', 'grid-cols-1', 'grid-cols-2', 'grid-cols-2 sm:grid-cols-3', 'grid-cols-2 sm:grid-cols-4'];

export default function StatsRender({ data }: BlockRenderProps) {
    const items = ((Array.isArray(data.items) ? data.items : []) as unknown as Stat[]).filter((item) => item.value);
    if (items.length === 0) return null;
    const cards = data.style === 'cards';

    return (
        <dl className={cn('grid gap-4', COLUMNS[Math.min(items.length, 4)])}>
            {items.map((item, index) => (
                <div
                    key={index}
                    className={cn(
                        'flex flex-col-reverse gap-1',
                        cards && 'rounded-xl border border-[#19140015] bg-white p-5 shadow-xs dark:border-[#3E3E3A]/40 dark:bg-[#161615]',
                    )}
                >
                    <dt className="text-sm text-[#706f6c] dark:text-[#A1A09A]">{item.label}</dt>
                    <dd className="text-3xl font-bold tracking-tight text-[#f53003] tabular-nums sm:text-4xl dark:text-[#FF4433]">
                        {item.prefix}
                        {item.value}
                        {item.suffix}
                    </dd>
                </div>
            ))}
        </dl>
    );
}
