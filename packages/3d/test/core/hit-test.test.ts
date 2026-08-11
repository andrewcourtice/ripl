import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    mockHostSize,
    mockPaintLog,
} from '../paint-log';

import {
    createContext,
    createCube,
} from '../../src';

import type {
    Context3D,
} from '../../src';

import {
    createCircle,
    createScene,
} from '@ripl/core';

import type {
    RenderElement,
} from '@ripl/core';

import {
    polyfillPath2D,
} from '@ripl/test-utils';

polyfillPath2D();

// `hitTest` is the protected extension point the pointer pipeline dispatches through; calling it
// directly is what lets a test assert the resolved order without driving rAF-buffered hover.
function hitTest(context: Context3D, x: number, y: number): RenderElement[] {
    return (context as unknown as {
        hitTest(events: string[], x: number, y: number): RenderElement[];
    }).hitTest(['mousemove'], x, y);
}

describe('Context3D hit testing', () => {

    let host: HTMLDivElement;

    beforeEach(() => {
        mockPaintLog();
        host = document.createElement('div');
        document.body.appendChild(host);

        mockHostSize(400, 300);
    });

    afterEach(() => {
        host.remove();
        vi.restoreAllMocks();
    });

    function createFixture(): Context3D {
        const context = createContext(host);

        context.setCamera([0, 0, 10], [0, 0, 0], [0, 1, 0]);

        return context;
    }

    /*
     * 3D-H2: `Context.hitTest` ranks by paint order, which is right for 2D — the last thing painted
     * is on top. A 3D scene does not paint in element order: `flushFaces` depth-sorts every face of
     * every shape globally. Worse, the paint order a 3D scene resolves is frozen at the last graph
     * change, when every shape's projected depth is still its initial zero — so the winner among
     * overlapping parts was simply whichever was added to the scene last, camera be damned.
     */
    test('Should rank the nearer shape first even when it was added first', () => {
        const context = createFixture();
        const near = createCube({
            size: 2,
            z: 3,
            fill: '#ff0000',
        });
        const far = createCube({
            size: 2,
            z: -3,
            fill: '#00ff00',
        });

        near.on('mousemove', () => {});
        far.on('mousemove', () => {});

        createScene(context, {
            children: [near, far],
        }).render();

        expect(hitTest(context, 200, 150)).toEqual([near, far]);
    });

    test('Should rank the nearer shape first when it was added last', () => {
        const context = createFixture();
        const near = createCube({
            size: 2,
            z: 3,
            fill: '#ff0000',
        });
        const far = createCube({
            size: 2,
            z: -3,
            fill: '#00ff00',
        });

        near.on('mousemove', () => {});
        far.on('mousemove', () => {});

        createScene(context, {
            children: [far, near],
        }).render();

        expect(hitTest(context, 200, 150)).toEqual([near, far]);
    });

    test('Should follow the camera rather than the order the scene was built in', () => {
        const context = createFixture();
        const front = createCube({
            size: 2,
            z: 3,
            fill: '#ff0000',
        });
        const back = createCube({
            size: 2,
            z: -3,
            fill: '#00ff00',
        });

        front.on('mousemove', () => {});
        back.on('mousemove', () => {});

        const scene = createScene(context, {
            children: [front, back],
        });

        scene.render();
        context.setCamera([0, 0, -10], [0, 0, 0], [0, 1, 0]);
        scene.render();

        expect(hitTest(context, 200, 150)[0]).toBe(back);
    });

    test('Should return nothing where no shape sits', () => {
        const context = createFixture();
        const cube = createCube({
            size: 1,
            fill: '#ff0000',
        });

        cube.on('mousemove', () => {});

        createScene(context, {
            children: [cube],
        }).render();

        expect(hitTest(context, 5, 5)).toEqual([]);
    });

    test('Should leave a shape opted out of pointer events unhit', () => {
        const context = createFixture();
        const near = createCube({
            size: 2,
            z: 3,
            fill: '#ff0000',
            pointerEvents: 'none',
        });
        const far = createCube({
            size: 2,
            z: -3,
            fill: '#00ff00',
        });

        near.on('mousemove', () => {});
        far.on('mousemove', () => {});

        createScene(context, {
            children: [near, far],
        }).render();

        expect(hitTest(context, 200, 150)).toEqual([far]);
    });

    // A 2D element flushes the face buffer before it paints, so paint order genuinely does decide
    // between it and the 3D geometry underneath — the distance ranking must not disturb that.
    test('Should keep a 2D element painted over 3D geometry on top', () => {
        const context = createFixture();
        const cube = createCube({
            size: 2,
            fill: '#ff0000',
        });
        const overlay = createCircle({
            cx: 200,
            cy: 150,
            radius: 50,
            fill: '#0000ff',
        });

        cube.on('mousemove', () => {});
        overlay.on('mousemove', () => {});

        vi.spyOn(context, 'isPointInPath').mockReturnValue(true);

        createScene(context, {
            children: [cube, overlay],
        }).render();

        expect(hitTest(context, 200, 150)).toEqual([overlay, cube]);
    });

});
