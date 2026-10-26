import type { BlockData } from '@/blocks/types';
import type { CustomField } from './custom-field';

export interface CmsSchema {
    id: number;
    parent_id?: number | null;
    group_id: number;
    name: string;
    fields: CustomField[];
    /** Block types offered in the editor; null = all */
    allowed_blocks?: string[] | null;
    /** Starter layout of new pages and posts */
    default_blocks?: BlockData[] | null;
    type?: string | null;
    front_view?: string | null;
    active: boolean;
    updated_at: Date;
    created_at: Date;
    articles_count?: number;
}

export interface CmsSchemaForm {
    id?: number | null;
    parent_id?: number | null;
    group_id: number;
    name: string;
    fields: CustomField[];
    allowed_blocks?: string[] | null;
    default_blocks?: BlockData[] | null;
    type?: string | null;
    front_view?: string | null;
    active: boolean;
    [key: string]: string | number | boolean | null | undefined | Record<string, unknown> | CustomField[] | string[] | BlockData[];
}
