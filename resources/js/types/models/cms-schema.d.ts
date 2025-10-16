import type { CustomField } from './custom-field';

export interface CmsSchema {
    id: number,
    parent_id: number,
    group_id: number,
    name: string,
    fields: CustomField[],
    iterations: number,
    type: string,
    active: boolean,
    updated_at: Date,
    created_at: Date
}

export interface CmsSchemaForm {
    id?: number | null,
    parent_id?: number | null,
    group_id: number,
    name: string,
    fields: CustomField[],
    iterations: number,
    type: string,
    active: boolean,
    [key: string]: string | number | boolean | null | undefined | Record<string, unknown> | CustomField[];
}