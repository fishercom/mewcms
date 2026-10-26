import { BLOCK_RENDERERS } from '@/blocks/registry';
import { BlockTextContext, type BlockData } from '@/blocks/types';
import ContentRenderer from '@/components/content-renderer';
import { cn } from '@/lib/utils';

interface Props {
    blocks?: BlockData[] | null;
    /** Content of items saved before blocks existed */
    html?: string | null;
    className?: string;
    /** Typography for the text (passed to the text blocks, or to the plain content) */
    textClassName?: string;
}

/**
 * Public rendering of a page's or post's blocks. Falls back to the plain content when the
 * item has no blocks yet.
 */
export default function Blocks({ blocks, html, className, textClassName = '' }: Props) {
    if (!Array.isArray(blocks)) {
        return html && html.trim() !== '' ? <ContentRenderer html={html} className={cn(textClassName, className)} /> : null;
    }

    return (
        <BlockTextContext.Provider value={textClassName}>
            <div className={cn('space-y-10', className)}>
                {blocks.map((block) => {
                    const Render = BLOCK_RENDERERS[block.type];
                    return Render ? (
                        <div key={block.id} data-block={block.type}>
                            <Render data={block.data} />
                        </div>
                    ) : null;
                })}
            </div>
        </BlockTextContext.Provider>
    );
}
