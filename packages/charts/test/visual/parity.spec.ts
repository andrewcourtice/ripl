import {
    expect,
    test,
} from '@playwright/test';

import {
    PARITY_HEIGHT,
    PARITY_SCENE_IDS,
    PARITY_WIDTH,
} from './parity-ids';

/** Per-channel difference a pixel may vary by before it counts as a mismatch; the two backends measure at 1. */
const TOLERANCE = 4;

/** Fraction of pixels allowed to exceed {@link TOLERANCE}. Both seeded divergences move a quarter of the frame or more. */
const MAX_MISMATCH = 0.001;

test.describe('canvas ↔ svg parity', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/parity.html');
        // Wait until the harness signals every scene has rendered through both backends.
        await page.waitForSelector('body[data-ready="true"]');
    });

    for (const scene of PARITY_SCENE_IDS) {
        test(`${scene} renders identically on canvas and svg`, async ({ page }) => {
            const canvas = await page.locator(`[data-parity="${scene}"][data-backend="canvas"]`).screenshot();
            const svg = await page.locator(`[data-parity="${scene}"][data-backend="svg"]`).screenshot();

            const result = await page.evaluate(
                ([left, right, tolerance]) => window.riplParity.diff(left as string, right as string, tolerance as number),
                [canvas.toString('base64'), svg.toString('base64'), TOLERANCE] as const
            );

            expect(result.width).toBe(PARITY_WIDTH);
            expect(result.height).toBe(PARITY_HEIGHT);
            expect(result.mismatch).toBeLessThanOrEqual(MAX_MISMATCH);
        });
    }
});
