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
    createRect,
    createScene,
    factory,
    isGroup,
    Renderer,
    TaskAbortError,
} from '../../src';

import type {
    Scene,
} from '../../src';

import {
    createContext,
} from '@ripl/canvas';

import {
    mockCanvasContext,
    polyfillPath2D,
} from '@ripl/test-utils';

polyfillPath2D();

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

    let needsRender = true;

    const scene = {
        context: mockContext,
        buffer: elements,
        // Mirrors the real Scene's dirty flag: invalidate sets it, a painted frame consumes it.
        get needsRender() {
            return needsRender;
        },
        invalidate: () => {
            needsRender = true;
        },
        $consumeRender: () => {
            needsRender = false;
        },
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

    test('Should list the events a renderer can emit', () => {
        const { scene } = createMockScene();
        const renderer = new Renderer(scene, {
            autoStart: false,
            autoStop: false,
        });

        expect(renderer.$events).toEqual(['destroyed', 'start', 'stop', 'tick']);

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

    describe('Dirty gating', () => {

        test('Should perform zero paints while the loop runs with a clean scene', async () => {
            const { scene, mockContext } = createMockScene();
            const renderer = new Renderer(scene, {
                autoStart: false,
                autoStop: false,
            });

            scene.add(createElement('rect', {}));
            renderer.start();

            // The first frame paints (a scene starts dirty) and consumes the flag.
            await vi.advanceTimersByTimeAsync(50);
            expect(mockContext.batch).toHaveBeenCalledTimes(1);

            // Idle-but-running: many further frames perform zero paints.
            await vi.advanceTimersByTimeAsync(1000);
            expect(mockContext.batch).toHaveBeenCalledTimes(1);

            renderer.destroy();
        });

        test('Should paint exactly once per invalidation', async () => {
            const { scene, mockContext } = createMockScene();
            const renderer = new Renderer(scene, {
                autoStart: false,
                autoStop: false,
            });

            scene.add(createElement('rect', {}));
            renderer.start();

            await vi.advanceTimersByTimeAsync(100);
            expect(mockContext.batch).toHaveBeenCalledTimes(1);

            scene.invalidate();

            await vi.advanceTimersByTimeAsync(1000);
            expect(mockContext.batch).toHaveBeenCalledTimes(2);

            renderer.destroy();
        });

        test('Should paint every frame while a transition is active', async () => {
            const { scene, mockContext } = createMockScene();
            const renderer = new Renderer(scene, {
                autoStart: false,
                autoStop: false,
            });

            const el = createElement('rect', { opacity: 0 });
            scene.add(el);
            renderer.start();

            await vi.advanceTimersByTimeAsync(100);

            const paintsBefore = mockContext.batch.mock.calls.length;
            const t = renderer.transition(el, {
                duration: 160,
                state: { opacity: 1 },
            });

            await vi.advanceTimersByTimeAsync(400);
            await t;

            // ~10 frames of transition — every one painted (plus the completion frame).
            expect(mockContext.batch.mock.calls.length).toBeGreaterThan(paintsBefore + 5);
            expect(el.opacity).toBeCloseTo(1, 1);

            // Once complete, the loop keeps running but paints stop again.
            const paintsAfter = mockContext.batch.mock.calls.length;

            await vi.advanceTimersByTimeAsync(500);
            expect(mockContext.batch.mock.calls.length).toBe(paintsAfter);

            renderer.destroy();
        });

        test('Should keep emitting tick events on skipped frames', async () => {
            const { scene, mockContext } = createMockScene();
            const renderer = new Renderer(scene, {
                autoStart: false,
                autoStop: false,
            });

            const tickHandler = vi.fn();

            renderer.on('tick', tickHandler);
            renderer.start();

            await vi.advanceTimersByTimeAsync(500);

            expect(mockContext.batch).toHaveBeenCalledTimes(1);
            expect(tickHandler.mock.calls.length).toBeGreaterThan(10);

            renderer.destroy();
        });

    });

    describe('Dirty gating (integration)', () => {

        let el: HTMLDivElement;

        beforeEach(() => {
            mockCanvasContext();
            factory.set({ createContext });
            el = document.createElement('div');
            document.body.appendChild(el);
        });

        afterEach(() => {
            el.remove();
            factory.set({ createContext: undefined });
            vi.restoreAllMocks();
        });

        async function createSettledScene(rendererOptions?: ConstructorParameters<typeof Renderer>[1]) {
            const scene = createScene(el);
            const rect = createRect({
                x: 0,
                y: 0,
                width: 10,
                height: 10,
                fill: '#000000',
                opacity: 1,
            });

            scene.add(rect);

            const renderer = new Renderer(scene, {
                autoStart: false,
                autoStop: false,
                ...rendererOptions,
            });

            const clearSpy = vi.spyOn(scene.context, 'clear');

            renderer.start();

            // Let the initial paint and the frame-buffered graph rebuild settle.
            await vi.advanceTimersByTimeAsync(200);

            return {
                scene,
                rect,
                renderer,
                clearSpy,
            };
        }

        test('Should paint exactly once for a single element state write', async () => {
            const { scene, rect, renderer, clearSpy } = await createSettledScene();

            const paintsBefore = clearSpy.mock.calls.length;

            // Idle loop first — no paints.
            await vi.advanceTimersByTimeAsync(500);
            expect(clearSpy.mock.calls.length).toBe(paintsBefore);

            rect.opacity = 0.5;

            await vi.advanceTimersByTimeAsync(500);
            expect(clearSpy.mock.calls.length).toBe(paintsBefore + 1);

            renderer.destroy();
            scene.destroy();
        });

        test('Should paint a transition\'s final state', async () => {
            const { scene, rect, renderer, clearSpy } = await createSettledScene();

            const opacityAtRender: number[] = [];
            const originalRender = rect.render.bind(rect);

            vi.spyOn(rect, 'render').mockImplementation(context => {
                opacityAtRender.push(rect.opacity ?? -1);
                return originalRender(context);
            });

            const t = renderer.transition(rect, {
                duration: 160,
                state: { opacity: 0 },
            });

            await vi.advanceTimersByTimeAsync(500);
            await t;

            // The completion frame painted the final interpolated state.
            expect(opacityAtRender.length).toBeGreaterThan(0);
            expect(opacityAtRender.at(-1)).toBe(0);

            // And the loop goes quiet again once the transition is done.
            const paintsAfter = clearSpy.mock.calls.length;

            await vi.advanceTimersByTimeAsync(500);
            expect(clearSpy.mock.calls.length).toBe(paintsAfter);

            renderer.destroy();
            scene.destroy();
        });

        test('Should repaint when an element\'s z-index changes', async () => {
            const { scene, rect, renderer, clearSpy } = await createSettledScene();

            const paintsBefore = clearSpy.mock.calls.length;

            rect.zIndex = 5;

            await vi.advanceTimersByTimeAsync(200);
            expect(clearSpy.mock.calls.length).toBeGreaterThan(paintsBefore);

            // Stable again after the reorder is painted.
            const paintsAfter = clearSpy.mock.calls.length;

            await vi.advanceTimersByTimeAsync(500);
            expect(clearSpy.mock.calls.length).toBe(paintsAfter);

            renderer.destroy();
            scene.destroy();
        });

        test('Should repaint when the context requests a render', async () => {
            const { scene, renderer, clearSpy } = await createSettledScene();

            const paintsBefore = clearSpy.mock.calls.length;

            // Idle loop first — a clean scene under the dirty gate performs zero paints.
            await vi.advanceTimersByTimeAsync(500);
            expect(clearSpy.mock.calls.length).toBe(paintsBefore);

            // A context-level repaint request (mutating no element, e.g. a 3D camera move) forces
            // the next frame to paint — exactly the signal a camera change relies on.
            scene.context.requestRender();

            await vi.advanceTimersByTimeAsync(500);
            expect(clearSpy.mock.calls.length).toBe(paintsBefore + 1);

            renderer.destroy();
            scene.destroy();
        });

        test('Should paint every frame when the fps debug overlay is enabled', async () => {
            const { scene, renderer, clearSpy } = await createSettledScene({
                debug: { fps: true },
            });

            const paintsBefore = clearSpy.mock.calls.length;

            await vi.advanceTimersByTimeAsync(320);

            // ~20 frames elapsed — the fps overlay forces a paint on each of them.
            expect(clearSpy.mock.calls.length).toBeGreaterThan(paintsBefore + 10);

            renderer.destroy();
            scene.destroy();
        });

    });

});
