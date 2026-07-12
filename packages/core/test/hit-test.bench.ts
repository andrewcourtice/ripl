import {
    bench,
    describe,
} from 'vitest';

import {
    mountScene,
} from './_support/fixtures';

import type {
    RenderElement,
} from '../src';

interface HitTestable {
    hitTest(events: string[], x: number, y: number): RenderElement[];
}

/**
 * Pointer hit-testing throughput via the real `Context.hitTest`, which shortlists candidates through
 * the spatial index before the native path test. With retained rendering a static scene reuses the
 * index across pointer moves, so this measures the common hover case — it should stay roughly flat as
 * the element count grows, rather than scaling linearly like the previous whole-scene scan.
 */
describe('hit test (spatial index)', () => {

    const centreX = 960;
    const centreY = 540;

    for (const count of [100, 1000, 10000, 50000]) {
        const { scene } = mountScene(count, {
            interactive: true,
        });

        // Render once so the buffer's elements are tracked and boxed for the index.
        scene.render();

        const context = scene.context as unknown as HitTestable;

        bench(`${count} interactive elements`, () => {
            context.hitTest(['mousemove'], centreX, centreY);
        });
    }

});
