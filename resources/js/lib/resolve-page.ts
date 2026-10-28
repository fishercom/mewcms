import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';

const pages = import.meta.glob('../pages/**/*.tsx');
const themePages = import.meta.glob('../../themes/*/front/**/*.tsx');

export const DEFAULT_THEME = 'default';

/**
 * Admin pages live in resources/js/pages. Public pages ("front/...") come from the
 * site's theme, and from the default theme when the theme does not override them.
 */
export function resolvePage(name: string, theme: string = DEFAULT_THEME) {
    if (name.startsWith('front/')) {
        const own = `../../themes/${theme}/${name}.tsx`;

        return resolvePageComponent(own in themePages ? own : `../../themes/${DEFAULT_THEME}/${name}.tsx`, themePages);
    }

    return resolvePageComponent(`../pages/${name}.tsx`, pages);
}
