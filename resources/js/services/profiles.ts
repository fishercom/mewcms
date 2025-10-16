
import { router } from '@inertiajs/react';
import { Page } from '@inertiajs/core';
import objectToFormData from '@/lib/form-data';

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

export const deleteProfile = (id: number) => {
    router.delete(route('profiles.destroy', id), {
        preserveScroll: true,
        onBefore: () => {
            return window.confirm('Esta seguro que desea eliminar este registro?');
        },
        onError: () => {
            alert('Ocurrió un error al eliminar el registro.');
        },
    });
};

export const createProfile = (data: Record<string, unknown>, callbacks: Callbacks) => {
    router.post(route('profiles.store'), objectToFormData(data), callbacks);
};

export const updateProfile = (id: number, data: Record<string, unknown>, callbacks: Callbacks) => {
    router.put(route('profiles.update', id), objectToFormData(data), callbacks);
};
