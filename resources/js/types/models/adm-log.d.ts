import { AdmEvent } from './adm-event';
import { User } from './user';

export interface AdmLog {
    id: number;
    event_id: number;
    user_id: number;
    comment: string;
    created_at: Date;
    updated_at: Date;
    user: User;
    event: AdmEvent;
}
