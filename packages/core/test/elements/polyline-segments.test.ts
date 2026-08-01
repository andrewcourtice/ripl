import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    createPolyline,
    normalizePolylineRuns,
} from '../../src';

import type {
    Point,
    PolylineRenderer,
    PolylineRenderFunc,
    PolylineState,
    Shape2DOptions,
} from '../../src';

import {
    createContext,
} from '@ripl/canvas';

import {
    mockCanvasContext,
    polyfillPath2D,
} from '@ripl/test-utils';

polyfillPath2D();

const POINTS: Point[] = [
    [0, 0],
    [10, 20],
    [20, 10],
    [30, 30],
    [40, 5],
    [50, 25],
];

const DASHED = [6, 4];
const DOTTED = [2, 3];

const RENDERERS: PolylineRenderer[] = [
    'linear',
    'spline',
    'basis',
    'bumpX',
    'bumpY',
    'cardinal',
    'catmullRom',
    'monotoneX',
    'monotoneY',
    'natural',
    'step',
    'stepBefore',
    'stepAfter',
];

/** Every renderer whose commands land on its input points, and so can be split at one. */
const SPLITTABLE = RENDERERS.filter(renderer => renderer !== 'basis');

interface StrokeRecord {
    lineDash: number[];
    lineDashOffset: number;
    pathId: string;
}

/** Gives the stubbed canvas real dash state, so `context.lineDash` reads back what was set. */
function statefulDash() {
    const stub = mockCanvasContext();

    let lineDash: number[] = [];

    stub.setLineDash = vi.fn((value: number[]) => {
        lineDash = value;
    }) as never;

    stub.getLineDash = vi.fn(() => lineDash) as never;

    return stub;
}

/** Renders a polyline and records the dash pattern in force at each stroke, in stroke order. */
function renderStrokes(options: Shape2DOptions<PolylineState>): StrokeRecord[] {
    const strokes: StrokeRecord[] = [];
    const context = createContext(document.createElement('div'));
    const applyStroke = context.applyStroke.bind(context);

    context.applyStroke = path => {
        strokes.push({
            lineDash: [...context.lineDash],
            lineDashOffset: context.lineDashOffset,
            pathId: path.id,
        });

        return applyStroke(path as never);
    };

    createPolyline(options).render(context);

    return strokes;
}

describe('normalizePolylineRuns', () => {

    test('Should return no runs without segments', () => {
        expect(normalizePolylineRuns(6)).toEqual([]);
        expect(normalizePolylineRuns(6, [])).toEqual([]);
    });

    test('Should return no runs for fewer than two points', () => {
        const segments = [{
            from: 0,
            to: 1,
            lineDash: DASHED,
        }];

        expect(normalizePolylineRuns(1, segments)).toEqual([]);
        expect(normalizePolylineRuns(0, segments)).toEqual([]);
    });

    test('Should cover every interval exactly once', () => {
        const runs = normalizePolylineRuns(6, [{
            from: 1,
            to: 3,
            lineDash: DASHED,
        }]);

        expect(runs.map(run => [run.from, run.to])).toEqual([[0, 1], [1, 3], [3, 5]]);
        expect(runs.map(run => run.lineDash)).toEqual([undefined, DASHED, undefined]);
    });

    test('Should let a later segment win where two overlap', () => {
        const runs = normalizePolylineRuns(6, [
            {
                from: 0,
                to: 4,
                lineDash: DASHED,
            },
            {
                from: 2,
                to: 5,
                lineDash: DOTTED,
            },
        ]);

        expect(runs.map(run => [run.from, run.to])).toEqual([[0, 2], [2, 5]]);
        expect(runs.map(run => run.lineDash)).toEqual([DASHED, DOTTED]);
    });

    test('Should coalesce adjacent segments resolving to the same dash', () => {
        const runs = normalizePolylineRuns(6, [
            {
                from: 1,
                to: 3,
                lineDash: DASHED,
            },
            {
                from: 3,
                to: 5,
                lineDash: DASHED,
            },
        ]);

        expect(runs.map(run => [run.from, run.to])).toEqual([[0, 1], [1, 5]]);
    });

    test('Should clamp indices to the point range', () => {
        const runs = normalizePolylineRuns(6, [{
            from: -4,
            to: 99,
            lineDash: DASHED,
        }]);

        expect(runs.map(run => [run.from, run.to])).toEqual([[0, 5]]);
        expect(runs[0].lineDash).toEqual(DASHED);
    });

    test('Should drop a degenerate segment', () => {
        expect(normalizePolylineRuns(6, [{
            from: 3,
            to: 3,
            lineDash: DASHED,
        }])).toEqual([]);

        expect(normalizePolylineRuns(6, [{
            from: 4,
            to: 2,
            lineDash: DASHED,
        }])).toEqual([]);
    });

    test('Should return no runs when every span resolves to the polyline\'s own dash', () => {
        expect(normalizePolylineRuns(6, [{
            from: 1,
            to: 3,
        }])).toEqual([]);
    });

});

describe('Segmented polyline rendering', () => {

    beforeEach(() => statefulDash());
    afterEach(() => vi.restoreAllMocks());

    test('Should stroke once when unsegmented', () => {
        const strokes = renderStrokes({
            stroke: '#000000',
            points: POINTS,
            lineDash: DASHED,
        });

        expect(strokes).toHaveLength(1);
        expect(strokes[0].lineDash).toEqual(DASHED);
    });

    test('Should stroke once per run with that run\'s dash', () => {
        const strokes = renderStrokes({
            id: 'line',
            stroke: '#000000',
            points: POINTS,
            segments: [{
                from: 1,
                to: 3,
                lineDash: DASHED,
            }],
        });

        expect(strokes.map(stroke => stroke.lineDash)).toEqual([[], DASHED, []]);
        expect(strokes.map(stroke => stroke.pathId)).toEqual(['line:0', 'line:1', 'line:2']);
    });

    test('Should fall back to the polyline\'s own dash for uncovered runs', () => {
        const strokes = renderStrokes({
            stroke: '#000000',
            points: POINTS,
            lineDash: DOTTED,
            segments: [{
                from: 1,
                to: 3,
                lineDash: DASHED,
            }],
        });

        expect(strokes.map(stroke => stroke.lineDash)).toEqual([DOTTED, DASHED, DOTTED]);
    });

    test('Should honour a segment\'s dash offset', () => {
        const strokes = renderStrokes({
            stroke: '#000000',
            points: POINTS,
            segments: [{
                from: 1,
                to: 3,
                lineDash: DASHED,
                lineDashOffset: 4,
            }],
        });

        expect(strokes.map(stroke => stroke.lineDashOffset)).toEqual([0, 4, 0]);
    });

    test.each(SPLITTABLE)('Should split a %s line into runs', renderer => {
        const strokes = renderStrokes({
            stroke: '#000000',
            points: POINTS,
            renderer,
            segments: [{
                from: 1,
                to: 3,
                lineDash: DASHED,
            }],
        });

        expect(strokes.map(stroke => stroke.lineDash)).toEqual([[], DASHED, []]);
    });

    // `cardinal` used to skip point 1 entirely, so a boundary there could not be honoured.
    test.each(SPLITTABLE)('Should split a %s line on its second point', renderer => {
        const strokes = renderStrokes({
            stroke: '#000000',
            points: POINTS,
            renderer,
            segments: [{
                from: 1,
                to: 2,
                lineDash: DASHED,
            }],
        });

        expect(strokes.map(stroke => stroke.lineDash)).toEqual([[], DASHED, []]);
    });

    // A B-spline's commands land on none of its points, so no span of it can be identified.
    test('Should fall back to a single stroke for a basis line', () => {
        const strokes = renderStrokes({
            stroke: '#000000',
            points: POINTS,
            renderer: 'basis',
            lineDash: DOTTED,
            segments: [{
                from: 1,
                to: 3,
                lineDash: DASHED,
            }],
        });

        expect(strokes).toHaveLength(1);
        expect(strokes[0].lineDash).toEqual(DOTTED);
    });

    test('Should fall back to a single stroke for a renderer emitting unattributable commands', () => {
        const renderer: PolylineRenderFunc = (context, path, points) => {
            path.moveTo(points[0][0], points[0][1]);
            path.arc(20, 20, 5, 0, Math.PI);
        };

        const strokes = renderStrokes({
            stroke: '#000000',
            points: POINTS,
            renderer,
            segments: [{
                from: 1,
                to: 3,
                lineDash: DASHED,
            }],
        });

        expect(strokes).toHaveLength(1);
    });

    test('Should skip segmentation while the draw-on transition holds a single point', () => {
        const strokes = renderStrokes({
            stroke: '#000000',
            points: [POINTS[0]],
            segments: [{
                from: 1,
                to: 3,
                lineDash: DASHED,
            }],
        });

        expect(strokes).toHaveLength(1);
    });

    test('Should clamp runs to a point array truncated mid-animation', () => {
        const strokes = renderStrokes({
            stroke: '#000000',
            points: POINTS.slice(0, 3),
            segments: [{
                from: 1,
                to: 5,
                lineDash: DASHED,
            }],
        });

        expect(strokes.map(stroke => stroke.lineDash)).toEqual([[], DASHED]);
    });

    test('Should stroke once again after its segments are removed', () => {
        const context = createContext(document.createElement('div'));
        const strokeSpy = vi.spyOn(context, 'applyStroke');

        const polyline = createPolyline({
            stroke: '#000000',
            points: POINTS,
            segments: [{
                from: 1,
                to: 3,
                lineDash: DASHED,
            }],
        });

        polyline.render(context);
        expect(strokeSpy).toHaveBeenCalledTimes(3);

        strokeSpy.mockClear();
        polyline.segments = undefined;
        polyline.render(context);

        expect(strokeSpy).toHaveBeenCalledTimes(1);
    });

    test('Should hit test against the run sub-paths', () => {
        const context = createContext(document.createElement('div'));
        const polyline = createPolyline({
            id: 'line',
            stroke: '#000000',
            points: POINTS,
            segments: [{
                from: 1,
                to: 3,
                lineDash: DASHED,
            }],
        });

        polyline.render(context);

        // The full path is never stroked when segmented, so on SVG it carries no width or transform.
        const inStroke = vi.spyOn(context, 'isPointInStroke').mockReturnValue(false);

        vi.spyOn(context, 'isPointInPath').mockReturnValue(false);
        polyline.intersectsWith(10, 10);

        expect(inStroke.mock.calls.map(([path]) => path.id)).toEqual(['line:0', 'line:1', 'line:2']);
    });

});
