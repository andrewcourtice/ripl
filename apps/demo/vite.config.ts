import sveltePreprocess from 'svelte-preprocess';

import {
    svelte,
} from '@sveltejs/vite-plugin-svelte';

import {
    defineConfig,
} from 'vite';

export default defineConfig({
    server: {
        port: 6565,
    },
    json: {
        stringify: true,
    },
    preview: {
        port: 6565,
    },
    build: {
        sourcemap: 'hidden',
        commonjsOptions: {
            esmExternals: true,
        },
    },
    plugins: [
        svelte({
            preprocess: [
                sveltePreprocess({
                    typescript: true,
                    scss: true,
                }),
            ],
        }),
    ],
});