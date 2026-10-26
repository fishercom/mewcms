import { type BlockData } from '@/blocks/types';

export interface CmsBlockPattern {
    id: number;
    name: string;
    key: string;
    description: string | null;
    category: string;
    blocks: BlockData[] | null;
    synced: boolean;
    active: boolean;
    created_at?: string;
    updated_at?: string;
}
