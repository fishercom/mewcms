import { type BlockData, withNewIds } from '@/blocks/types';
import { type CmsSchema } from '@/types/models/cms-schema';
import { useEffect, useRef } from 'react';

/**
 * A new page or post starts with its schema's starter layout: when the schema is chosen
 * (or changed) and the editor is still empty, its default blocks are copied in.
 */
export function useStarterLayout(
    isNew: boolean,
    schema: CmsSchema | null | undefined,
    blocks: BlockData[],
    setBlocks: (blocks: BlockData[]) => void,
) {
    const applied = useRef<number | null>(null);

    useEffect(() => {
        if (!isNew || !schema || applied.current === schema.id) return;
        applied.current = schema.id;
        if (blocks.length === 0 && schema.default_blocks?.length) {
            setBlocks(withNewIds(schema.default_blocks));
        }
    }, [isNew, schema, blocks.length, setBlocks]);
}
