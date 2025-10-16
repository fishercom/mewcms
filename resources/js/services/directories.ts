
import { router } from '@inertiajs/react';
import { Page } from '@inertiajs/core';
import objectToFormData from '@/lib/form-data';

interface Callbacks {
    onSuccess?: (page: Page) => void;
    onError?: (errors: Record<string, string>) => void;
    onBefore?: () => boolean;
    onFinish?: () => void;
}

export const getDirectories = (query: Record<string, unknown>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.get(route('directories.index'), query as any, {
        preserveState: true,
        replace: true,
    });
};

export const deleteDirectory = (id: number) => {
    router.delete(route('directories.destroy', id), {
        preserveScroll: true,
        onBefore: () => {
            return window.confirm('Esta seguro que desea eliminar este registro?');
        },
        onError: () => {
            alert('Ocurrió un error al eliminar el registro.');
        },
    });
};

export const createDirectory = (data: Record<string, unknown>, callbacks: Callbacks) => {
    router.post(route('directories.store'), objectToFormData(data), callbacks);
};

export const updateDirectory = (id: number, data: Record<string, unknown>, callbacks: Callbacks) => {
    const options = {
        ...data,
        _method: 'PUT',
    };
    router.post(route('directories.update', id), objectToFormData(options), callbacks);
};
