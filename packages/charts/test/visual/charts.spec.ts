import {
    expect,
    test,
} from '@playwright/test';

/** Charts rendered in the gallery; each is snapshotted individually. */
const CHARTS = ['bar', 'line', 'area', 'scatter', 'pie'];

test.describe('charts visual regression', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Wait until the gallery signals all charts have been rendered.
        await page.waitForSelector('body[data-ready="true"]');
    });

    for (const chart of CHARTS) {
        test(`${chart} chart matches snapshot`, async ({ page }) => {
            const el = page.locator(`[data-chart="${chart}"]`);
            await expect(el).toHaveScreenshot(`${chart}.png`, {
                maxDiffPixelRatio: 0.01,
            });
        });
    }
});
