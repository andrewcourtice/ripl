import {
    expect,
    test,
} from '@playwright/test';

import type {
    Page,
} from '@playwright/test';

import {
    KNOWN_DIVERGENCE_SCENES,
    PARITY_HEIGHT,
    PARITY_SCENE_IDS,
    PARITY_WIDTH,
} from './parity-ids';

import type {
    ParitySceneId,
} from './parity-ids';

/** Per-channel difference a pixel may vary by before it counts as a mismatch; the two backends measure at 1. */
const TOLERANCE = 4;

/** Fraction of pixels allowed to exceed {@link TOLERANCE}. Both seeded divergences move a quarter of the frame or more. */
const MAX_MISMATCH = 0.001;

async function measure(page: Page, scene: ParitySceneId) {
    const canvas = await page.locator(`[data-parity="${scene}"][data-backend="canvas"]`).screenshot();
    const svg = await page.locator(`[data-parity="${scene}"][data-backend="svg"]`).screenshot();

    return page.evaluate(
        ([left, right, tolerance]) => window.riplParity.diff(left as string, right as string, tolerance as number),
        [canvas.toString('base64'), svg.toString('base64'), TOLERANCE] as const
    );
}

test.beforeEach(async ({ page }) => {
    await page.goto('/parity.html');
    // Wait until the harness signals every scene has rendered through both backends.
    await page.waitForSelector('body[data-ready="true"]');
});

test.describe('canvas ↔ svg parity', () => {
    for (const scene of PARITY_SCENE_IDS) {
        test(`${scene} renders identically on canvas and svg`, async ({ page }) => {
            const result = await measure(page, scene);

            expect(result.width).toBe(PARITY_WIDTH);
            expect(result.height).toBe(PARITY_HEIGHT);
            expect(result.mismatch).toBeLessThanOrEqual(MAX_MISMATCH);
        });
    }
});

test.describe('canvas ↔ svg known divergences', () => {
    for (const scene of KNOWN_DIVERGENCE_SCENES) {
        // Asserted from both sides: below the band is a fix nobody recorded, above it is a regression.
        test(`${scene.id} diverges within its recorded band`, async ({ page }) => {
            const result = await measure(page, scene.id);

            expect(result.width).toBe(PARITY_WIDTH);
            expect(result.height).toBe(PARITY_HEIGHT);
            expect(result.mismatch).toBeGreaterThan(MAX_MISMATCH);
            expect(result.mismatch).toBeLessThanOrEqual(scene.maxMismatch);
        });
    }
});
