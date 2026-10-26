import { cn } from '@/lib/utils';
import { BLOCK_RENDERERS } from '../registry';
import { type BlockData, type BlockRenderProps, str } from '../types';

/** Column spans (out of 12) per layout; keep in sync with App\Blocks\ColumnsBlock::LAYOUTS */
export const COLUMN_LAYOUTS: Record<string, number[]> = {
    '50-50': [6, 6],
    '33-67': [4, 8],
    '67-33': [8, 4],
    '33-33-33': [4, 4, 4],
    '25-50-25': [3, 6, 3],
    '25-25-25-25': [3, 3, 3, 3],
};

export const SPANS: Record<number, string> = { 3: 'md:col-span-3', 4: 'md:col-span-4', 6: 'md:col-span-6', 8: 'md:col-span-8' };
const GAPS: Record<string, string> = { sm: 'gap-4', md: 'gap-8', lg: 'gap-12' };

export interface ColumnData {
    blocks: BlockData[];
}

export default function ColumnsRender({ data, editing }: BlockRenderProps) {
    const spans = COLUMN_LAYOUTS[str(data.layout)] ?? COLUMN_LAYOUTS['50-50'];
    const columns = (Array.isArray(data.columns) ? data.columns : []) as unknown as ColumnData[];

    return (
        <div className={cn('grid grid-cols-1 md:grid-cols-12', GAPS[str(data.gap)] ?? GAPS.md, data.align === 'center' && 'items-center')}>
            {spans.map((span, index) => (
                <div key={index} className={cn('min-w-0 space-y-6', SPANS[span])}>
                    {(columns[index]?.blocks ?? []).map((block) => {
                        const Render = BLOCK_RENDERERS[block.type];
                        return Render ? (
                            <div key={block.id} data-block={block.type}>
                                <Render data={block.data} editing={editing} />
                            </div>
                        ) : null;
                    })}
                </div>
            ))}
        </div>
    );
}
