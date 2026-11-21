import { t } from '@/lib/i18n';

export interface ListingPageOption {
    id: number;
    title: string;
    lang: string | null;
}

interface Props {
    id: string;
    pages: ListingPageOption[];
    value: number | null | undefined;
    onChange: (value: number | null) => void;
    disabled?: boolean;
}

/** A page of the site that lists the entries: their pages take its banner, title and "back" link */
export default function ListingPageSelect({ id, pages, value, onChange, disabled }: Props) {
    const langs = new Set(pages.map((page) => page.lang));

    return (
        <select
            id={id}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
            disabled={disabled}
            className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
            <option value="">{t('Ninguna')}</option>
            {pages.map((page) => (
                <option key={page.id} value={page.id}>
                    {page.title}
                    {langs.size > 1 && page.lang ? ` (${page.lang.toUpperCase()})` : ''}
                </option>
            ))}
        </select>
    );
}
