import { cn } from '@/lib/utils';
import { usePage } from '@inertiajs/react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface BlockPreviewStyles {
    theme: string;
    styles: string[];
}

/** Width the site is drawn at before it is scaled down to the editor's column */
const SITE_WIDTH = 1024;

/**
 * Draws its content as the public site does: in a frame with the site's theme stylesheets
 * (apart from the admin's), at a desktop width scaled down to fit. Clicks go through to
 * whatever is under it. Without the stylesheets (assets not built), the content is drawn as is.
 */
export default function ThemeFrame({ children, className }: { children: ReactNode; className?: string }) {
    const preview = usePage<{ block_preview?: BlockPreviewStyles | null }>().props.block_preview;
    const frame = useRef<HTMLIFrameElement>(null);
    const box = useRef<HTMLDivElement>(null);
    const [root, setRoot] = useState<HTMLElement | null>(null);
    const [height, setHeight] = useState(0);
    const [scale, setScale] = useState(1);
    const styles = preview?.styles.join('\n') ?? '';

    useEffect(() => {
        const doc = frame.current?.contentDocument;
        if (!preview || !doc) return;
        doc.open();
        doc.write('<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>');
        doc.close();
        doc.documentElement.dataset.siteTheme = preview.theme;
        for (const href of styles.split('\n')) {
            const link = doc.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            doc.head.appendChild(link);
        }
        const base = doc.createElement('style');
        base.textContent = 'html,body{margin:0;overflow:hidden;background:transparent}';
        doc.head.appendChild(base);
        const element = doc.createElement('div');
        element.className = 'front-theme';
        doc.body.appendChild(element);
        const observer = new ResizeObserver(() => setHeight(element.scrollHeight));
        observer.observe(element);
        setRoot(element);
        return () => {
            observer.disconnect();
            setRoot(null);
        };
        // The frame is set up again only when the site's stylesheets change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [preview?.theme, styles]);

    useEffect(() => {
        const element = box.current;
        if (!element) return;
        const observer = new ResizeObserver(() => setScale(Math.min(1, element.clientWidth / SITE_WIDTH)));
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    if (!preview) {
        return <>{children}</>;
    }

    return (
        <div ref={box} className={cn('relative w-full overflow-hidden', className)} style={{ height: height * scale }}>
            <iframe
                ref={frame}
                title=""
                tabIndex={-1}
                aria-hidden="true"
                className="pointer-events-none absolute top-0 left-0 origin-top-left border-0"
                style={{ width: SITE_WIDTH, height, transform: `scale(${scale})` }}
            />
            {root && createPortal(children, root)}
        </div>
    );
}
