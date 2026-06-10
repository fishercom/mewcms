import { router } from '@inertiajs/react';
import { Page } from '@inertiajs/core';
import objectToFormData from '@/lib/form-data';

interface Callbacks {
    onSuccess?: (page: Page) => void;
    onError?: (errors: Record<string, string>) => void;
    onBefore?: () => boolean;
    onFinish?: () => void;
}

export const getMenus = (query: Record<string, unknown>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.get(route('menus.index'), query as any, {
        preserveState: true,
        replace: true,
    });
};

export const createMenu = (data: Record<string, unknown>, callbacks: Callbacks) => {
    router.post(route('menus.store'), objectToFormData(data), callbacks);
};

export const updateMenu = (id: number, data: Record<string, unknown>, callbacks: Callbacks) => {
    const options = {
        ...data,
        _method: 'PUT',
    };
    router.post(route('menus.update', id), objectToFormData(options), callbacks);
};

export const deleteMenu = (id: number) => {
    router.delete(route('menus.destroy', id), {
        preserveScroll: true,
        onBefore: () => {
            return window.confirm('¿Está seguro que desea eliminar este menú?');
        },
        onError: () => {
            alert('Ocurrió un error al eliminar el menú.');
        },
    });
};

// Menu Items CRUD
export const createMenuItem = (menuId: number, data: Record<string, unknown>, callbacks: Callbacks) => {
    router.post(route('menus.items.store', menuId), objectToFormData(data), callbacks);
};

export const deleteMenuItem = (id: number) => {
    router.delete(route('menus.items.destroy', id), {
        preserveScroll: true,
        onBefore: () => {
            return window.confirm('¿Está seguro que desea eliminar este ítem de menú?');
        },
        onError: () => {
            alert('Ocurrió un error al eliminar el ítem.');
        },
    });
};
