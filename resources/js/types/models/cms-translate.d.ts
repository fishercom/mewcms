export interface CmsTranslate {
    id: number;
    alias: string;
    input_type: number;
    metadata?: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export interface CmsTranslateForm {
    id?: number;
    alias: string;
    input_type: number;
    metadata: Record<string, unknown>;
    [key: string]: string | number | boolean | null | undefined | Record<string, unknown>;
}
