export interface CmsTranslate {
    id: number,
    alias: string,
    input_type: number,
    metadata: [],
    updated_at: Date,
    created_at: Date
}

export interface CmsTranslateForm {
    id?: number,
    alias: string,
    input_type: number,
    metadata: { iso: string, value: string }[],
    [key: string]: string | number | boolean | null | undefined | Record<string, unknown> | { iso: string, value: string }[];
}