export interface CmsSite {
    id: number;
    name: string;
    site_url: string | null;
    domains: string[] | null;
    theme: string;
    theme_settings: Record<string, string> | null;
    lang_id: number | null;
    title: string | null;
    description: string | null;
    favicon: string | null;
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
    theme_settings: Record<string, string>;
    /** Empty for none */
    lang_id: string;
    title: string;
    description: string;
    favicon: string;
    default: boolean;
    active: boolean;
    [key: string]: string | number | boolean | null | undefined | Record<string, string>;
}

export interface CmsThemeSettingOption {
    value: string;
    label: string;
}

export interface CmsThemeSetting {
    key: string;
    label: string;
    type: 'color' | 'select';
    default: string;
    options?: CmsThemeSettingOption[];
}

export interface CmsTheme {
    slug: string;
    name: string;
    description: string;
    version: string;
    author: string;
    /** Whether the theme folder has a screenshot.png */
    screenshot: boolean;
    settings: CmsThemeSetting[];
}

export interface CmsSiteLang {
    id: number;
    name: string;
    iso: string;
}
