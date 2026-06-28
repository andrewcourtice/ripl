import {
    expect,
    test,
} from '@playwright/test';

import {
    CHART_IDS,
} from './chart-ids';

test.describe('charts visual regression', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Wait until the gallery signals all charts have been rendered.
        await page.waitForSelector('body[data-ready="true"]');
    });

    for (const chart of CHART_IDS) {
        test(`${chart} chart matches snapshot`, async ({ page }) => {
            const el = page.locator(`[data-chart="${chart}"]`);
            await expect(el).toHaveScreenshot(`${chart}.png`, {
                maxDiffPixelRatio: 0.01,
            });
        });
    }
});
