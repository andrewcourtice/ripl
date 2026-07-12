import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    createRenderer,
} from '../../src';

import {
    mountScene,
} from '../_support/fixtures';

/**
 * Retained-rendering behaviour: the loop must paint when something changes and then park itself when
 * the scene is static, rather than clearing and repainting every frame forever. `context.batch` is
 * invoked exactly once per painted frame, so spying on it counts redraws.
 */
describe('Renderer idle pausing', () => {

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    test('Should stop repainting once the scene is static', async () => {
        const { scene } = mountScene(5);
        const batchSpy = vi.spyOn(scene.context, 'batch');
        const renderer = createRenderer(scene, {
            autoStart: true,
            autoStop: true,
        });

        await vi.advanceTimersByTimeAsync(100);
        const paintedInitially = batchSpy.mock.calls.length;

        expect(paintedInitially).toBeGreaterThan(0);

        // Nothing changed: no further redraws over the next second.
        await vi.advanceTimersByTimeAsync(1000);

        expect(batchSpy.mock.calls.length).toBe(paintedInitially);

        renderer.destroy();
    });

    test('Should repaint after an element state change', async () => {
        const { scene } = mountScene(5);
        const renderer = createRenderer(scene, {
            autoStart: true,
            autoStop: true,
        });

        // Let the initial frame settle and the loop park.
        await vi.advanceTimersByTimeAsync(200);

        const batchSpy = vi.spyOn(scene.context, 'batch');

        scene.buffer[0].fill = '#abcdef';
        await vi.advanceTimersByTimeAsync(50);

        expect(batchSpy.mock.calls.length).toBeGreaterThan(0);

        renderer.destroy();
    });

    test('Should keep ticking while an external tick listener is attached', async () => {
        const { scene } = mountScene(3);
        const renderer = createRenderer(scene, {
            autoStart: true,
            autoStop: true,
        });

        const onTick = vi.fn();
        renderer.on('tick', onTick);

        await vi.advanceTimersByTimeAsync(200);

        // A per-frame driver must keep receiving ticks even when nothing is animating.
        expect(onTick.mock.calls.length).toBeGreaterThan(3);

        renderer.destroy();
    });

});
