export interface CmsTaxonomy {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    active: boolean;
    updated_at: string;
    created_at: string;
    terms?: CmsTaxonomyTerm[];
}

export interface CmsTaxonomyForm {
    id?: number;
    name: string;
    slug?: string;
    description?: string | null;
    active: boolean;
    [key: string]: string | number | boolean | null | undefined | Record<string, unknown>;
}

export interface CmsTaxonomyTerm {
    id: number;
    taxonomy_id: number;
    parent_id: number | null;
    name: string;
    slug: string;
    description: string | null;
    active: boolean;
    position: number;
    updated_at: string;
    created_at: string;
    parent?: CmsTaxonomyTerm | null;
}

export interface CmsTaxonomyTermForm {
    id?: number;
    taxonomy_id?: number;
    parent_id?: number | null;
    name: string;
    slug?: string;
    description?: string | null;
    active: boolean;
    position?: number;
    [key: string]: string | number | boolean | null | undefined | Record<string, unknown>;
}
