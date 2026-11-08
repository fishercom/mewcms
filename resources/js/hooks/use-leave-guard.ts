import { confirmDialog, type ConfirmOptions } from '@/components/confirm-dialog';
import { router } from '@inertiajs/react';
import { useEffect, useRef } from 'react';

/**
 * While `active`, ask before leaving the page: the browser's own prompt on close/reload,
 * and the admin's confirmation dialog for in-app navigation.
 *
 * Only real page changes ask. Link prefetches (fired on hover), partial reloads and
 * background requests of the page itself go through untouched; asking on those is what
 * made the old prompt pop up again and again without letting the user leave.
 */
export function useLeaveGuard(active: boolean, options: ConfirmOptions) {
    const optionsRef = useRef(options);
    optionsRef.current = options;

    useEffect(() => {
        if (!active) return;

        const onBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = '';
        };
        window.addEventListener('beforeunload', onBeforeUnload);

        let leaving = false;
        const removeGuard = router.on('before', (event) => {
            const visit = event.detail.visit;
            const navigates = visit.method === 'get' && !visit.prefetch && !visit.async && visit.only.length === 0 && visit.except.length === 0;
            if (leaving || !navigates) return;

            // The dialog is asynchronous: stop this visit and repeat it once the user agrees
            event.preventDefault();
            confirmDialog({ tone: 'warning', ...optionsRef.current }).then((confirmed) => {
                if (!confirmed) return;
                leaving = true;
                window.removeEventListener('beforeunload', onBeforeUnload);
                router.visit(visit.url, {
                    method: visit.method,
                    data: visit.data,
                    replace: visit.replace,
                    preserveScroll: visit.preserveScroll,
                    preserveState: visit.preserveState,
                    headers: visit.headers,
                });
            });
        });

        return () => {
            window.removeEventListener('beforeunload', onBeforeUnload);
            removeGuard();
        };
    }, [active]);
}
