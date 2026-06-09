import { router } from '@inertiajs/react';
import { Page } from '@inertiajs/core';
import objectToFormData from '@/lib/form-data';

interface Callbacks {
    onSuccess?: (page: Page) => void;
    onError?: (errors: Record<string, string>) => void;
    onBefore?: () => boolean;
    onFinish?: () => void;
}

export const getTaxonomies = (query: Record<string, unknown>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.get(route('taxonomies.index'), query as any, {
        preserveState: true,
        replace: true,
    });
};

export const deleteTaxonomy = (id: number) => {
    router.delete(route('taxonomies.destroy', id), {
        preserveScroll: true,
        onBefore: () => {
            return window.confirm('¿Está seguro que desea eliminar este registro?');
        },
        onError: () => {
            alert('Ocurrió un error al eliminar el registro.');
        },
    });
};

export const createTaxonomy = (data: Record<string, unknown>, callbacks: Callbacks) => {
    router.post(route('taxonomies.store'), objectToFormData(data), callbacks);
};

export const updateTaxonomy = (id: number, data: Record<string, unknown>, callbacks: Callbacks) => {
    const options = {
        ...data,
        _method: 'PUT',
    };
    router.post(route('taxonomies.update', id), objectToFormData(options), callbacks);
};

// Term Services
export const getTerms = (taxonomyId: number, query: Record<string, unknown>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.get(route('taxonomies.terms.index', taxonomyId), query as any, {
        preserveState: true,
        replace: true,
    });
};

export const deleteTerm = (id: number) => {
    router.delete(route('taxonomies.terms.destroy', id), {
        preserveScroll: true,
        onBefore: () => {
            return window.confirm('¿Está seguro que desea eliminar este registro?');
        },
        onError: () => {
            alert('Ocurrió un error al eliminar el registro.');
        },
    });
};

export const createTerm = (taxonomyId: number, data: Record<string, unknown>, callbacks: Callbacks) => {
    router.post(route('taxonomies.terms.store', taxonomyId), objectToFormData(data), callbacks);
};

export const updateTerm = (id: number, data: Record<string, unknown>, callbacks: Callbacks) => {
    const options = {
        ...data,
        _method: 'PUT',
    };
    router.post(route('taxonomies.terms.update', id), objectToFormData(options), callbacks);
};
