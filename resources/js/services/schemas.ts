
import apiClient from './api';
import { router } from '@inertiajs/react';
import { Page } from '@inertiajs/core';
import objectToFormData from '@/lib/form-data';

interface Callbacks {
    onSuccess?: (page: Page) => void;
    onError?: (errors: Record<string, string>) => void;
    onBefore?: () => boolean;
    onFinish?: () => void;
}

export const getSchemas = (parentSchemaId: number | null = null) => {
    const endpoint = parentSchemaId
        ? route('schemas.children', parentSchemaId)
        : route('schemas.root');
    return apiClient.get(endpoint);
};

export const deleteSchema = (id: number) => {
    router.delete(route('schemas.destroy', id), {
        preserveScroll: true,
        onBefore: () => {
            return window.confirm('Esta seguro que desea eliminar este registro?');
        },
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
