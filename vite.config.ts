import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Every theme in resources/themes/<name> ships its own stylesheet, built in the same bundle.
// A theme kept in its own repository is linked (or copied) into resources/themes/<name>.
const themeStyles = readdirSync('resources/themes')
    .filter((name) => existsSync(`resources/themes/${name}/css/theme.css`))
    .map((name) => `resources/themes/${name}/css/theme.css`);

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx', ...themeStyles],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    ssr: {
        // Bundle dependencies into the SSR build so production only needs Node, not node_modules
        noExternal: true,
    },
    esbuild: {
        jsx: 'automatic',
    },
    resolve: {
        // A linked theme resolves its imports (../../default, react...) from resources/themes,
        // not from the folder of its own repository
        preserveSymlinks: true,
        alias: {
            'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
        },
    },
});
