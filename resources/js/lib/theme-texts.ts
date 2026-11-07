import { usePage } from '@inertiajs/react';
import { useMemo } from 'react';

/**
 * Fixed texts of the public theme. Theme pages write each text as a key with
 * t('shop.from_price', { price }); the texts come from the theme's lang/<locale>.json in
 * the site's language, with the changes made in Admin → Translations (see ThemeTexts.php).
 *
 * Values such as prices, dates or counts are never part of the text: they go in as
 * :placeholders, already formatted for the site's language with formatPrice() and Intl.
 */
export type Replace = Record<string, string | number>;

export type Texts = Record<string, string>;

/** A price custom field: an amount and an ISO 4217 currency code */
export interface Price {
    amount: number | null;
    currency?: string | null;
}

interface SiteProps {
    [key: string]: unknown;
    texts?: Texts;
    site?: { locale?: string | null; currency?: string | null } | null;
}

export const DEFAULT_CURRENCY = 'USD';

/** Language used when the site's language has no text for a key (ThemeTexts::FALLBACK) */
export const FALLBACK_LOCALE = 'en';

/**
 * The default theme's texts, bundled: shared parts (forms, galleries, sliders) also show
 * outside public pages, such as block previews in the admin, where no texts are shared.
 */
const bundled = import.meta.glob<Texts>('../../themes/default/lang/*.json', { eager: true, import: 'default' });

/** The default theme's texts in $locale ("es-PE": en, then es, then es-PE) */
export function defaultTexts(locale: string): Texts {
    const parts = locale.split('-');
    const chain = [FALLBACK_LOCALE, ...parts.map((_, i) => parts.slice(0, i + 1).join('-'))];

    return Object.assign({}, ...chain.map((code) => bundled[`../../themes/default/lang/${code}.json`] ?? {}));
}

/**
 * The text of $key with each :placeholder replaced. An unknown key is shown as is, so a
 * text missing from the catalogs is easy to spot (php artisan cms:theme-texts lists them).
 */
export function translate(texts: Texts, key: string, replace: Replace = {}): string {
    let out = texts[key] ?? key;
    // Longest names first, so :price_max is not taken for :price
    for (const name of Object.keys(replace).sort((a, b) => b.length - a.length)) {
        out = out.replaceAll(`:${name}`, String(replace[name]));
    }

    return out;
}

/**
 * The form of $key's text for $count, with :count and the other placeholders replaced.
 * Forms are separated by "|": "one|other" ("1 result|:count results"), or
 * "zero|one|other" to say something else for none ("No results|1 result|:count results").
 */
export function choose(texts: Texts, locale: string, key: string, count: number, replace: Replace = {}): string {
    const forms = (texts[key] ?? key).split('|');
    let form = forms[forms.length - 1];
    if (forms.length >= 3 && count === 0) {
        form = forms[0];
    } else if (forms.length >= 2 && new Intl.PluralRules(locale).select(count) === 'one') {
        form = forms[forms.length - 2];
    }

    return translate({ [key]: form }, key, { count, ...replace });
}

/** A text made safe to put inside HTML (dangerouslySetInnerHTML) */
export function escapeHtml(text: string): string {
    return text.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] as string);
}

export function isPrice(value: unknown): value is Price {
    return typeof value === 'object' && value !== null && 'amount' in value;
}

/**
 * A price for $locale: { amount: 48, currency: 'USD' } is "$48" in English and "US$ 48"
 * in Spanish. Plain text (prices saved before price fields existed) is shown as written;
 * an empty price is an empty string.
 */
export function formatPrice(value: unknown, locale: string, currency: string = DEFAULT_CURRENCY): string {
    if (typeof value === 'string') {
        return value;
    }
    const amount = isPrice(value) ? value.amount : typeof value === 'number' ? value : null;
    if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
        return '';
    }
    const code = (isPrice(value) && value.currency) || currency;
    const whole = Number.isInteger(Number(amount));

    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: code,
            minimumFractionDigits: whole ? 0 : 2,
            maximumFractionDigits: whole ? 0 : 2,
        }).format(Number(amount));
    } catch {
        // An unknown currency code or locale
        return `${code} ${amount}`;
    }
}

/**
 * The theme's texts and the site's formats, for theme pages:
 *
 *     const { t, choice, price, date } = useTexts();
 *     t('shop.from_price', { price: price(card.price) })
 *     choice('search.results', results.length, { query })
 */
export function useTexts() {
    const { texts, site } = usePage<SiteProps>().props;
    const locale = site?.locale || 'en';
    const currency = site?.currency || DEFAULT_CURRENCY;

    return useMemo(() => {
        const all = { ...defaultTexts(locale), ...texts };

        return {
            locale,
            t: (key: string, replace: Replace = {}) => translate(all, key, replace),
            choice: (key: string, count: number, replace: Replace = {}) => choose(all, locale, key, count, replace),
            price: (value: unknown) => formatPrice(value, locale, currency),
            date: (value: string | number | Date, options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }) =>
                new Intl.DateTimeFormat(locale, options).format(new Date(value)),
        };
    }, [texts, locale, currency]);
}
