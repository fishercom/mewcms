// import type { CustomField } from './custom-field';

type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
interface JsonObject { [key: string]: JsonValue }
type JsonArray = JsonValue[];
type FormDataConvertible = string | number | boolean | null | File | Blob | Date | FormDataConvertible[] | { [key: string]: FormDataConvertible };

export interface CmsArticle {
    id: number;
    parent_id: number | null;
    schema_id: number | null;
    lang_id: number;
    title: string;
    content?: string | null;
    excerpt?: string | null;
    featured_image?: string | null;
    status?: string | null;
    metadata: Record<string, unknown>;
    slug: string;
    active: boolean;
    depth?: number;
    updated_at: Date;
    created_at: Date;
    schema?: import('./cms-schema').CmsSchema;
    parent?: CmsArticle | null;
    children?: CmsArticle[];
    terms?: import('./cms-taxonomy').CmsTaxonomyTerm[];
}

export interface CmsArticleForm {
    id: number | null;
    parent_id: number | null;
    schema_id: number | null;
    lang_id: number;
    title: string;
    content?: string | null;
    excerpt?: string | null;
    featured_image?: string | null;
    status?: string | null;
    metadata: { [key: string]: FormDataConvertible };
    slug: string;
    active: boolean;
    term_ids?: number[];
    [key: string]: FormDataConvertible;
}