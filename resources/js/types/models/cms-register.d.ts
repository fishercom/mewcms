export interface CmsRegister {
    id: number,
    form_id: number,
    contact_id: number | null,
    name: string | null,
    email: string | null,
    phone: string | null,
    message: string | null,
    acceptance: boolean | null,
    review: boolean | null,
    review_date: Date | null,
    created_at: Date,
    updated_at: Date
}

export interface CmsRegisterForm {
    id?: number,
    form_id: number,
    contact_id: number | null,
    name: string | null,
    email: string | null,
    phone: string | null,
    message: string | null,
    acceptance: boolean | null,
    review: boolean | null,
    review_date: Date | null,
    [key: string]: string | number | boolean | null | undefined | Record<string, unknown> | Date;
}