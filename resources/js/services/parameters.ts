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

export const getParameters = (query: Record<string, unknown>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.get(route('parameters.index'), query as any, {
        preserveState: true,
        replace: true,
    });
};

export const deleteParameter = async (id: number) => {
    const confirmed = await confirmDialog({
        title: t('¿Eliminar este parámetro?'),
        description: t('Esta acción no se puede deshacer.'),
        confirmLabel: t('Eliminar'),
    });
    if (!confirmed) return;

    router.delete(route('parameters.destroy', id), {
        preserveScroll: true,
        onSuccess: () => {
            // console.log('Parameter deletion successful:', page);
        },
        onError: (errors) => {
            console.error('Parameter deletion failed:', errors);
            alert('Ocurrió un error al eliminar el registro.');
        },
        onFinish: () => {
            // console.log('Parameter deletion request finished.');
        },
    });
};

export const createParameter = (data: Record<string, unknown>, callbacks: Callbacks) => {
    router.post(route('parameters.store'), objectToFormData(data), callbacks);
};

export const updateParameter = (id: number, data: Record<string, unknown>, callbacks: Callbacks) => {
    const options = {
        ...data,
        _method: 'PUT',
    };
    router.post(route('parameters.update', id), objectToFormData(options), callbacks);
};
