import path from 'node:path';

import {
    fileURLToPath,
} from 'node:url';

import {
    defineConfig,
} from 'vite';

// The workspace is an ES module ("type": "module"), so `__dirname` is unavailable — derive it.
const dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dirname, '../../../..');
const resolve = (pkg: string) => path.resolve(root, `packages/${pkg}/src/index.ts`);

/** Serves the visual gallery with `@ripl/*` aliased to source so no build step is required. */
export default defineConfig({
    root: dirname,
    resolve: {
        // Alias every `@ripl/*` package to source so the gallery (and its transitive imports,
        // e.g. canvas -> @ripl/dom) resolve without a build step.
        alias: {
            '@ripl/utilities': resolve('utilities'),
            '@ripl/dom': resolve('dom'),
            '@ripl/canvas': resolve('canvas'),
            '@ripl/core': resolve('core'),
            '@ripl/svg': resolve('svg'),
            '@ripl/web': resolve('web'),
            '@ripl/charts': resolve('charts'),
        },
    },
    server: {
        port: 5180,
    },
});
