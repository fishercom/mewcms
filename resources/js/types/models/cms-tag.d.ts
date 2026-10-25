export interface CmsTag {
    id: number;
    name: string;
    slug: string;
    active?: boolean;
    articles_count?: number;
    posts_count?: number;
    created_at?: string;
    updated_at?: string;
}
