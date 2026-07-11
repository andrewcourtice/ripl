import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    fillPolygon,
    rasterizeArc,
    rasterizeCircle,
    rasterizeCubicBezier,
    rasterizeEllipse,
    rasterizeLine,
    rasterizeQuadBezier,
    rasterizeRect,
} from '../src/algorithms';

import type {
    PixelCallback,
    Vertex,
} from '../src/algorithms';

function collectPixels(rasterize: (plot: PixelCallback) => void): [number, number][] {
    const pixels: [number, number][] = [];

    rasterize((x, y) => pixels.push([x, y]));

    return pixels;
}

function pixelSet(pixels: [number, number][]): Set<string> {
    return new Set(pixels.map(([x, y]) => `${x},${y}`));
}

describe('rasterizeLine', () => {

    test('Should plot a horizontal line', () => {
        const pixels = collectPixels(plot => rasterizeLine(0, 0, 5, 0, plot));

        expect(pixels.length).toBe(6);

        for (let x = 0; x <= 5; x++) {
            expect(pixels).toContainEqual([x, 0]);
        }
    });

    test('Should plot a vertical line', () => {
        const pixels = collectPixels(plot => rasterizeLine(0, 0, 0, 5, plot));

        expect(pixels.length).toBe(6);

        for (let y = 0; y <= 5; y++) {
            expect(pixels).toContainEqual([0, y]);
        }
    });

    test('Should plot a diagonal line', () => {
        const pixels = collectPixels(plot => rasterizeLine(0, 0, 4, 4, plot));

        expect(pixels.length).toBe(5);

        for (let i = 0; i <= 4; i++) {
            expect(pixels).toContainEqual([i, i]);
        }
    });

    test('Should plot a single point when start equals end', () => {
        const pixels = collectPixels(plot => rasterizeLine(3, 3, 3, 3, plot));

        expect(pixels).toEqual([[3, 3]]);
    });

    test('Should plot in reverse direction', () => {
        const pixels = collectPixels(plot => rasterizeLine(5, 0, 0, 0, plot));
        const set = pixelSet(pixels);

        for (let x = 0; x <= 5; x++) {
            expect(set.has(`${x},0`)).toBe(true);
        }
    });

});

describe('rasterizeCircle', () => {

    test('Should plot a single point for zero radius', () => {
        const pixels = collectPixels(plot => rasterizeCircle(10, 10, 0, plot));

        expect(pixels).toEqual([[10, 10]]);
    });

    test('Should produce symmetric pixels for a small circle', () => {
        const pixels = collectPixels(plot => rasterizeCircle(10, 10, 5, plot));

        expect(pixels.length).toBeGreaterThan(0);

        // Verify 8-way symmetry: for each plotted (cx+dx, cy+dy) we expect
        // all 8 reflections to be present
        const set = pixelSet(pixels);

        for (const [x, y] of pixels) {
            const dx = x - 10;
            const dy = y - 10;

            expect(set.has(`${10 + dx},${10 + dy}`)).toBe(true);
            expect(set.has(`${10 - dx},${10 + dy}`)).toBe(true);
            expect(set.has(`${10 + dx},${10 - dy}`)).toBe(true);
            expect(set.has(`${10 - dx},${10 - dy}`)).toBe(true);
        }
    });

    test('Should plot cardinal points on the circle', () => {
        const pixels = collectPixels(plot => rasterizeCircle(10, 10, 5, plot));
        const set = pixelSet(pixels);

        expect(set.has('15,10')).toBe(true); // right
        expect(set.has('5,10')).toBe(true); // left
        expect(set.has('10,15')).toBe(true); // bottom
        expect(set.has('10,5')).toBe(true); // top
    });

});

describe('rasterizeEllipse', () => {

    test('Should plot a single point for zero radii', () => {
        const pixels = collectPixels(plot => rasterizeEllipse(5, 5, 0, 0, plot));

        expect(pixels).toEqual([[5, 5]]);
    });

    test('Should produce 4-way symmetric pixels', () => {
        const pixels = collectPixels(plot => rasterizeEllipse(10, 10, 6, 3, plot));

        expect(pixels.length).toBeGreaterThan(0);

        const set = pixelSet(pixels);

        for (const [x, y] of pixels) {
            const dx = x - 10;
            const dy = y - 10;

            expect(set.has(`${10 + dx},${10 + dy}`)).toBe(true);
            expect(set.has(`${10 - dx},${10 + dy}`)).toBe(true);
            expect(set.has(`${10 + dx},${10 - dy}`)).toBe(true);
            expect(set.has(`${10 - dx},${10 - dy}`)).toBe(true);
        }
    });

    test('Should plot endpoints on the axes', () => {
        const pixels = collectPixels(plot => rasterizeEllipse(10, 10, 6, 3, plot));
        const set = pixelSet(pixels);

        expect(set.has('16,10')).toBe(true); // right
        expect(set.has('4,10')).toBe(true); // left
        expect(set.has('10,13')).toBe(true); // bottom
        expect(set.has('10,7')).toBe(true); // top
    });

});

describe('rasterizeRect', () => {

    test('Should plot all four edges', () => {
        const pixels = collectPixels(plot => rasterizeRect(0, 0, 4, 4, plot));
        const set = pixelSet(pixels);

        // Top edge
        for (let x = 0; x <= 4; x++) {
            expect(set.has(`${x},0`)).toBe(true);
        }

        // Bottom edge
        for (let x = 0; x <= 4; x++) {
            expect(set.has(`${x},4`)).toBe(true);
        }

        // Left edge
        for (let y = 0; y <= 4; y++) {
            expect(set.has(`0,${y}`)).toBe(true);
        }

        // Right edge
        for (let y = 0; y <= 4; y++) {
            expect(set.has(`4,${y}`)).toBe(true);
        }
    });

    test('Should handle non-origin rect', () => {
        const pixels = collectPixels(plot => rasterizeRect(5, 5, 3, 2, plot));
        const set = pixelSet(pixels);

        // Corners
        expect(set.has('5,5')).toBe(true);
        expect(set.has('8,5')).toBe(true);
        expect(set.has('5,7')).toBe(true);
        expect(set.has('8,7')).toBe(true);
    });

});

describe('rasterizeCubicBezier', () => {

    test('Should include start and end points', () => {
        const pixels = collectPixels(plot =>
            rasterizeCubicBezier(0, 0, 10, 20, 30, 20, 40, 0, plot)
        );
        const set = pixelSet(pixels);

        expect(set.has('0,0')).toBe(true);
        expect(set.has('40,0')).toBe(true);
    });

    test('Should plot intermediate pixels', () => {
        const pixels = collectPixels(plot =>
            rasterizeCubicBezier(0, 0, 10, 20, 30, 20, 40, 0, plot)
        );

        expect(pixels.length).toBeGreaterThan(2);
    });

});

describe('rasterizeQuadBezier', () => {

    test('Should include start and end points', () => {
        const pixels = collectPixels(plot =>
            rasterizeQuadBezier(0, 0, 20, 30, 40, 0, plot)
        );
        const set = pixelSet(pixels);

        expect(set.has('0,0')).toBe(true);
        expect(set.has('40,0')).toBe(true);
    });

    test('Should plot intermediate pixels', () => {
        const pixels = collectPixels(plot =>
            rasterizeQuadBezier(0, 0, 20, 30, 40, 0, plot)
        );

        expect(pixels.length).toBeGreaterThan(2);
    });

});

describe('rasterizeArc', () => {

    test('Should plot a partial arc', () => {
        const pixels = collectPixels(plot =>
            rasterizeArc(10, 10, 5, 0, Math.PI / 2, false, plot)
        );

        expect(pixels.length).toBeGreaterThan(0);
    });

    test('Should plot a counterclockwise arc', () => {
        const pixels = collectPixels(plot =>
            rasterizeArc(10, 10, 5, 0, Math.PI / 2, true, plot)
        );

        expect(pixels.length).toBeGreaterThan(0);
    });

    test('Should produce different pixels for CW vs CCW', () => {
        const cwPixels = collectPixels(plot =>
            rasterizeArc(10, 10, 5, 0, Math.PI / 2, false, plot)
        );
        const ccwPixels = collectPixels(plot =>
            rasterizeArc(10, 10, 5, 0, Math.PI / 2, true, plot)
        );

        // CW quarter arc vs CCW ¾ arc should differ in count
        expect(cwPixels.length).not.toBe(ccwPixels.length);
    });

});

describe('fillPolygon', () => {

    const square = (x: number, y: number, size: number): Vertex[] => [
        {
            x,
            y,
        },
        {
            x: x + size,
            y,
        },
        {
            x: x + size,
            y: y + size,
        },
        {
            x,
            y: y + size,
        },
    ];

    test('Should fill the interior of a convex polygon', () => {
        const set = pixelSet(collectPixels(plot => fillPolygon([square(0, 0, 10)], plot)));

        expect(set.has('5,5')).toBe(true);
        expect(set.has('1,1')).toBe(true);
        expect(set.has('9,9')).toBe(true);
    });

    test('Should fill a concave (triangle) polygon between its edge crossings', () => {
        const triangle: Vertex[] = [
            {
                x: 0,
                y: 0,
            },
            {
                x: 10,
                y: 0,
            },
            {
                x: 5,
                y: 10,
            },
        ];

        const set = pixelSet(collectPixels(plot => fillPolygon([triangle], plot)));

        expect(set.has('5,2')).toBe(true);
        // The apex narrows, so points far outside the triangle at low y stay empty.
        expect(set.has('0,9')).toBe(false);
        expect(set.has('10,9')).toBe(false);
    });

    test('Should leave the hole of an annular (ring) shape empty via the even-odd rule', () => {
        const outer = square(0, 0, 20);
        const inner = square(6, 6, 8);

        const set = pixelSet(collectPixels(plot => fillPolygon([outer, inner], plot)));

        // Ring bands on both sides of the hole are filled...
        expect(set.has('2,10')).toBe(true);
        expect(set.has('18,10')).toBe(true);
        // ...but the interior hole is NOT (this is the bug the gauge exposed).
        expect(set.has('10,10')).toBe(false);
    });

    test('Should ignore degenerate contours', () => {
        const pixels = collectPixels(plot => fillPolygon([[{
            x: 5,
            y: 5,
        }]], plot));

        expect(pixels.length).toBe(0);
    });

    test('Should handle an empty contour list', () => {
        const pixels = collectPixels(plot => fillPolygon([], plot));

        expect(pixels.length).toBe(0);
    });

});
