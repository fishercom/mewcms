export interface CmsNotify {
    id: number,
    form_id: number,
    user_id: number,
    recipients: string,
    active: boolean,
    updated_at: Date,
    created_at: Date
}

export interface CmsNotifyForm {
    id?: number,
    form_id: number,
    user_id: number,
    recipients: string,
    active: boolean,
    [key: string]: string | number | boolean | null | undefined | Record<string, unknown>;
}