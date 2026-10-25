import { router } from '@inertiajs/react';

export const getLogs = (query: Record<string, unknown>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.get(route('logs.index'), query as any, {
        preserveState: true,
        replace: true,
    });
};
