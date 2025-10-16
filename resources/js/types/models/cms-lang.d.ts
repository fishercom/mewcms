export interface CmsLang {
    id: number,
    name: string,
    iso: string,
    active: boolean,
    updated_at: Date,
    created_at: Date
}

export interface CmsLangForm {
    id?: number,
    name: string,
    iso: string,
    active: boolean,
    [key: string]: string | number | boolean | null | undefined | Record<string, unknown>;
}