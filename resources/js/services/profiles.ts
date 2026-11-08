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

export const getProfiles = (query: Record<string, unknown>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.get(route('profiles.index'), query as any, {
        preserveState: true,
        replace: true,
    });
};

export const deleteProfile = async (id: number) => {
    const confirmed = await confirmDialog({
        title: t('¿Eliminar este perfil?'),
        description: t('Esta acción no se puede deshacer.'),
        confirmLabel: t('Eliminar'),
    });
    if (!confirmed) return;

    router.delete(route('profiles.destroy', id), {
        preserveScroll: true,
        onError: () => {
            alert('Ocurrió un error al eliminar el registro.');
        },
    });
};

export const createProfile = (data: Record<string, unknown>, callbacks: Callbacks) => {
    router.post(route('profiles.store'), objectToFormData(data), callbacks);
};

export const updateProfile = (id: number, data: Record<string, unknown>, callbacks: Callbacks) => {
    const options = {
        ...data,
        _method: 'PUT',
    };
    router.post(route('profiles.update', id), objectToFormData(options), callbacks);
};
