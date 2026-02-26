import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    createElement,
    Renderer,
    TaskAbortError,
} from '../../src';

import type {
    Scene,
} from '../../src';

function createMockScene() {
    const mockContext = {
        clear: vi.fn(),
        markRenderStart: vi.fn(),
        markRenderEnd: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        element: document.createElement('div'),
    };

    const elements: ReturnType<typeof createElement>[] = [];

    const scene = {
        context: mockContext,
        buffer: elements,
        on: vi.fn().mockReturnValue({ dispose: vi.fn() }),
        once: vi.fn().mockReturnValue({ dispose: vi.fn() }),
        emit: vi.fn(),
        add(el: ReturnType<typeof createElement>) {
            elements.push(el);
        },
    } as unknown as Scene;

    return { scene, mockContext };
}

describe('Renderer', () => {

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    test('Should create a renderer', () => {
        const { scene } = createMockScene();
        const renderer = new Renderer(scene, { autoStart: false, autoStop: false });

        expect(renderer).toBeInstanceOf(Renderer);

        renderer.destroy();
    });

    test('Should complete a basic transition', async () => {
        const { scene } = createMockScene();
        const renderer = new Renderer(scene, { autoStart: false, autoStop: false });

        const el = createElement('rect', { globalAlpha: 0 });
        scene.add(el);

        const t = renderer.transition(el, {
            duration: 100,
            state: { globalAlpha: 1 },
        });

        await vi.advanceTimersByTimeAsync(200);
        await t;

        expect(el.globalAlpha).toBeCloseTo(1, 1);

        renderer.destroy();
    });

    test('Should handle transition with delay', async () => {
        const { scene } = createMockScene();
        const renderer = new Renderer(scene, { autoStart: false, autoStop: false });

        const el = createElement('rect', { globalAlpha: 0 });
        scene.add(el);

        let completed = false;

        const t = renderer.transition(el, {
            duration: 100,
            delay: 200,
            state: { globalAlpha: 1 },
        });

        t.then(() => { completed = true; });

        // During delay, element should not have changed significantly
        await vi.advanceTimersByTimeAsync(100);
        expect(completed).toBe(false);

        // After delay + duration, should complete
        await vi.advanceTimersByTimeAsync(250);
        expect(completed).toBe(true);

        await t;

        renderer.destroy();
    });

    test('Should handle transition with reverse direction', async () => {
        const { scene } = createMockScene();
        const renderer = new Renderer(scene, { autoStart: false, autoStop: false });

        const el = createElement('rect', { globalAlpha: 0 });
        scene.add(el);

        const t = renderer.transition(el, {
            duration: 100,
            direction: 'reverse',
            state: { globalAlpha: 1 },
        });

        await vi.advanceTimersByTimeAsync(200);
        await t;

        // With reverse direction, final time=0, so element should stay near initial value
        expect(el.globalAlpha).toBeCloseTo(0, 1);

        renderer.destroy();
    });

    test('Should handle transition with onComplete callback', async () => {
        const { scene } = createMockScene();
        const renderer = new Renderer(scene, { autoStart: false, autoStop: false });

        const el = createElement('rect', { globalAlpha: 0 });
        scene.add(el);

        const onComplete = vi.fn();

        const t = renderer.transition(el, {
            duration: 100,
            state: { globalAlpha: 1 },
            onComplete,
        });

        await vi.advanceTimersByTimeAsync(200);
        await t;

        expect(onComplete).toHaveBeenCalledTimes(1);
        expect(onComplete).toHaveBeenCalledWith(el);

        renderer.destroy();
    });

    test('Should report isBusy during transition', async () => {
        const { scene } = createMockScene();
        const renderer = new Renderer(scene, { autoStart: false, autoStop: false });

        const el = createElement('rect', { globalAlpha: 0 });
        scene.add(el);

        expect(renderer.isBusy).toBe(false);

        const t = renderer.transition(el, {
            duration: 200,
            state: { globalAlpha: 1 },
        });

        // Start the render loop
        await vi.advanceTimersByTimeAsync(50);
        expect(renderer.isBusy).toBe(true);

        await vi.advanceTimersByTimeAsync(300);
        await t;

        expect(renderer.isBusy).toBe(false);

        renderer.destroy();
    });

    test('Should handle multiple elements in one transition', async () => {
        const { scene } = createMockScene();
        const renderer = new Renderer(scene, { autoStart: false, autoStop: false });

        const el1 = createElement('rect', { globalAlpha: 0 });
        const el2 = createElement('rect', { globalAlpha: 0 });
        scene.add(el1);
        scene.add(el2);

        const t = renderer.transition([el1, el2], {
            duration: 100,
            state: { globalAlpha: 1 },
        });

        await vi.advanceTimersByTimeAsync(200);
        await t;

        expect(el1.globalAlpha).toBeCloseTo(1, 1);
        expect(el2.globalAlpha).toBeCloseTo(1, 1);

        renderer.destroy();
    });

    test('Should emit start and stop events', () => {
        const { scene } = createMockScene();
        const renderer = new Renderer(scene, { autoStart: false, autoStop: false });

        const startHandler = vi.fn();
        const stopHandler = vi.fn();

        renderer.on('start', startHandler);
        renderer.on('stop', stopHandler);

        renderer.start();
        expect(startHandler).toHaveBeenCalledTimes(1);

        renderer.stop();
        expect(stopHandler).toHaveBeenCalledTimes(1);

        renderer.destroy();
    });

    test('Should handle abort on transition', async () => {
        const { scene } = createMockScene();
        const renderer = new Renderer(scene, { autoStart: false, autoStop: false });

        const el = createElement('rect', { globalAlpha: 0 });
        scene.add(el);

        const t = renderer.transition(el, {
            duration: 1000,
            state: { globalAlpha: 1 },
        });

        await vi.advanceTimersByTimeAsync(100);

        const rejection = t.catch(error => error);

        t.abort();

        const error = await rejection;
        expect(error).toBeInstanceOf(TaskAbortError);

        renderer.destroy();
    });

    test('Should stop renderer via destroy', () => {
        const { scene } = createMockScene();
        const renderer = new Renderer(scene, { autoStart: true, autoStop: false });

        const stopHandler = vi.fn();
        renderer.on('stop', stopHandler);

        renderer.destroy();
        expect(stopHandler).toHaveBeenCalledTimes(1);
    });

});
