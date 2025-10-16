export interface CmsSite {
    id: number,
    name: string,
    segment: string,
    site_url: string,
    schema_group_id: number,
    metadata: Record<string, unknown>,
    default: boolean,
    active: boolean,
    updated_at: Date,
    created_at: Date
}

export interface CmsSiteForm {
    id?: number,
    name: string,
    segment: string,
    site_url: string,
    schema_group_id: number,
    metadata: Record<string, unknown>,
    active: boolean,
    [key: string]: string | number | boolean | null | undefined | Record<string, unknown>;
}