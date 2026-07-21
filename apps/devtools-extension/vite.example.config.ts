import path from 'node:path';

import {
    fileURLToPath,
} from 'node:url';

import {
    getRiplAliases,
} from './vite.aliases';

import {
    defineConfig,
} from 'vite';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    root: path.resolve(rootDir, 'example'),
    resolve: {
        alias: getRiplAliases(rootDir),
    },
});
