import {
    bench,
    describe,
} from 'vitest';

import {
    mountScene,
} from './_support/fixtures';

/**
 * Full-scene render throughput — the cost of clearing and repainting every element once. This is the
 * baseline the Canvas 2D pipeline work (retained rendering, path/bbox caching, redundant-state
 * elimination, culling) is measured against.
 */
describe('scene render (full repaint)', () => {

    for (const count of [100, 1000, 10000]) {
        const { scene } = mountScene(count);

        bench(`${count} shape elements`, () => {
            scene.render();
        });
    }

    for (const count of [100, 1000]) {
        const { scene } = mountScene(count, {
            textFraction: 1,
        });

        bench(`${count} text elements`, () => {
            scene.render();
        });
    }

});
