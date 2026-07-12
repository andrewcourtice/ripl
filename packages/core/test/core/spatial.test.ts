import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    createContext,
} from '@ripl/canvas';

import {
    mockCanvasContext,
    polyfillPath2D,
} from '@ripl/test-utils';

import {
    Box,
    createCircle,
    createScene,
    factory,
    SpatialIndex,
} from '../../src';

import type {
    RenderElement,
} from '../../src';

function stubElement(id: string): RenderElement {
    return {
        id,
    } as unknown as RenderElement;
}

describe('SpatialIndex', () => {

    test('Should return elements sharing the point cell and exclude distant ones', () => {
        const index = new SpatialIndex(64);
        const near = stubElement('near');
        const far = stubElement('far');

        index.insert(near, new Box(0, 0, 10, 10));
        index.insert(far, new Box(500, 500, 510, 510));

        expect(index.query(5, 5)).toContain(near);
        expect(index.query(5, 5)).not.toContain(far);
        expect(index.query(505, 505)).toContain(far);
    });

    test('Should always return loose (boxless) elements', () => {
        const index = new SpatialIndex(64);
        const loose = stubElement('loose');

        index.insert(loose, undefined);

        expect(index.query(5, 5)).toContain(loose);
        expect(index.query(9000, 9000)).toContain(loose);
    });

    test('Should honour padding so outline hits cross cell boundaries', () => {
        const index = new SpatialIndex(64);
        const line = stubElement('line');

        // A zero-height box on the cell-0 side of the boundary at y=64.
        index.insert(line, new Box(63, 0, 63, 100), 4);

        // A point 2px into cell 1, within the padded (stroke) region.
        expect(index.query(10, 65)).toContain(line);
    });

    test('Should clear for reuse', () => {
        const index = new SpatialIndex(64);
        index.insert(stubElement('a'), new Box(0, 0, 10, 10));

        index.clear();

        expect(index.query(5, 5)).toHaveLength(0);
    });

});

describe('Context hit testing (spatial index)', () => {

    let target: HTMLDivElement;

    beforeEach(() => {
        polyfillPath2D();
        mockCanvasContext();
        factory.set({
            createContext,
        });
        target = document.createElement('div');
        document.body.appendChild(target);
    });

    afterEach(() => {
        target.remove();
        factory.set({
            createContext: undefined,
        });
        vi.restoreAllMocks();
    });

    test('Should only path-test elements near the point', () => {
        const context = createContext(target);

        const near = createCircle({
            cx: 100,
            cy: 100,
            radius: 20,
            fill: '#ffffff',
        });
        const far = createCircle({
            cx: 900,
            cy: 700,
            radius: 20,
            fill: '#ffffff',
        });

        near.on('click', () => undefined);
        far.on('click', () => undefined);

        const scene = createScene(context, {
            children: [
                near,
                far,
            ],
        });

        scene.render();

        const nearSpy = vi.spyOn(near, 'intersectsWith');
        const farSpy = vi.spyOn(far, 'intersectsWith');

        (context as unknown as { hitTest(events: string[], x: number, y: number): RenderElement[] })
            .hitTest(['click'], 100, 100);

        expect(nearSpy).toHaveBeenCalled();
        expect(farSpy).not.toHaveBeenCalled();

        scene.destroy();
    });

});
