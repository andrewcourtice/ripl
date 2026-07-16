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
    createGroup,
    createScene,
    factory,
} from '../../src';

import {
    createContext,
} from '@ripl/canvas';

import {
    mockCanvasContext,
    polyfillPath2D,
} from '@ripl/test-utils';

polyfillPath2D();

// "Large" static scene rendered over several frames. These assertions count how many times
// `context.createPath` runs — the allocation + geometry tracing the cache is meant to avoid —
// so they validate the optimization independently of wall-clock (which is meaningless here,
// since jsdom's polyfilled Path2D is a no-op). See shape-cache.bench.ts for timing.
const ELEMENT_COUNT = 2000;
const FRAME_COUNT = 5;

describe('Shape2D path caching — work avoided at scale', () => {

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

    function nextFrame() {
        return new Promise(resolve => requestAnimationFrame(resolve));
    }

    function staticCircles(count: number, cachePath: boolean) {
        return Array.from({ length: count }, (_, index) => createCircle({
            cx: index,
            cy: index,
            radius: 5,
            cachePath,
        }));
    }

    test('Should trace each static path once, then reuse it on every later frame', async () => {
        const scene = createScene(el);
        scene.add(staticCircles(ELEMENT_COUNT, true));

        await nextFrame();

        const createPathSpy = vi.spyOn(scene.context, 'createPath');

        // First frame traces every element.
        scene.render();
        expect(createPathSpy).toHaveBeenCalledTimes(ELEMENT_COUNT);

        // Every subsequent frame reuses the cached paths — zero re-tracing.
        createPathSpy.mockClear();
        for (let frame = 1; frame < FRAME_COUNT; frame++) {
            scene.render();
        }
        expect(createPathSpy).not.toHaveBeenCalled();

        scene.destroy();
    });

    test('Should re-create every path on every frame when caching is disabled', async () => {
        const scene = createScene(el);
        scene.add(staticCircles(ELEMENT_COUNT, false));

        await nextFrame();

        const createPathSpy = vi.spyOn(scene.context, 'createPath');

        for (let frame = 0; frame < FRAME_COUNT; frame++) {
            scene.render();
        }

        // Without caching the static scene pays the full N × F path creations.
        expect(createPathSpy).toHaveBeenCalledTimes(ELEMENT_COUNT * FRAME_COUNT);

        scene.destroy();
    });

    test('Should keep static children cached while the parent group transform animates', async () => {
        const children = staticCircles(ELEMENT_COUNT, true);
        const group = createGroup({ children });
        const scene = createScene(el);
        scene.add(group);

        await nextFrame();

        const createPathSpy = vi.spyOn(scene.context, 'createPath');

        for (let frame = 0; frame < FRAME_COUNT; frame++) {
            // Dirties only the group; children's own state is unchanged.
            group.translateX = frame + 1;
            scene.render();
        }

        // Paths are local-space, so an animating ancestor never forces a child re-trace: the
        // children are traced once and reused for the rest of the animation.
        expect(createPathSpy).toHaveBeenCalledTimes(ELEMENT_COUNT);

        scene.destroy();
    });

    test('Should re-create a path whenever the element geometry changes each frame', async () => {
        const circles = staticCircles(ELEMENT_COUNT, true);
        const scene = createScene(el);
        scene.add(circles);

        await nextFrame();

        const createPathSpy = vi.spyOn(scene.context, 'createPath');

        for (let frame = 0; frame < FRAME_COUNT; frame++) {
            circles.forEach(circle => {
                circle.radius = 10 + frame;
            });
            scene.render();
        }

        // A real geometry change each frame invalidates the cache, so nothing stale is served.
        expect(createPathSpy).toHaveBeenCalledTimes(ELEMENT_COUNT * FRAME_COUNT);

        scene.destroy();
    });

});
