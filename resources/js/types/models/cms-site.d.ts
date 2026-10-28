export interface CmsSite {
    id: number;
    name: string;
    segment: string;
    site_url: string | null;
    domains: string[] | null;
    theme: string;
    theme_settings: Record<string, unknown> | null;
    schema_group_id: number | null;
    metadata: Record<string, unknown>;
    default: boolean;
    active: boolean;
    updated_at: Date;
    created_at: Date;
}

export interface CmsSiteForm {
    id?: number;
    name: string;
    segment: string;
    site_url: string;
    /** One host per line */
    domains: string;
    theme: string;
    schema_group_id: number | null;
    metadata: Record<string, unknown>;
    active: boolean;
    [key: string]: string | number | boolean | null | undefined | Record<string, unknown>;
}

export interface CmsTheme {
    slug: string;
    name: string;
    description: string;
    version: string;
    author: string;
}
