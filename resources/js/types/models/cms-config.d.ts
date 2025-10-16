export interface CmsConfig {
    id: number,
    event_id: number,
    user_id: number,
    type: string,
    name: string,
    alias: string,
    value: string,
    updated_at: Date,
    created_at: Date
}

export interface CmsConfigForm {
    id?: number,
    event_id: number,
    user_id: number,
    type: string,
    name: string,
    alias: string,
    value: string,
    [key: string]: string | number | boolean | null | undefined | Record<string, unknown>;
}