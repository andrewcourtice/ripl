import {
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    polylineBasisRenderer,
    polylineBumpXRenderer,
    polylineBumpYRenderer,
    polylineCardinalRenderer,
    polylineCatmullRomRenderer,
    polylineLinearRenderer,
    polylineMonotoneXRenderer,
    polylineMonotoneYRenderer,
    polylineNaturalRenderer,
    polylineSplineRenderer,
    polylineStepAfterRenderer,
    polylineStepBeforeRenderer,
    polylineStepRenderer,
} from '../../src';

import type {
    Context,
    ContextPath,
    Point,
} from '../../src';

function createMockPath(): ContextPath {
    return {
        id: 'mock-path',
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        bezierCurveTo: vi.fn(),
        quadraticCurveTo: vi.fn(),
        arc: vi.fn(),
        arcTo: vi.fn(),
        ellipse: vi.fn(),
        rect: vi.fn(),
        roundRect: vi.fn(),
        closePath: vi.fn(),
        circle: vi.fn(),
        polyline: vi.fn(),
    } as unknown as ContextPath;
}

const mockContext = {} as Context;

const SIMPLE_POINTS: Point[] = [[0, 0], [50, 100], [100, 50], [150, 75]];
const TWO_POINTS: Point[] = [[0, 0], [100, 100]];

describe('Polyline Renderers', () => {

    // ── linear ───────────────────────────────────────────────────

    describe('linear', () => {

        test('Should delegate to path.polyline', () => {
            const renderer = polylineLinearRenderer();
            const path = createMockPath();
            renderer(mockContext, path, SIMPLE_POINTS);
            expect(path.polyline).toHaveBeenCalledWith(SIMPLE_POINTS);
        });

    });

    // ── spline ───────────────────────────────────────────────────

    describe('spline', () => {

        test('Should call moveTo and bezierCurveTo', () => {
            const renderer = polylineSplineRenderer();
            const path = createMockPath();
            renderer(mockContext, path, SIMPLE_POINTS);
            expect(path.moveTo).toHaveBeenCalled();
            expect(path.bezierCurveTo).toHaveBeenCalled();
        });

        test('Should accept custom tension', () => {
            const renderer = polylineSplineRenderer(0.3);
            const path = createMockPath();
            renderer(mockContext, path, SIMPLE_POINTS);
            expect(path.bezierCurveTo).toHaveBeenCalled();
        });

    });

    // ── basis ────────────────────────────────────────────────────

    describe('basis', () => {

        test('Should call moveTo and bezierCurveTo for 3+ points', () => {
            const renderer = polylineBasisRenderer();
            const path = createMockPath();
            renderer(mockContext, path, SIMPLE_POINTS);
            expect(path.moveTo).toHaveBeenCalled();
            expect(path.bezierCurveTo).toHaveBeenCalled();
        });

        test('Should handle 2 points with lineTo fallback', () => {
            const renderer = polylineBasisRenderer();
            const path = createMockPath();
            renderer(mockContext, path, TWO_POINTS);
            expect(path.moveTo).toHaveBeenCalledWith(0, 0);
            expect(path.lineTo).toHaveBeenCalledWith(100, 100);
        });

        test('Should handle fewer than 2 points gracefully', () => {
            const renderer = polylineBasisRenderer();
            const path = createMockPath();
            renderer(mockContext, path, [[0, 0]]);
            expect(path.bezierCurveTo).not.toHaveBeenCalled();
        });

    });

    // ── bumpX ────────────────────────────────────────────────────

    describe('bumpX', () => {

        test('Should call moveTo and bezierCurveTo', () => {
            const renderer = polylineBumpXRenderer();
            const path = createMockPath();
            renderer(mockContext, path, SIMPLE_POINTS);
            expect(path.moveTo).toHaveBeenCalledWith(0, 0);
            expect(path.bezierCurveTo).toHaveBeenCalledTimes(3);
        });

        test('Should use midpoint X as control points', () => {
            const renderer = polylineBumpXRenderer();
            const path = createMockPath();
            renderer(mockContext, path, TWO_POINTS);
            expect(path.bezierCurveTo).toHaveBeenCalledWith(50, 0, 50, 100, 100, 100);
        });

        test('Should handle empty points', () => {
            const renderer = polylineBumpXRenderer();
            const path = createMockPath();
            renderer(mockContext, path, []);
            expect(path.moveTo).not.toHaveBeenCalled();
        });

    });

    // ── bumpY ────────────────────────────────────────────────────

    describe('bumpY', () => {

        test('Should call moveTo and bezierCurveTo', () => {
            const renderer = polylineBumpYRenderer();
            const path = createMockPath();
            renderer(mockContext, path, SIMPLE_POINTS);
            expect(path.moveTo).toHaveBeenCalledWith(0, 0);
            expect(path.bezierCurveTo).toHaveBeenCalledTimes(3);
        });

        test('Should use midpoint Y as control points', () => {
            const renderer = polylineBumpYRenderer();
            const path = createMockPath();
            renderer(mockContext, path, TWO_POINTS);
            expect(path.bezierCurveTo).toHaveBeenCalledWith(0, 50, 100, 50, 100, 100);
        });

    });

    // ── cardinal ─────────────────────────────────────────────────

    describe('cardinal', () => {

        test('Should call moveTo and bezierCurveTo for 3+ points', () => {
            const renderer = polylineCardinalRenderer();
            const path = createMockPath();
            renderer(mockContext, path, SIMPLE_POINTS);
            expect(path.moveTo).toHaveBeenCalled();
            expect(path.bezierCurveTo).toHaveBeenCalled();
        });

        test('Should handle 2 points with lineTo fallback', () => {
            const renderer = polylineCardinalRenderer();
            const path = createMockPath();
            renderer(mockContext, path, TWO_POINTS);
            expect(path.moveTo).toHaveBeenCalledWith(0, 0);
            expect(path.lineTo).toHaveBeenCalledWith(100, 100);
        });

        test('Should accept custom tension', () => {
            const renderer = polylineCardinalRenderer(0.5);
            const path = createMockPath();
            renderer(mockContext, path, SIMPLE_POINTS);
            expect(path.bezierCurveTo).toHaveBeenCalled();
        });

    });

    // ── catmullRom ───────────────────────────────────────────────

    describe('catmullRom', () => {

        test('Should call moveTo and bezierCurveTo for 3+ points', () => {
            const renderer = polylineCatmullRomRenderer();
            const path = createMockPath();
            renderer(mockContext, path, SIMPLE_POINTS);
            expect(path.moveTo).toHaveBeenCalled();
            expect(path.bezierCurveTo).toHaveBeenCalled();
        });

        test('Should accept custom alpha', () => {
            const renderer = polylineCatmullRomRenderer(0.3);
            const path = createMockPath();
            renderer(mockContext, path, SIMPLE_POINTS);
            expect(path.bezierCurveTo).toHaveBeenCalled();
        });

    });

    // ── monotoneX ────────────────────────────────────────────────

    describe('monotoneX', () => {

        test('Should call moveTo and bezierCurveTo for 3+ points', () => {
            const renderer = polylineMonotoneXRenderer();
            const path = createMockPath();
            renderer(mockContext, path, SIMPLE_POINTS);
            expect(path.moveTo).toHaveBeenCalled();
            expect(path.bezierCurveTo).toHaveBeenCalled();
        });

        test('Should handle 2 points with lineTo', () => {
            const renderer = polylineMonotoneXRenderer();
            const path = createMockPath();
            renderer(mockContext, path, TWO_POINTS);
            expect(path.lineTo).toHaveBeenCalledWith(100, 100);
        });

    });

    // ── monotoneY ────────────────────────────────────────────────

    describe('monotoneY', () => {

        test('Should call moveTo and bezierCurveTo for 3+ points', () => {
            const renderer = polylineMonotoneYRenderer();
            const path = createMockPath();
            renderer(mockContext, path, SIMPLE_POINTS);
            expect(path.moveTo).toHaveBeenCalled();
            expect(path.bezierCurveTo).toHaveBeenCalled();
        });

    });

    // ── natural ──────────────────────────────────────────────────

    describe('natural', () => {

        test('Should call moveTo and bezierCurveTo for 3+ points', () => {
            const renderer = polylineNaturalRenderer();
            const path = createMockPath();
            renderer(mockContext, path, SIMPLE_POINTS);
            expect(path.moveTo).toHaveBeenCalled();
            expect(path.bezierCurveTo).toHaveBeenCalled();
        });

        test('Should handle 2 points with lineTo', () => {
            const renderer = polylineNaturalRenderer();
            const path = createMockPath();
            renderer(mockContext, path, TWO_POINTS);
            expect(path.lineTo).toHaveBeenCalledWith(100, 100);
        });

    });

    // ── step ─────────────────────────────────────────────────────

    describe('step', () => {

        test('Should call moveTo and lineTo for midpoint steps', () => {
            const renderer = polylineStepRenderer();
            const path = createMockPath();
            renderer(mockContext, path, TWO_POINTS);
            expect(path.moveTo).toHaveBeenCalledWith(0, 0);
            // midX = 50, then step: lineTo(50,0), lineTo(50,100), lineTo(100,100)
            expect(path.lineTo).toHaveBeenCalledWith(50, 0);
            expect(path.lineTo).toHaveBeenCalledWith(50, 100);
            expect(path.lineTo).toHaveBeenCalledWith(100, 100);
        });

        test('Should handle empty points', () => {
            const renderer = polylineStepRenderer();
            const path = createMockPath();
            renderer(mockContext, path, []);
            expect(path.moveTo).not.toHaveBeenCalled();
        });

    });

    // ── stepBefore ───────────────────────────────────────────────

    describe('stepBefore', () => {

        test('Should step vertically at start of segment', () => {
            const renderer = polylineStepBeforeRenderer();
            const path = createMockPath();
            renderer(mockContext, path, TWO_POINTS);
            expect(path.moveTo).toHaveBeenCalledWith(0, 0);
            // stepBefore: lineTo(x0, y1), lineTo(x1, y1)
            expect(path.lineTo).toHaveBeenCalledWith(0, 100);
            expect(path.lineTo).toHaveBeenCalledWith(100, 100);
        });

    });

    // ── stepAfter ────────────────────────────────────────────────

    describe('stepAfter', () => {

        test('Should step vertically at end of segment', () => {
            const renderer = polylineStepAfterRenderer();
            const path = createMockPath();
            renderer(mockContext, path, TWO_POINTS);
            expect(path.moveTo).toHaveBeenCalledWith(0, 0);
            // stepAfter: lineTo(x1, y0), lineTo(x1, y1)
            expect(path.lineTo).toHaveBeenCalledWith(100, 0);
            expect(path.lineTo).toHaveBeenCalledWith(100, 100);
        });

    });

});
