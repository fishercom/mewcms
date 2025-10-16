
import { router } from '@inertiajs/react';
import { Page } from '@inertiajs/core';

interface Callbacks {
    onSuccess?: (page: Page) => void;
    onError?: (errors: Record<string, string>) => void;
    onBefore?: () => boolean;
    onFinish?: () => void;
}

function objectToFormData(obj: Record<string, unknown>, form?: FormData, namespace?: string): FormData {
    const fd = form || new FormData();
    let formKey: string;

    for (const property in obj) {
        if (obj.hasOwnProperty(property)) {
            if (namespace) {
                formKey = namespace + '[' + property + ']';
            } else {
                formKey = property;
            }

            // if the property is an object, but not a File, use recursivity.
            if (typeof obj[property] === 'object' && !(obj[property] instanceof File)) {
                objectToFormData(obj[property] as Record<string, unknown>, fd, formKey);
            } else {
                // if it's a string or a File object
                fd.append(formKey, obj[property] as string | Blob);
            }
        }
    }

    return fd;
}

export const getNotifies = (query: Record<string, unknown>) => {
    router.get(route('notifies.index'), query as any, {
        preserveState: true,
        replace: true,
    });
};

export const deleteNotify = (id: number) => {
    router.delete(route('notifies.destroy', id), {
        preserveScroll: true,
        onBefore: () => {
            return window.confirm('Esta seguro que desea eliminar este registro?');
        },
        onError: () => {
            alert('Ocurrió un error al eliminar el registro.');
        },
    });
};

export const createNotify = (data: Record<string, unknown>, callbacks: Callbacks) => {
    router.post(route('notifies.store'), objectToFormData(data), callbacks);
};

export const updateNotify = (id: number, data: Record<string, unknown>, callbacks: Callbacks) => {
    router.put(route('notifies.update', id), objectToFormData(data), callbacks);
};
