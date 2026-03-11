import path from 'node:path';

import {
    defineConfig,
} from 'vitest/config';

const resolve = (pkg: string) => path.resolve(__dirname, `packages/${pkg}/src/index.ts`);

export default defineConfig({
    resolve: {
        alias: {
            '@ripl/utilities': resolve('utilities'),
            '@ripl/vdom': resolve('vdom'),
            '@ripl/core': resolve('core'),
            '@ripl/svg': resolve('svg'),
            '@ripl/charts': resolve('charts'),
            '@ripl/3d': resolve('3d'),
        },
    },
    test: {
        watch: false,
        environment: 'jsdom',
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/_media/**',
        ],
        outputFile: './.reports/test-results.xml',
        reporters: [
            'verbose',
            'junit',
        ],
        coverage: {
            enabled: true,
            provider: 'v8',
            reportsDirectory: './.reports/coverage',
            reporter: [
                'text-summary',
                'json-summary',
                'json',
            ],
        },
    },
});