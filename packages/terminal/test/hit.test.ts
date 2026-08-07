import {
    beforeEach,
    describe,
    expect,
    test,
} from 'vitest';

import {
    createCircle,
    createRect,
} from '@ripl/core';

import {
    mockCanvasContext,
    polyfillPath2D,
} from '@ripl/test-utils';

import {
    isPointInContours,
    isPointOnContours,
} from '../src/hit';

import {
    createContext,
} from '../src/context';

import {
    createMockOutput,
} from './helpers';

polyfillPath2D();

/** A square contour wound clockwise, or counterclockwise when `reverse` is set. */
function square(left: number, top: number, size: number, reverse = false) {
    const points = [
        {
            x: left,
            y: top,
        },
        {
            x: left + size,
            y: top,
        },
        {
            x: left + size,
            y: top + size,
        },
        {
            x: left,
            y: top + size,
        },
    ];

    return reverse ? points.reverse() : points;
}

describe('Terminal hit geometry', () => {

    test('Should report a point inside a single contour', () => {
        expect(isPointInContours([square(0, 0, 10)], 5, 5)).toBe(true);
        expect(isPointInContours([square(0, 0, 10)], 15, 5)).toBe(false);
    });

    // An annulus is two contours; even-odd leaves the hole empty regardless of winding.
    test('Should leave a hole empty under the even-odd rule', () => {
        const contours = [square(0, 0, 20), square(5, 5, 10)];

        expect(isPointInContours(contours, 10, 10, 'evenodd')).toBe(false);
        expect(isPointInContours(contours, 2, 10, 'evenodd')).toBe(true);
    });

    test('Should fill a same-wound inner contour under the nonzero rule', () => {
        const contours = [square(0, 0, 20), square(5, 5, 10)];

        expect(isPointInContours(contours, 10, 10, 'nonzero')).toBe(true);
    });

    test('Should leave an opposite-wound inner contour empty under the nonzero rule', () => {
        const contours = [square(0, 0, 20), square(5, 5, 10, true)];

        expect(isPointInContours(contours, 10, 10, 'nonzero')).toBe(false);
    });

    test('Should report a point on an edge as being on the stroke', () => {
        expect(isPointOnContours([square(0, 0, 10)], 5, 0, 2)).toBe(true);
        expect(isPointOnContours([square(0, 0, 10)], 5, 5, 2)).toBe(false);
    });

    test('Should widen the stroke reach with the line width', () => {
        expect(isPointOnContours([square(0, 0, 10)], 5, 3, 2)).toBe(false);
        expect(isPointOnContours([square(0, 0, 10)], 5, 3, 8)).toBe(true);
    });

    test('Should skip the closing segment of an open contour', () => {
        const contour = [[
            {
                x: 0,
                y: 0,
            },
            {
                x: 10,
                y: 0,
            },
            {
                x: 10,
                y: 10,
            },
        ]];

        expect(isPointOnContours(contour, 5, 5, 2, false)).toBe(false);
        expect(isPointOnContours(contour, 5, 5, 2, true)).toBe(true);
    });

});

describe('TerminalContext hit testing', () => {

    beforeEach(() => {
        mockCanvasContext();
    });

    test('Should hit a point inside a filled path', () => {
        const context = createContext(createMockOutput(40, 12));
        const path = context.createPath();

        path.rect(10, 10, 20, 10);

        expect(context.isPointInPath(path, 15, 15)).toBe(true);
        expect(context.isPointInPath(path, 5, 15)).toBe(false);
    });

    test('Should hit a point on a path outline', () => {
        const context = createContext(createMockOutput(40, 12));
        const path = context.createPath();

        path.rect(10, 10, 20, 10);
        context.lineWidth = 4;

        expect(context.isPointInStroke(path, 10, 15)).toBe(true);
        expect(context.isPointInStroke(path, 20, 15)).toBe(false);
    });

    // Hit testing works in logical space, so the letterbox must not shift the point.
    test('Should hit the same logical point with and without a logical size', () => {
        const plain = createContext(createMockOutput(40, 12));
        const letterboxed = createContext(createMockOutput(40, 12), {
            logicalWidth: 200,
            logicalHeight: 100,
        });

        const build = (context: ReturnType<typeof createContext>) => {
            const path = context.createPath();

            path.circle(50, 50, 20);

            return path;
        };

        expect(plain.isPointInPath(build(plain), 50, 50)).toBe(true);
        expect(letterboxed.isPointInPath(build(letterboxed), 50, 50)).toBe(true);
    });

    test('Should hit a translated element at its drawn position', () => {
        const context = createContext(createMockOutput(40, 12));

        const rect = createRect({
            fill: '#ff0000',
            x: 0,
            y: 0,
            width: 20,
            height: 10,
            translateX: 30,
            translateY: 10,
        });

        context.batch(() => rect.render(context));

        expect(rect.intersectsWith(35, 12)).toBe(true);
        expect(rect.intersectsWith(5, 2)).toBe(false);
    });

    test('Should hit a rotated element at its drawn position', () => {
        const context = createContext(createMockOutput(40, 12));

        const circle = createCircle({
            fill: '#ff0000',
            cx: 10,
            cy: 0,
            radius: 4,
            rotation: Math.PI / 2,
        });

        context.batch(() => circle.render(context));

        expect(circle.intersectsWith(0, 10)).toBe(true);
    });

});
