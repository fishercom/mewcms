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

export const getSites = (query: Record<string, unknown>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.get(route('sites.index'), query as any, {
        preserveState: true,
        replace: true,
    });
};

export const deleteSite = async (id: number) => {
    const confirmed = await confirmDialog({
        title: t('¿Eliminar este sitio?'),
        description: t('Esta acción no se puede deshacer.'),
        confirmLabel: t('Eliminar'),
    });
    if (!confirmed) return;

    router.delete(route('sites.destroy', id), {
        preserveScroll: true,
        onError: (errors) => {
            alert(Object.values(errors)[0] || 'Ocurrió un error al eliminar el registro.');
        },
    });
};

export const createSite = (data: Record<string, unknown>, callbacks: Callbacks) => {
    router.post(route('sites.store'), objectToFormData(data), callbacks);
};

export const updateSite = (id: number, data: Record<string, unknown>, callbacks: Callbacks) => {
    const options = {
        ...data,
        _method: 'PUT',
    };
    router.post(route('sites.update', id), objectToFormData(options), callbacks);
};

export const switchSite = (id: number) => {
    router.post(route('sites.switch', id), {}, { preserveScroll: true });
};

export const switchLanguage = (id: number) => {
    router.post(route('sites.language', id), {}, { preserveScroll: true });
};
