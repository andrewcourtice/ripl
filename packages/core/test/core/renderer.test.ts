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
    createGroup,
    isGroup,
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
        pushGroup: vi.fn(),
        popGroup: vi.fn(),
        batch: vi.fn((fn: () => unknown) => fn()),
        layer: vi.fn((fn: () => unknown) => fn()),
        element: document.createElement('div'),
    };

    const elements: ReturnType<typeof createElement>[] = [];

    const scene = {
        context: mockContext,
        buffer: elements,
        // Groups bracket their subtree with push/pop; leaves are bare draw instructions.
        get instructions() {
            return elements.flatMap(element => isGroup(element)
                ? [{
                    type: 'push' as const,
                    element,
                }, {
                    type: 'pop' as const,
                    element,
                }]
                : [{
                    type: 'draw' as const,
                    element,
                }]);
        },
        on: vi.fn().mockReturnValue({ dispose: vi.fn() }),
        once: vi.fn().mockReturnValue({ dispose: vi.fn() }),
        emit: vi.fn(),
        add(el: ReturnType<typeof createElement>) {
            elements.push(el);
        },
        $reset: vi.fn(),
    } as unknown as Scene;

    return {
        scene,
        mockContext,
    };
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
        const renderer = new Renderer(scene, {
            autoStart: false,
            autoStop: false,
        });

        expect(renderer).toBeInstanceOf(Renderer);

        renderer.destroy();
    });

    test('Should expose resolved debug options', () => {
        const { scene } = createMockScene();
        const renderer = new Renderer(scene, {
            autoStart: false,
            autoStop: false,
            debug: {
                fps: true,
            },
        });

        expect(renderer.debug).toEqual({
            fps: true,
            elementCount: false,
            boundingBoxes: false,
        });

        renderer.destroy();
    });

    test('Should apply runtime debug option changes', () => {
        const { scene } = createMockScene();
        const renderer = new Renderer(scene, {
            autoStart: false,
            autoStop: false,
        });

        renderer.debug = true;
        expect(renderer.debug).toEqual({
            fps: true,
            elementCount: true,
            boundingBoxes: true,
        });

        renderer.debug = {
            elementCount: true,
        };
        expect(renderer.debug).toEqual({
            fps: false,
            elementCount: true,
            boundingBoxes: false,
        });

        renderer.debug = false;
        expect(renderer.debug).toEqual({
            fps: false,
            elementCount: false,
            boundingBoxes: false,
        });

        renderer.destroy();
    });

    test('Should complete a basic transition', async () => {
        const { scene } = createMockScene();
        const renderer = new Renderer(scene, {
            autoStart: false,
            autoStop: false,
        });

        const el = createElement('rect', { opacity: 0 });
        scene.add(el);

        const t = renderer.transition(el, {
            duration: 100,
            state: { opacity: 1 },
        });

        await vi.advanceTimersByTimeAsync(200);
        await t;

        expect(el.opacity).toBeCloseTo(1, 1);

        renderer.destroy();
    });

    test('Should reset element flags after each rendered tick', async () => {
        const { scene } = createMockScene();
        const renderer = new Renderer(scene, {
            autoStart: false,
            autoStop: false,
        });

        const el = createElement('rect', { opacity: 0 });
        scene.add(el);

        const t = renderer.transition(el, {
            duration: 100,
            state: { opacity: 1 },
        });

        await vi.advanceTimersByTimeAsync(200);
        await t;

        // The renderer resets the scene root each tick; leaves self-reset in Element.render.
        expect(scene.$reset).toHaveBeenCalled();

        renderer.destroy();
    });

    test('Should handle transition with delay', async () => {
        const { scene } = createMockScene();
        const renderer = new Renderer(scene, {
            autoStart: false,
            autoStop: false,
        });

        const el = createElement('rect', { opacity: 0 });
        scene.add(el);

        let completed = false;

        const t = renderer.transition(el, {
            duration: 100,
            delay: 200,
            state: { opacity: 1 },
        });

        t.then(() => {
            completed = true;
        });

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
        const renderer = new Renderer(scene, {
            autoStart: false,
            autoStop: false,
        });

        const el = createElement('rect', { opacity: 0 });
        scene.add(el);

        const t = renderer.transition(el, {
            duration: 100,
            direction: 'reverse',
            state: { opacity: 1 },
        });

        await vi.advanceTimersByTimeAsync(200);
        await t;

        // With reverse direction, final time=0, so element should stay near initial value
        expect(el.opacity).toBeCloseTo(0, 1);

        renderer.destroy();
    });

    test('Should handle transition with onComplete callback', async () => {
        const { scene } = createMockScene();
        const renderer = new Renderer(scene, {
            autoStart: false,
            autoStop: false,
        });

        const el = createElement('rect', { opacity: 0 });
        scene.add(el);

        const onComplete = vi.fn();

        const t = renderer.transition(el, {
            duration: 100,
            state: { opacity: 1 },
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
        const renderer = new Renderer(scene, {
            autoStart: false,
            autoStop: false,
        });

        const el = createElement('rect', { opacity: 0 });
        scene.add(el);

        expect(renderer.isBusy).toBe(false);

        const t = renderer.transition(el, {
            duration: 200,
            state: { opacity: 1 },
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
        const renderer = new Renderer(scene, {
            autoStart: false,
            autoStop: false,
        });

        const el1 = createElement('rect', { opacity: 0 });
        const el2 = createElement('rect', { opacity: 0 });
        scene.add(el1);
        scene.add(el2);

        const t = renderer.transition([el1, el2], {
            duration: 100,
            state: { opacity: 1 },
        });

        await vi.advanceTimersByTimeAsync(200);
        await t;

        expect(el1.opacity).toBeCloseTo(1, 1);
        expect(el2.opacity).toBeCloseTo(1, 1);

        renderer.destroy();
    });

    test('Should animate a group\'s own state as a unit (no fan-out to leaves)', async () => {
        const { scene } = createMockScene();
        const renderer = new Renderer(scene, {
            autoStart: false,
            autoStop: false,
        });

        const child = createElement('rect', {});
        const group = createGroup({ children: [child] });
        scene.add(group);

        const t = renderer.transition(group, {
            duration: 100,
            state: { transformScaleX: 2 },
        });

        await vi.advanceTimersByTimeAsync(200);
        await t;

        // The group's OWN state animated (advanced at its push op)...
        expect(group.transformScaleX).toBeCloseTo(2, 1);
        // ...and the leaf child was never touched (proving no fan-out).
        expect(child.transformScaleX).toBe(1);

        renderer.destroy();
    });

    test('Should emit start and stop events', () => {
        const { scene } = createMockScene();
        const renderer = new Renderer(scene, {
            autoStart: false,
            autoStop: false,
        });

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
        const renderer = new Renderer(scene, {
            autoStart: false,
            autoStop: false,
        });

        const el = createElement('rect', { opacity: 0 });
        scene.add(el);

        const t = renderer.transition(el, {
            duration: 1000,
            state: { opacity: 1 },
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
        const renderer = new Renderer(scene, {
            autoStart: true,
            autoStop: false,
        });

        const stopHandler = vi.fn();
        renderer.on('stop', stopHandler);

        renderer.destroy();
        expect(stopHandler).toHaveBeenCalledTimes(1);
    });

});
