import { CmsFileType } from './cms-filetype';

export interface CmsDirectory {
    id: number;
    type_id: number;
    name: string;
    alias: string;
    path: string;
    active?: boolean;
    created_at: string;
    updated_at: string;
    type: CmsFileType; // Assuming a relationship
}

export interface CmsDirectoryForm {
    id?: number;
    name: string;
    type_id: number;
    alias: string;
    path: string;
    active: boolean;
    [key: string]: string | number | boolean | null | undefined;
}
