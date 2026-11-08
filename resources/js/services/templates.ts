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

export const getTemplates = (query: Record<string, unknown>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.get(route('templates.index'), query as any, {
        preserveState: true,
        replace: true,
    });
};

export const deleteTemplate = async (filename: string, errorCallback?: (err: string) => void) => {
    const confirmed = await confirmDialog({
        title: t('¿Eliminar este archivo de plantilla?'),
        description: t('Esta acción no se puede deshacer.'),
        confirmLabel: t('Eliminar'),
    });
    if (!confirmed) return;

    router.delete(route('templates.destroy', filename), {
        preserveScroll: true,
        onError: (errors) => {
            if (errors.error && errorCallback) {
                errorCallback(errors.error);
            } else {
                alert('Ocurrió un error al eliminar la plantilla.');
            }
        },
    });
};

export const createTemplate = (data: Record<string, unknown>, callbacks: Callbacks) => {
    router.post(route('templates.store'), objectToFormData(data), callbacks);
};

export const updateTemplate = (filename: string, data: Record<string, unknown>, callbacks: Callbacks) => {
    const options = {
        ...data,
        _method: 'PUT',
    };
    router.post(route('templates.update', filename), objectToFormData(options), callbacks);
};
