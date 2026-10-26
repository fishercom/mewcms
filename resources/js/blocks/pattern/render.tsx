import { BLOCK_RENDERERS } from '../registry';
import { type BlockData, type BlockRenderProps, str } from '../types';

/**
 * A synced reusable block: the blocks of the pattern, added by the server (or, in the
 * editor, by the block editor from the list of patterns).
 */
export default function PatternRender({ data, editing }: BlockRenderProps) {
    const blocks = (Array.isArray(data.blocks) ? data.blocks : []) as unknown as BlockData[];

    if (blocks.length === 0) {
        return editing ? (
            <p className="text-muted-foreground py-6 text-center text-xs">
                {str(data.pattern) === '' ? 'Elige un bloque reutilizable.' : 'Este bloque reutilizable está vacío.'}
            </p>
        ) : null;
    }

    return (
        <div className="space-y-10">
            {blocks.map((block) => {
                const Render = BLOCK_RENDERERS[block.type];
                return Render ? (
                    <div key={block.id} data-block={block.type}>
                        <Render data={block.data} editing={editing} />
                    </div>
                ) : null;
            })}
        </div>
    );
}
