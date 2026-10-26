/**
 * Admin interface translations. The dictionaries are the Laravel JSON files in /lang,
 * shared with __() on the server: each file maps the text written in the code to its
 * translation in that language. A text without a translation is shown as written.
 */
const dictionaries = import.meta.glob<Record<string, string>>('../../../lang/*.json', { eager: true, import: 'default' });

export const LOCALES = { es: 'Español', en: 'English' } as const;

export type Locale = keyof typeof LOCALES;

// The server renders <html lang> from the "locale" cookie, so module constants translate correctly too
let current: string = typeof document !== 'undefined' ? document.documentElement.lang || 'es' : 'es';

export function setLocale(locale: string): void {
    current = locale;
}

export function getLocale(): string {
    return current;
}

/**
 * Translate a text, replacing :placeholders with the given values.
 */
export function t(text: string, replace: Record<string, string | number> = {}): string {
    let out = dictionaries[`../../../lang/${current}.json`]?.[text] || text;
    for (const [key, value] of Object.entries(replace)) {
        out = out.replaceAll(`:${key}`, String(value));
    }

    return out;
}

/**
 * Switch the admin language: remembered in a cookie for a year, then the page reloads.
 */
export function changeLocale(locale: Locale): void {
    document.cookie = `locale=${locale};path=/;max-age=${365 * 24 * 60 * 60};SameSite=Lax`;
    window.location.reload();
}
