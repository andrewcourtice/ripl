import path from 'node:path';

import {
    defineConfig,
} from 'vitest/config';

const resolve = (pkg: string) => path.resolve(__dirname, `packages/${pkg}/src/index.ts`);

export default defineConfig({
    resolve: {
        alias: {
            '@ripl/utilities': resolve('utilities'),
            '@ripl/dom': resolve('dom'),
            '@ripl/canvas': resolve('canvas'),
            '@ripl/core': resolve('core'),
            '@ripl/svg': resolve('svg'),
            '@ripl/web': resolve('web'),
            '@ripl/charts': resolve('charts'),
            '@ripl/3d': resolve('3d'),
            '@ripl/webgpu': resolve('webgpu'),
            '@ripl/terminal': resolve('terminal'),
            '@ripl/node': resolve('node'),
            '@ripl/test-utils': resolve('test-utils'),
        },
    },
    test: {
        watch: false,
        environment: 'jsdom',
        setupFiles: ['./vitest.setup.ts'],
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