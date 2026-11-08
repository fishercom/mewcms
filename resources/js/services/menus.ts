import { confirmDialog } from '@/components/confirm-dialog';
import objectToFormData from '@/lib/form-data';
import { t } from '@/lib/i18n';
import { Page } from '@inertiajs/core';
import { router } from '@inertiajs/react';

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

export const deleteMenu = async (id: number) => {
    const confirmed = await confirmDialog({
        title: t('¿Eliminar este menú?'),
        description: t('Esta acción no se puede deshacer.'),
        confirmLabel: t('Eliminar'),
    });
    if (!confirmed) return;

    router.delete(route('menus.destroy', id), {
        preserveScroll: true,
        onError: () => {
            alert('Ocurrió un error al eliminar el menú.');
        },
    });
};

// Menu Items CRUD
export const createMenuItem = (menuId: number, data: Record<string, unknown>, callbacks: Callbacks) => {
    router.post(route('menus.items.store', menuId), objectToFormData(data), callbacks);
};

export const deleteMenuItem = async (id: number) => {
    const confirmed = await confirmDialog({
        title: t('¿Eliminar este ítem del menú?'),
        description: t('Esta acción no se puede deshacer.'),
        confirmLabel: t('Eliminar'),
    });
    if (!confirmed) return;

    router.delete(route('menus.items.destroy', id), {
        preserveScroll: true,
        onError: () => {
            alert('Ocurrió un error al eliminar el ítem.');
        },
    });
};
