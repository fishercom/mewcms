export interface CustomFieldOption {
    value: string;
    label: string;
}

export interface CustomField {
    id?: string | number;
    key: string;
    label: string;
    type: string;
    value?: string | number | boolean | null;
    fields?: CustomField[];
    /** Choices of a "select" field */
    options?: CustomFieldOption[];
    [key: string]: string | number | boolean | null | undefined | CustomField[] | CustomFieldOption[];
}
