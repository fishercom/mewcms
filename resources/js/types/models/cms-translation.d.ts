/** A row of Admin → Translations: one key of the site's theme */
export interface CmsTranslationItem {
    key: string;
    /** First part of the key ("shop" for "shop.from_price") */
    group: string;
    /** The theme's text in the site's language (or the fallback language) */
    default: string | null;
    /** The theme has no text for it in the site's language */
    missing: boolean;
    /** The site's own text, null when it shows the theme's */
    value: string | null;
    /** Id of the site's text, to go back to the theme's */
    id: number | null;
    /** Saved by the site but not used by its theme */
    unused: boolean;
}
