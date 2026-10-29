export interface CmsSite {
    id: number;
    name: string;
    site_url: string | null;
    domains: string[] | null;
    theme: string;
    lang_id: number | null;
    title: string | null;
    description: string | null;
    favicon: string | null;
    head_scripts: string | null;
    body_scripts: string | null;
    default: boolean;
    active: boolean;
    /** Sites list only: where the site can be seen, and whether "/" shows a page */
    public_url?: string | null;
    has_home?: boolean;
    updated_at: Date;
    created_at: Date;
}

export interface CmsSiteForm {
    id?: number;
    name: string;
    site_url: string;
    /** One host per line */
    domains: string;
    theme: string;
    /** Empty for none */
    lang_id: string;
    title: string;
    description: string;
    favicon: string;
    head_scripts: string;
    body_scripts: string;
    default: boolean;
    active: boolean;
    [key: string]: string | number | boolean | null | undefined;
}

export interface CmsTheme {
    slug: string;
    name: string;
    description: string;
    version: string;
    author: string;
    /** Whether the theme folder has a screenshot.png */
    screenshot: boolean;
    /** Uploaded in Admin → Themes (not part of the code) */
    uploaded: boolean;
    /** The built theme whose pages it uses */
    layout: string;
}

export interface CmsSiteLang {
    id: number;
    name: string;
    iso: string;
}
