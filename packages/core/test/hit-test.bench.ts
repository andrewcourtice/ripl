import {
    bench,
    describe,
} from 'vitest';

import {
    mountScene,
} from './_support/fixtures';

/**
 * Pointer hit-testing throughput — currently a linear scan that calls `intersectsWith` (native
 * path/stroke tests for shapes) on every interactive element. This is the baseline the future
 * spatial index (quadtree/grid) is measured against.
 */
describe('hit test (linear scan)', () => {

    const centreX = 960;
    const centreY = 540;

    for (const count of [100, 1000, 10000]) {
        const { scene } = mountScene(count, {
            interactive: true,
        });

        // Render once so each shape has a resolved path/context to test against.
        scene.render();

        bench(`${count} interactive elements`, () => {
            for (const element of scene.buffer) {
                element.intersectsWith(centreX, centreY, {
                    isPointer: true,
                });
            }
        });
    }

});
