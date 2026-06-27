export interface CmsFormField {
    id?: number;
    form_id?: number;
    name: string;
    alias: string;
    type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'checkbox' | 'radio';
    options?: string[] | null;
    active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface CmsForm {
    id: number;
    name: string;
    alias: string;
    info?: string | null;
    color?: string | null;
    active: boolean;
    fields_count?: number;
    fields?: CmsFormField[];
    created_at?: string;
    updated_at?: string;
}
