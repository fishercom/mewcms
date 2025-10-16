
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
            if (Object.prototype.hasOwnProperty.call(obj, property)) {
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

export const getParameters = (query: Record<string, unknown>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.get(route('parameters.index'), query as any, {
        preserveState: true,
        replace: true,
    });
};

export const deleteParameter = (id: number) => {
    router.delete(route('parameters.destroy', id), {
        preserveScroll: true,
        onBefore: () => {
            return window.confirm('Esta seguro que desea eliminar este registro?');
        },
        onError: () => {
            alert('Ocurrió un error al eliminar el registro.');
        },
    });
};

export const createParameter = (data: Record<string, unknown>, callbacks: Callbacks) => {
    router.post(route('parameters.store'), objectToFormData(data), callbacks);
};

export const updateParameter = (id: number, data: Record<string, unknown>, callbacks: Callbacks) => {
    router.put(route('parameters.update', id), objectToFormData(data), callbacks);
};
