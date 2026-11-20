import type { Config } from 'ziggy-js';
import type { Auth } from './auth';

/** The client's logo for the panel and the login screen (Configuración > Marca) */
export interface AdminBrand {
    name: string;
    /** Small line under the name, like MewCMS's "Content Studio" */
    tagline: string | null;
    /** A wide logo, shown alone; without it the icon goes next to the name */
    logo: string | null;
    logo_dark: string | null;
    icon: string | null;
}

export interface SharedData {
    name: string;
    locale: string;
    quote: { message: string; author: string };
    auth: Auth;
    ziggy: Config & { location: string };
    /** Null when the panel shows MewCMS's own logo */
    brand?: AdminBrand | null;
    [key: string]: unknown;
}
