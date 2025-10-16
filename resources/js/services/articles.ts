
import { router } from '@inertiajs/react';
import { Page } from '@inertiajs/core';
import objectToFormData from '@/lib/form-data';

interface Callbacks {
    onSuccess?: (page: Page) => void;
    onError?: (errors: Record<string, string>) => void;
    onBefore?: () => boolean;
    onFinish?: () => void;
}

export const getArticles = (query: Record<string, unknown>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.get(route('articles.index'), query as any, {
        preserveState: true,
        replace: true,
    });
};

export const deleteArticle = (id: number) => {
    router.delete(route('articles.destroy', id), {
        preserveScroll: true,
        onBefore: () => {
            return window.confirm('Esta seguro que desea eliminar este registro?');
        },
        onError: () => {
            alert('Ocurrió un error al eliminar el registro.');
        },
    });
};

export const createArticle = (data: Record<string, unknown>, callbacks: Callbacks) => {
    router.post(route('articles.store'), objectToFormData(data), callbacks);
};

export const updateArticle = (id: number, data: Record<string, unknown>, callbacks: Callbacks) => {
    router.put(route('articles.update', id), objectToFormData(data), callbacks);
};
