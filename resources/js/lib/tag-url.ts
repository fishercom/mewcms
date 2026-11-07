import { localePath } from '@/lib/locale-path';

/**
 * Public archive URL of a tag, in the language being shown.
 */
export function tagUrl(slug: string): string {
    return localePath(`/tag/${slug}`);
}
