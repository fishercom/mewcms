export interface CmsRegisterField {
    id: number;
    register_id: number;
    field_id: number;
    value: string | null;
    txt_value: string | null;
    field?: {
        id: number;
        name: string;
        alias: string;
        type: string;
    };
}

export interface CmsRegister {
    id: number;
    form_id: number;
    name: string | null;
    email: string | null;
    phone: string | null;
    message: string | null;
    acceptance: boolean | null;
    review: boolean | null;
    review_date: string | null;
    created_at: string;
    updated_at: string;
    form?: { id: number; name: string; alias: string };
    fields?: CmsRegisterField[];
}

export interface CmsRegisterForm {
    id?: number;
    form_id: number;
    name: string | null;
    email: string | null;
    phone: string | null;
    message: string | null;
    acceptance: boolean | null;
    review: boolean | null;
    review_date: string | null;
    [key: string]: string | number | boolean | null | undefined | Record<string, unknown>;
}