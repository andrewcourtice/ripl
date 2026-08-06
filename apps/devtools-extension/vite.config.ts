import path from 'node:path';

import {
    fileURLToPath,
} from 'node:url';

import manifest from './manifest.config';

import {
    getRiplAliases,
} from './vite.aliases';

import {
    crx,
} from '@crxjs/vite-plugin';

import vue from '@vitejs/plugin-vue';

import {
    defineConfig,
} from 'vite';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    plugins: [
        vue(),
        crx({
            manifest,
        }),
    ],
    resolve: {
        alias: getRiplAliases(rootDir),
    },
    build: {
        // Every asset is a local chrome-extension:// resource, so preloading saves no round trip,
        // and Vite stamps `crossorigin` on the tags, which Chrome cannot match to the module fetch
        // on an extension page. Off also drops the polyfill, which no-ops on Chrome.
        modulePreload: false,
        rollupOptions: {
            input: {
                // The panel page is loaded by the devtools page at runtime and is not
                // referenced from the manifest, so it must be registered explicitly.
                panel: path.resolve(rootDir, 'src/panel/index.html'),
            },
        },
    },
});
