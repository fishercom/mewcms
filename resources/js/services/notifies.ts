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

export const getNotifies = (query: Record<string, unknown>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.get(route('notifies.index'), query as any, {
        preserveState: true,
        replace: true,
    });
};

export const deleteNotify = async (id: number) => {
    const confirmed = await confirmDialog({
        title: t('¿Eliminar esta notificación?'),
        description: t('Esta acción no se puede deshacer.'),
        confirmLabel: t('Eliminar'),
    });
    if (!confirmed) return;

    router.delete(route('notifies.destroy', id), {
        preserveScroll: true,
        onError: () => {
            alert('Ocurrió un error al eliminar el registro.');
        },
    });
};

export const createNotify = (data: Record<string, unknown>, callbacks: Callbacks) => {
    router.post(route('notifies.store'), objectToFormData(data), callbacks);
};

export const updateNotify = (id: number, data: Record<string, unknown>, callbacks: Callbacks) => {
    const options = {
        ...data,
        _method: 'PUT',
    };
    router.post(route('notifies.update', id), objectToFormData(options), callbacks);
};
