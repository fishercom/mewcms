
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

export const getTranslates = (query: Record<string, unknown>) => {
    router.get(route('translates.index'), query as any, {
        preserveState: true,
        replace: true,
    });
};

export const deleteTranslate = (id: number) => {
    router.delete(route('translates.destroy', id), {
        preserveScroll: true,
        onBefore: () => {
            return window.confirm('Esta seguro que desea eliminar este registro?');
        },
        onError: () => {
            alert('Ocurrió un error al eliminar el registro.');
        },
    });
};

export const createTranslate = (data: Record<string, unknown>, callbacks: Callbacks) => {
    router.post(route('translates.store'), objectToFormData(data), callbacks);
};

export const updateTranslate = (id: number, data: Record<string, unknown>, callbacks: Callbacks) => {
    router.put(route('translates.update', id), objectToFormData(data), callbacks);
};
