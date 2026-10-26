import { type CustomField } from '@/types/models/custom-field';
import { createContext } from 'react';

/** Values a block can hold; matches what Inertia forms can send */
export type BlockValue = string | number | boolean | null | File | Blob | Date | BlockValue[] | { [key: string]: BlockValue };

export type BlockValues = { [key: string]: BlockValue };

/** A block as stored in the "blocks" column of pages and posts */
export interface BlockData {
    id: string;
    type: string;
    version: number;
    data: BlockValues;
    [key: string]: BlockValue;
}

/** A block type as defined in app/Blocks (sent to the editor as "blockTypes") */
export interface BlockDefinition {
    key: string;
    name: string;
    icon: string;
    category: string;
    description: string;
    version: number;
    fields: CustomField[];
    defaults: BlockValues;
}

export interface BlockRenderProps<T = BlockValues> {
    data: T;
    /** Rendered inside the editor: links don't navigate */
    editing?: boolean;
}

export const newBlockId = (): string =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/** Plain content of an item saved before blocks existed: one rich text block */
export const blocksFromContent = (html?: string | null): BlockData[] =>
    html && html.trim() !== '' ? [{ id: newBlockId(), type: 'rich_text', version: 1, data: { html } }] : [];

export const str = (value: unknown): string => (typeof value === 'string' ? value : '');

/** Typography classes a template applies to the text blocks (e.g. "prose-sm") */
export const BlockTextContext = createContext<string>('');
