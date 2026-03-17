import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    rasterizeArc,
    rasterizeCircle,
    rasterizeCubicBezier,
    rasterizeEllipse,
    rasterizeLine,
    rasterizeQuadBezier,
    rasterizeRect,
    scanlineFill,
} from '../src/algorithms';

import type {
    PixelCallback,
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

describe('scanlineFill', () => {

    test('Should fill between min and max x per row', () => {
        const edges = new Map<number, number[]>();

        edges.set(0, [2, 8]);
        edges.set(1, [3, 7]);

        const pixels = collectPixels(plot => scanlineFill(edges, plot));
        const set = pixelSet(pixels);

        // Row 0: x=2..8
        for (let x = 2; x <= 8; x++) {
            expect(set.has(`${x},0`)).toBe(true);
        }

        // Row 1: x=3..7
        for (let x = 3; x <= 7; x++) {
            expect(set.has(`${x},1`)).toBe(true);
        }
    });

    test('Should skip rows with fewer than 2 edge pixels', () => {
        const edges = new Map<number, number[]>();

        edges.set(0, [5]);
        edges.set(1, [2, 6]);

        const pixels = collectPixels(plot => scanlineFill(edges, plot));

        // Row 0 should be skipped
        const row0 = pixels.filter(([, y]) => y === 0);

        expect(row0.length).toBe(0);

        // Row 1 should be filled
        const row1 = pixels.filter(([, y]) => y === 1);

        expect(row1.length).toBe(5); // x=2..6
    });

    test('Should handle empty edges map', () => {
        const edges = new Map<number, number[]>();
        const pixels = collectPixels(plot => scanlineFill(edges, plot));

        expect(pixels.length).toBe(0);
    });

});
