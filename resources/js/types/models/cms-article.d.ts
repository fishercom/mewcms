import { type BlockData } from '@/blocks/types';
// import type { CustomField } from './custom-field';

type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
interface JsonObject {
    [key: string]: JsonValue;
}
type JsonArray = JsonValue[];
type FormDataConvertible = string | number | boolean | null | File | Blob | Date | FormDataConvertible[] | { [key: string]: FormDataConvertible };

export interface CmsArticle {
    id: number;
    parent_id: number | null;
    schema_id: number | null;
    lang_id: number;
    title: string;
    content?: string | null;
    blocks?: BlockData[] | null;
    excerpt?: string | null;
    featured_image?: string | null;
    status?: string | null;
    published_at?: string | null;
    is_scheduled?: boolean;
    deleted_at?: string | null;
    metadata: Record<string, unknown>;
    slug: string;
    /** Full path, e.g. "nosotros/historia". */
    uri?: string;
    /** Public URL ("/" for the home page). */
    url?: string;
    active: boolean;
    depth?: number;
    updated_at: Date;
    created_at: Date;
    schema?: import('./cms-schema').CmsSchema;
    parent?: CmsArticle | null;
    children?: CmsArticle[];
    tags?: import('./cms-tag').CmsTag[];
}

export interface CmsArticleForm {
    id: number | null;
    parent_id: number | null;
    schema_id: number | null;
    lang_id: number | null;
    title: string;
    content?: string | null;
    blocks?: BlockData[] | null;
    excerpt?: string | null;
    featured_image?: string | null;
    status?: string | null;
    published_at?: string | null;
    metadata: { [key: string]: FormDataConvertible };
    slug: string;
    active: boolean;
    tag_ids?: number[];
    menu_ids?: number[];
    menus_managed?: boolean;
    [key: string]: FormDataConvertible;
}
