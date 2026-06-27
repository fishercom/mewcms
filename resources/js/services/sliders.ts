import { router } from '@inertiajs/react';
import { Page } from '@inertiajs/core';

interface Callbacks {
    onSuccess?: (page: Page) => void;
    onError?: (errors: Record<string, string>) => void;
    onBefore?: () => boolean;
    onFinish?: () => void;
}

export const createSlider = (data: Record<string, unknown>, callbacks: Callbacks) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.post(route('sliders.store'), data as any, callbacks);
};

export const updateSlider = (id: number, data: Record<string, unknown>, callbacks: Callbacks) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.put(route('sliders.update', id), data as any, callbacks);
};
