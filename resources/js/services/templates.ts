import { router } from '@inertiajs/react';
import { Page } from '@inertiajs/core';
import objectToFormData from '@/lib/form-data';

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

export const deleteTemplate = (filename: string, errorCallback?: (err: string) => void) => {
    router.delete(route('templates.destroy', filename), {
        preserveScroll: true,
        onBefore: () => {
            return window.confirm('¿Está seguro de que desea eliminar este archivo de plantilla?');
        },
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
