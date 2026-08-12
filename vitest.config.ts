import path from 'node:path';

import {
    defineConfig,
} from 'vitest/config';

const resolve = (pkg: string) => path.resolve(__dirname, `packages/${pkg}/src/index.ts`);
const resolveAdapter = (adapter: string) => path.resolve(__dirname, `adapters/${adapter}/src/index.ts`);

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
            '@ripl/devtools': resolve('devtools'),
            '@ripl/3d': resolve('3d'),
            '@ripl/webgpu': resolve('webgpu'),
            '@ripl/terminal': resolve('terminal'),
            '@ripl/node': resolve('node'),
            '@ripl/test-utils': resolve('test-utils'),
            '@ripl/vue': resolveAdapter('vue'),
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
            // Playwright visual-regression specs run via their own runner, not vitest.
            '**/test/visual/**',
            // Agent worktrees are full repo checkouts inside the repo; globbing them double-counts every suite.
            '**/.claude/worktrees/**',
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
            // A regression ratchet, set a few points below the current global coverage so genuine
            // drops fail CI without tripping on normal churn. Raise these as coverage improves.
            thresholds: {
                lines: 70,
                statements: 70,
                functions: 62,
                branches: 57,
            },
        },
    },
});