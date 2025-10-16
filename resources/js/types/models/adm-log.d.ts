import { AdmEvent } from './adm-event';
import { User } from './user';

export interface AdmLog {
    id: number,
    event_id: number,
    user_id: number,
    comment: string,
    created_at: Date,
    updated_at: Date,
    user: User,
    event: AdmEvent,
}

export interface AdmLogForm {
    id?: number,
    event_id: number,
    user_id: number,
    comment: string,
    [key: string]: string | number | boolean | null | undefined | Record<string, unknown>;
}