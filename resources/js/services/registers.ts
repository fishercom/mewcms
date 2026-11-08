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

export const getRegisters = (query: Record<string, unknown>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.get(route('registers.index'), query as any, {
        preserveState: true,
        replace: true,
    });
};

export const deleteRegister = async (id: number) => {
    const confirmed = await confirmDialog({
        title: t('¿Eliminar este registro?'),
        description: t('Esta acción no se puede deshacer.'),
        confirmLabel: t('Eliminar'),
    });
    if (!confirmed) return;

    router.delete(route('registers.destroy', id), {
        preserveScroll: true,
        onError: () => {
            alert('Ocurrió un error al eliminar el registro.');
        },
    });
};

export const updateRegister = (id: number, data: Record<string, unknown>, callbacks: Callbacks) => {
    const options = {
        ...data,
        _method: 'PUT',
    };
    router.post(route('registers.update', id), objectToFormData(options), callbacks);
};
