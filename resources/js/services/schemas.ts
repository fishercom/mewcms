import { confirmDialog } from '@/components/confirm-dialog';
import objectToFormData from '@/lib/form-data';
import { t } from '@/lib/i18n';
import { Page } from '@inertiajs/core';
import { router } from '@inertiajs/react';
import apiClient from './api';

interface Callbacks {
    onSuccess?: (page: Page) => void;
    onError?: (errors: Record<string, string>) => void;
    onBefore?: () => boolean;
    onFinish?: () => void;
}

export const getSchemas = (parentSchemaId: number | null = null) => {
    const endpoint = parentSchemaId ? route('schemas.children', parentSchemaId) : route('schemas.root');
    return apiClient.get(endpoint);
};

export const deleteSchema = async (id: number) => {
    const confirmed = await confirmDialog({
        title: t('¿Eliminar este esquema?'),
        description: t('Esta acción no se puede deshacer.'),
        confirmLabel: t('Eliminar'),
    });
    if (!confirmed) return;

    router.delete(route('schemas.destroy', id), {
        preserveScroll: true,
        onError: () => {
            alert('Ocurrió un error al eliminar el registro.');
        },
    });
};

export const createSchema = (data: Record<string, unknown>, callbacks: Callbacks) => {
    router.post(route('schemas.store'), objectToFormData(data), callbacks);
};

export const updateSchema = (id: number, data: Record<string, unknown>, callbacks: Callbacks) => {
    const options = {
        ...data,
        _method: 'PUT',
    };
    router.post(route('schemas.update', id), objectToFormData(options), callbacks);
};
