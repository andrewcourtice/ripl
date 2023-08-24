import {
    defineConfig,
} from 'vitest/config';

export default defineConfig({
    test: {
        watch: false,
        environment: 'jsdom',
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
            ],
        },
    },
});