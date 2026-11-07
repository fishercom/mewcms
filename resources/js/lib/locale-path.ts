/**
 * Addresses of the public pages in the language being shown. A site's extra languages
 * answer under their code ("/en/about"), its main language has none ("/nosotros").
 *
 * The prefix is fixed for the whole visit: moving to another language reloads the page
 * (the server versions each language apart), so it is set once when the app starts.
 */
let prefix = '';

export function setLocalePrefix(value: unknown): void {
    prefix = typeof value === 'string' ? value : '';
}

/**
 * "/blog" → "/en/blog" on an English page. External addresses, anchors and addresses that
 * already carry the prefix are left alone.
 */
export function localePath(path: string): string {
    if (!prefix || !path.startsWith('/') || path.startsWith('//')) {
        return path;
    }
    if (path === prefix || path.startsWith(prefix + '/') || path.startsWith(prefix + '?')) {
        return path;
    }

    return path === '/' ? prefix : prefix + path;
}
