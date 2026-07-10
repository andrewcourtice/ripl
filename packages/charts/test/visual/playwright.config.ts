import {
    fileURLToPath,
} from 'node:url';

import path from 'node:path';

import {
    defineConfig,
} from '@playwright/test';

// The workspace is an ES module ("type": "module"), so `__dirname` is unavailable — derive it.
const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Playwright config for chart visual-regression snapshots.
 *
 * Starts the Vite gallery (which aliases `@ripl/*` to source) and drives a real Chromium. In the
 * managed environment, Chromium is pre-installed at /opt/pw-browsers — set `executablePath` via
 * the CHROMIUM_PATH env var if Playwright's bundled browser is unavailable.
 */
export default defineConfig({
    testDir: dirname,
    testMatch: '**/*.spec.ts',
    snapshotDir: `${dirname}/__snapshots__`,
    use: {
        baseURL: 'http://localhost:5180',
        ...(process.env.CHROMIUM_PATH
            ? { launchOptions: { executablePath: process.env.CHROMIUM_PATH } }
            : {}),
    },
    webServer: {
        command: `npx vite --config ${path.join(dirname, 'vite.config.ts')}`,
        cwd: dirname,
        url: 'http://localhost:5180',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
});
