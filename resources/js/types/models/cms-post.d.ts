import { type BlockData } from '@/blocks/types';
import { CmsSchema } from './cms-schema';
import { CmsTag } from './cms-tag';

export interface CmsPostType {
    id: number;
    name: string;
    singular_name: string;
    slug: string;
    icon: string;
    description: string | null;
    default_schema_id: number | null;
    /** Items per page of the public listing; 0 lists them all */
    per_page?: number;
    /** Sort order of the public listing */
    order?: 'newest' | 'oldest' | 'title';
    active: boolean;
    created_at?: string;
    updated_at?: string;
    default_schema?: CmsSchema;
}

export interface CmsPost {
    id: number;
    user_id: number;
    lang_id: number;
    schema_id: number | null;
    post_type: string;
    title: string;
    slug: string;
    content: string | null;
    blocks?: BlockData[] | null;
    excerpt: string | null;
    featured_image: string | null;
    metadata: Record<string, unknown>;
    status: 'draft' | 'published';
    published_at: string;
    is_scheduled?: boolean;
    deleted_at?: string | null;
    active: boolean;
    created_at: string;
    updated_at: string;
    user?: { id: number; name: string; username: string };
    schema?: CmsSchema;
    tags?: CmsTag[];
    tag_ids?: number[];
}

/** One post of a "Lista de posts" field, as page templates get it in their postLists prop */
export interface PostListItem {
    id: number;
    title: string;
    slug: string;
    url: string;
    excerpt: string | null;
    featured_image: string | null;
    published_at: string | null;
    metadata: Record<string, unknown>;
    tags: Array<{ name: string; slug: string }>;
}

/** The postLists prop of a page: field key => its posts */
export type PostLists = Record<string, PostListItem[]>;
