import '@fontsource/sora/latin-500.css';
import '@fontsource/sora/latin-700.css';

import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';
import { resolvePage } from './lib/resolve-page';

const appName = import.meta.env.VITE_APP_NAME || 'MewCMS';

createInertiaApp({
    // Public pages end their title with the site's title (Admin → Sites)
    title: (title) => {
        const siteTitle = document.documentElement.dataset.siteTitle || appName;

        return title ? `${title} - ${siteTitle}` : siteTitle;
    },
    // The site's theme is fixed for the whole visit: the server sets it on <html>
    resolve: (name) => resolvePage(name, document.documentElement.dataset.siteTheme),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
