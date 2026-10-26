import { TagOption, TagsInput } from '@/components/ui/tags-input';
import { t } from '@/lib/i18n';
import apiClient from '@/services/api';
import { usePage } from '@inertiajs/react';
import { isAxiosError } from 'axios';
import { useState } from 'react';

interface Props {
    /** Existing active tags. */
    tags: TagOption[];
    selected: number[];
    onChange: (tagIds: number[]) => void;
}

interface SharedPermissions {
    [key: string]: unknown;
    auth?: { permissions?: { super_admin?: boolean; modules?: Record<string, string[]> } | null };
}

/**
 * The "Etiquetas" field of the page and post editors. Users who manage tags can create
 * new ones on the spot; everyone else picks from the existing ones.
 */
export default function TagField({ tags, selected, onChange }: Props) {
    const { auth } = usePage<SharedPermissions>().props;
    const canManage = Boolean(auth?.permissions?.super_admin || auth?.permissions?.modules?.tags?.includes('administrar'));

    // Tags created here are kept locally so the editor keeps its unsaved changes
    const [created, setCreated] = useState<TagOption[]>([]);
    const options = [...tags, ...created.filter((tag) => !tags.some((t) => t.id === tag.id))];
    const value = selected.map((id) => options.find((tag) => tag.id === id)).filter((tag): tag is TagOption => tag !== undefined);

    const createTag = async (name: string): Promise<TagOption> => {
        try {
            const { data } = await apiClient.post(route('tags.quick'), { name });
            const tag = { id: data.id, name: data.name };
            setCreated((prev) => [...prev, tag]);
            return tag;
        } catch (err) {
            const errors = isAxiosError(err) ? err.response?.data?.errors : null;
            throw new Error(errors ? (Object.values(errors)[0] as string[])[0] : t('No se pudo crear la etiqueta.'));
        }
    };

    return (
        <div className="space-y-1.5">
            <TagsInput
                value={value}
                options={options}
                onChange={(next) => onChange(next.map((tag) => tag.id))}
                onCreate={canManage ? createTag : undefined}
                placeholder={canManage ? t('Escribe una etiqueta...') : t('Busca una etiqueta...')}
            />
            <p className="text-muted-foreground text-[11px]">
                {canManage
                    ? t('Pulsa Enter o escribe una coma para añadir. Las etiquetas nuevas se crean al momento.')
                    : t('Elige entre las etiquetas existentes.')}
                {canManage && (
                    <>
                        {' '}
                        <a href="/admin/tags" target="_blank" rel="noreferrer" className="hover:text-foreground underline">
                            {t('Gestionar etiquetas')}
                        </a>
                    </>
                )}
            </p>
        </div>
    );
}
