import path from 'node:path';

import {
    defineConfig,
} from 'vite';

const root = path.resolve(__dirname, '../../../..');
const resolve = (pkg: string) => path.resolve(root, `packages/${pkg}/src/index.ts`);

/** Serves the visual gallery with `@ripl/*` aliased to source so no build step is required. */
export default defineConfig({
    root: __dirname,
    resolve: {
        alias: {
            '@ripl/utilities': resolve('utilities'),
            '@ripl/canvas': resolve('canvas'),
            '@ripl/core': resolve('core'),
            '@ripl/charts': resolve('charts'),
        },
    },
    server: {
        port: 5180,
    },
});
