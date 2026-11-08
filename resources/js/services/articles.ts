import { confirmDialog } from '@/components/confirm-dialog';
import objectToFormData from '@/lib/form-data';
import { t } from '@/lib/i18n';
import { Page } from '@inertiajs/core';
import { router } from '@inertiajs/react';

interface Callbacks {
    onSuccess?: (page: Page) => void;
    onError?: (errors: Record<string, string>) => void;
    onBefore?: () => boolean;
    onFinish?: () => void;
}

export const getArticles = (query: Record<string, unknown>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.get(route('articles.index'), query as any, {
        preserveState: true,
        replace: true,
    });
};

export const deleteArticle = async (id: number) => {
    const confirmed = await confirmDialog({
        title: t('¿Mover esta página a la papelera?'),
        description: t('Podrás restaurarla desde la papelera.'),
        confirmLabel: t('Mover a la papelera'),
    });
    if (!confirmed) return;

    router.delete(route('articles.destroy', id), {
        preserveScroll: true,
        onError: (errors) => {
            alert(Object.values(errors)[0] ?? 'Ocurrió un error al eliminar el registro.');
        },
    });
};

export const createArticle = (data: Record<string, unknown>, callbacks: Callbacks) => {
    router.post(route('articles.store'), objectToFormData(data), callbacks);
};

export const updateArticle = (id: number, data: Record<string, unknown>, callbacks: Callbacks) => {
    const options = {
        ...data,
        _method: 'PUT',
    };
    router.post(route('articles.update', id), objectToFormData(options), callbacks);
};
