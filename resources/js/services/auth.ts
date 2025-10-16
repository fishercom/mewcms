
import { router } from '@inertiajs/react';
import { Page } from '@inertiajs/core';
import objectToFormData from '@/lib/form-data';

interface Callbacks {
    onSuccess?: (page: Page) => void;
    onError?: (errors: Record<string, string>) => void;
    onBefore?: () => boolean;
    onFinish?: () => void;
}

export const sendVerificationEmail = (onStart: () => void, onFinish: () => void) => {
    router.post(route('verification.send'), {}, {
        onStart: onStart,
        onFinish: onFinish,
    });
};

export const updatePassword = (data: Record<string, unknown>, callbacks: Callbacks) => {
    router.put(route('password.update'), objectToFormData(data), callbacks);
};
