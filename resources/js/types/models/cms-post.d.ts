import { CmsSchema } from './cms-schema';
import { CmsTaxonomyTerm } from './cms-taxonomy';

export interface CmsPostType {
    id: number;
    name: string;
    singular_name: string;
    slug: string;
    icon: string;
    description: string | null;
    default_schema_id: number | null;
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
    excerpt: string | null;
    featured_image: string | null;
    metadata: Record<string, unknown>;
    status: 'draft' | 'published';
    published_at: string;
    active: boolean;
    created_at: string;
    updated_at: string;
    user?: { id: number; name: string; username: string };
    schema?: CmsSchema;
    terms?: CmsTaxonomyTerm[];
    term_ids?: number[];
}
