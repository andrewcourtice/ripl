import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    createCircle,
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

    test('Should paint elements added synchronously after the renderer is created', async () => {
        // The playground pattern: scene + renderer + `scene.add(...)` all run synchronously before any
        // frame. The scene rebuffers on a deferred frame, so the renderer must repaint once the buffer
        // is actually populated rather than park on the initial empty frame and never wake. Asserting
        // on the element's own render confirms the populated buffer — not just an empty frame — painted.
        const { scene } = mountScene(0);
        const renderer = createRenderer(scene, {
            autoStart: true,
            autoStop: true,
        });

        const circle = createCircle({
            cx: 10,
            cy: 10,
            radius: 5,
            fill: '#ffffff',
        });
        const renderSpy = vi.spyOn(circle, 'render');

        scene.add(circle);

        await vi.advanceTimersByTimeAsync(200);

        expect(scene.buffer.length).toBe(1);
        expect(renderSpy).toHaveBeenCalled();

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
