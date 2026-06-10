import { CmsArticle } from './cms-article';

export interface CmsMenu {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    active: boolean;
    created_at: string;
    updated_at: string;
    items?: CmsMenuItem[];
}

export interface CmsMenuItem {
    id: number;
    menu_id: number;
    parent_id: number | null;
    title: string;
    url: string | null;
    article_id: number | null;
    target: '_self' | '_blank';
    position: number;
    active: boolean;
    created_at: string;
    updated_at: string;
    resolved_url?: string;
    article?: CmsArticle | null;
    children?: CmsMenuItem[];
}

export interface CmsMenuForm {
    id?: number | null;
    name: string;
    slug?: string;
    description?: string | null;
    active: boolean;
    [key: string]: unknown;
}

export interface CmsMenuItemForm {
    id?: number | null;
    parent_id?: number | null;
    title: string;
    url?: string | null;
    article_id?: number | null;
    target?: '_self' | '_blank';
    active: boolean;
    [key: string]: unknown;
}
