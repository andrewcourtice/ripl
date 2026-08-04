import {
    expect,
    test,
} from '@playwright/test';

import {
    HIT_BACKENDS,
    HIT_SCENES,
} from './hit-ids';

test.describe('canvas ↔ svg hit testing', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/hit.html');
        // Wait until the harness signals every scene has rendered through both backends.
        await page.waitForSelector('body[data-ready="true"]');
        await page.evaluate(() => window.riplHit.reset());
    });

    for (const scene of HIT_SCENES) {
        test(`${scene.description} is hit at the same point on both backends`, async ({ page }) => {
            for (const backend of HIT_BACKENDS) {
                const box = await page.locator(`[data-hit="${scene.id}"][data-backend="${backend}"]`).boundingBox();

                expect(box, `${backend} surface is not laid out`).not.toBeNull();

                await page.mouse.click(box!.x + scene.point[0], box!.y + scene.point[1]);
            }

            const records = await page.evaluate(() => window.riplHit.records);

            // Asserted per backend rather than as a set: canvas passing is what proves the click point is valid.
            for (const backend of HIT_BACKENDS) {
                expect(
                    records.filter(record => record.backend === backend).map(record => record.target),
                    `${backend} did not deliver the click to ${scene.target}`
                ).toEqual([scene.target]);
            }
        });
    }
});
