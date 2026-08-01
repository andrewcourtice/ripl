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
    PolylineRenderFunc,
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

/** Records the commands a renderer emits, so a test can reconstruct the curve it drew. */
function recordCommands(renderer: PolylineRenderFunc, points: Point[]) {
    const commands: { type: string;
        args: number[]; }[] = [];

    const path = {
        id: 'record-path',
        moveTo: (...args: number[]) => commands.push({
            type: 'moveTo',
            args,
        }),
        lineTo: (...args: number[]) => commands.push({
            type: 'lineTo',
            args,
        }),
        bezierCurveTo: (...args: number[]) => commands.push({
            type: 'bezierCurveTo',
            args,
        }),
        quadraticCurveTo: (...args: number[]) => commands.push({
            type: 'quadraticCurveTo',
            args,
        }),
        polyline: (pts: Point[]) => pts.forEach(([x, y], index) => commands.push({
            type: index ? 'lineTo' : 'moveTo',
            args: [x, y],
        })),
    } as unknown as ContextPath;

    renderer(mockContext, path, points);

    return commands;
}

function cubicAt(p0: Point, cp1: Point, cp2: Point, p1: Point, position: number): Point {
    const inverse = 1 - position;

    return [0, 1].map(axis => inverse ** 3 * p0[axis]
        + 3 * inverse ** 2 * position * cp1[axis]
        + 3 * inverse * position ** 2 * cp2[axis]
        + position ** 3 * p1[axis]) as Point;
}

/** Densely samples the recorded curve, so a test can assert what the rendered line actually touches. */
function sampleCurve(renderer: PolylineRenderFunc, points: Point[]): Point[] {
    const samples: Point[] = [];

    let cursor: Point = [0, 0];

    recordCommands(renderer, points).forEach(({ type, args }) => {
        if (type === 'moveTo') {
            cursor = [args[0], args[1]];
            samples.push(cursor);
            return;
        }

        if (type === 'lineTo') {
            const end: Point = [args[0], args[1]];

            for (let step = 1; step <= 40; step++) {
                samples.push(cubicAt(cursor, cursor, end, end, step / 40));
            }

            cursor = end;
            return;
        }

        if (type === 'bezierCurveTo') {
            const end: Point = [args[4], args[5]];

            for (let step = 1; step <= 40; step++) {
                samples.push(cubicAt(cursor, [args[0], args[1]], [args[2], args[3]], end, step / 40));
            }

            cursor = end;
        }
    });

    return samples;
}

function distanceToCurve(renderer: PolylineRenderFunc, points: Point[], point: Point): number {
    return Math.min(...sampleCurve(renderer, points).map(([x, y]) => Math.hypot(x - point[0], y - point[1])));
}

const INTERPOLATING_RENDERERS: [string, PolylineRenderFunc][] = [
    ['linear', polylineLinearRenderer()],
    ['spline', polylineSplineRenderer()],
    ['bumpX', polylineBumpXRenderer()],
    ['bumpY', polylineBumpYRenderer()],
    ['cardinal', polylineCardinalRenderer()],
    ['catmullRom', polylineCatmullRomRenderer()],
    ['monotoneX', polylineMonotoneXRenderer()],
    ['monotoneY', polylineMonotoneYRenderer()],
    ['natural', polylineNaturalRenderer()],
    ['step', polylineStepRenderer()],
    ['stepBefore', polylineStepBeforeRenderer()],
    ['stepAfter', polylineStepAfterRenderer()],
];

describe('Polyline Renderers', () => {

    // A renderer that misses a point draws a line through data it was never given.
    describe.each(INTERPOLATING_RENDERERS)('%s passes through its points', (_name, renderer) => {

        test.each(SIMPLE_POINTS)('Should draw through [%i, %i]', (x, y) => {
            expect(distanceToCurve(renderer, SIMPLE_POINTS, [x, y])).toBeLessThan(0.5);
        });

    });

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

        // It drew one curve per *pair* of intervals, so the second point was never on the line.
        test('Should draw one curve per interval', () => {
            const commands = recordCommands(polylineCardinalRenderer(), SIMPLE_POINTS);

            expect(commands.filter(command => command.type === 'bezierCurveTo')).toHaveLength(SIMPLE_POINTS.length - 1);
            expect(commands.map(command => command.type)).toEqual(['moveTo', 'bezierCurveTo', 'bezierCurveTo', 'bezierCurveTo']);
        });

        test('Should end each curve exactly on the next point', () => {
            const commands = recordCommands(polylineCardinalRenderer(), SIMPLE_POINTS)
                .filter(command => command.type === 'bezierCurveTo');

            expect(commands.map(command => command.args.slice(4))).toEqual(SIMPLE_POINTS.slice(1));
        });

        test('Should collapse to straight segments at full tension', () => {
            const commands = recordCommands(polylineCardinalRenderer(1), SIMPLE_POINTS)
                .filter(command => command.type === 'bezierCurveTo');

            commands.forEach((command, index) => expect(command.args).toEqual([
                ...SIMPLE_POINTS[index],
                ...SIMPLE_POINTS[index + 1],
                ...SIMPLE_POINTS[index + 1],
            ]));
        });

        test('Should match d3 curveCardinal control points', () => {
            const factor = (1 - 0.5) / 6;
            const [first] = recordCommands(polylineCardinalRenderer(0.5), SIMPLE_POINTS)
                .filter(command => command.type === 'bezierCurveTo');

            const [p0, p1, p2] = SIMPLE_POINTS;

            expect(first.args).toEqual([
                p0[0] + (p1[0] - p0[0]) * factor,
                p0[1] + (p1[1] - p0[1]) * factor,
                p1[0] - (p2[0] - p0[0]) * factor,
                p1[1] - (p2[1] - p0[1]) * factor,
                p1[0],
                p1[1],
            ]);
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
