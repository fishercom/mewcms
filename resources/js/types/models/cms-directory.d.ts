export interface CmsDirectory {
    id: number,
    type_id: number,
    name: string,
    alias: string,
    path: string,
    active: boolean,
    updated_at: Date,
    created_at: Date
}

export interface CmsDirectoryForm {
    id?: number,
    type_id: number,
    name: string,
    alias: string,
    path: string,
    active: boolean,
    [key: string]: string | number | boolean | null | undefined | Record<string, unknown>;
}