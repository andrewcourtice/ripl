import {
    Shape2D,
} from '../core';

import type {
    BaseElementState,
    Shape2DOptions,
} from '../core';

import type {
    Context,
} from '../context';

import {
    ContextPath,
} from '../context/path';

import type {
    BorderRadius,
    Point,
} from '../math';

import {
    Box,
} from '../math';

import {
    numberExtent,
} from '@ripl/utilities';

import type {
    PolylineRenderer,
    PolylineRenderFunc,
} from '../math/polyline';

import {
    resolvePolylineRenderer,
} from '../math/polyline';

/** A span of a polyline's points stroked with its own dash pattern. */
export interface PolylineSegment {
    /** Index of the point the span starts at. */
    from: number;
    /** Index of the point the span ends at; the span covers the line drawn between the two points. */
    to: number;
    /** Dash pattern stroked over the span; inherits the polyline's own dash pattern when omitted. */
    lineDash?: number[];
    /** Offset into the span's dash pattern; inherits the polyline's own offset when omitted. */
    lineDashOffset?: number;
}

export interface PolylineState extends BaseElementState {
    /** The ordered points that make up the polyline. */
    points: Point[];
    /** The curve interpolation algorithm, or custom render function, used to draw the polyline. */
    renderer?: PolylineRenderer | PolylineRenderFunc;
    /** Spans of the polyline stroked with their own dash pattern, applied in order so a later span wins where two overlap. */
    segments?: PolylineSegment[];
}

function clampIndex(value: number, max: number): number {
    return Math.max(0, Math.min(Math.round(value), max));
}

function runStyleKey(segment?: PolylineSegment): string {
    return segment?.lineDash
        ? `${segment.lineDash.join(',')}|${segment.lineDashOffset ?? 0}`
        : '';
}

/**
 * Normalizes a polyline's segments into the contiguous, non-overlapping runs it is stroked in.
 *
 * Segments are clamped to the point range and stamped in order (a later segment wins where two
 * overlap), then adjacent runs resolving to the same dash are coalesced so the path is never split
 * where its style does not actually change. Returns an empty array when the whole polyline resolves
 * to its own dash pattern, so a uniformly styled line takes the single-stroke path.
 *
 * @param pointCount - The number of points the polyline is drawn through.
 * @param segments - The spans to normalize.
 * @returns Contiguous runs covering every point exactly once, or an empty array when uniform.
 */
export function normalizePolylineRuns(pointCount: number, segments?: PolylineSegment[]): PolylineSegment[] {
    const intervals = pointCount - 1;

    if (intervals < 1 || !segments?.length) {
        return [];
    }

    const painted = new Array<PolylineSegment | undefined>(intervals).fill(undefined);

    segments.forEach(segment => {
        const from = clampIndex(segment.from, intervals);
        const to = clampIndex(segment.to, intervals);

        for (let index = from; index < to; index++) {
            painted[index] = segment;
        }
    });

    const runs: PolylineSegment[] = [];

    let key: string | undefined;

    painted.forEach((segment, index) => {
        const paintedKey = runStyleKey(segment);

        if (key === paintedKey) {
            runs[runs.length - 1].to = index + 1;
            return;
        }

        key = paintedKey;

        runs.push({
            from: index,
            to: index + 1,
            lineDash: segment?.lineDash,
            lineDashOffset: segment?.lineDashOffset,
        });
    });

    return runs.length > 1 || runs[0].lineDash
        ? runs
        : [];
}

/**
 * Multiplexes a curve renderer's output onto the full path and onto one sub-path per run, so a
 * polyline can be stroked once per run without re-running or re-implementing the renderer.
 *
 * Every command is forwarded to the full path unconditionally, and additionally to each run
 * overlapping the point interval the command spans, prefixed with a `moveTo` the first time that
 * run receives one. A command's interval is tracked by matching its endpoint against the upcoming
 * points; the two-point lookahead covers the one index `cardinal` skips without letting degenerate
 * data trigger a runaway jump.
 */
class SegmentedPathTracer extends ContextPath {

    private _path: ContextPath;
    private _points: Point[];
    private _runs: PolylineSegment[];
    private _createPath: (index: number) => ContextPath;
    private _paths: (ContextPath | undefined)[];
    private _index = 0;
    private _x = 0;
    private _y = 0;
    private _traceable = true;

    /** Whether the renderer's output could be attributed to points, and so split into runs at all. */
    public get valid(): boolean {
        return this._traceable && this._index === this._points.length - 1;
    }

    /** The sub-path traced for each run, in run order; a run the renderer emitted nothing for has none. */
    public get paths(): (ContextPath | undefined)[] {
        return this._paths;
    }

    constructor(path: ContextPath, points: Point[], runs: PolylineSegment[], createPath: (index: number) => ContextPath) {
        super(path.id);

        this._path = path;
        this._points = points;
        this._runs = runs;
        this._createPath = createPath;
        this._paths = new Array<ContextPath | undefined>(runs.length).fill(undefined);
    }

    private _advance(x: number, y: number): number {
        const limit = Math.min(this._index + 2, this._points.length - 1);

        for (let index = this._index + 1; index <= limit; index++) {
            const point = this._points[index];

            if (point[0] === x && point[1] === y) {
                return index;
            }
        }

        return this._index;
    }

    private _emit(draw: (path: ContextPath) => void, x: number, y: number): void {
        draw(this._path);

        const from = this._index;
        const advanced = this._advance(x, y);
        const to = Math.max(advanced, from + 1);

        this._runs.forEach((run, index) => {
            if (run.from >= to || run.to <= from) {
                return;
            }

            let path = this._paths[index];

            if (!path) {
                path = this._createPath(index);
                path.moveTo(this._x, this._y);
                this._paths[index] = path;
            }

            draw(path);
        });

        this._index = advanced;
        this._x = x;
        this._y = y;
    }

    private _untraceable(draw: (path: ContextPath) => void): void {
        this._traceable = false;
        draw(this._path);
    }

    /** Adds an arc centered at `(x, y)`; a polyline traced with one cannot be split into runs. */
    public arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void {
        this._untraceable(path => path.arc(x, y, radius, startAngle, endAngle, counterclockwise));
    }

    /** Adds a tangential arc; a polyline traced with one cannot be split into runs. */
    public arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void {
        this._untraceable(path => path.arcTo(x1, y1, x2, y2, radius));
    }

    /** Adds a full circle; a polyline traced with one cannot be split into runs. */
    public circle(x: number, y: number, radius: number): void {
        this._untraceable(path => path.circle(x, y, radius));
    }

    /** Adds a cubic Bézier curve to `(x, y)`, attributed to the point interval it spans. */
    public bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void {
        this._emit(path => path.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y), x, y);
    }

    /** Closes the current sub-path; a polyline traced with one cannot be split into runs. */
    public closePath(): void {
        this._untraceable(path => path.closePath());
    }

    /** Adds an ellipse; a polyline traced with one cannot be split into runs. */
    public ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void {
        this._untraceable(path => path.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise));
    }

    /** Adds a straight line to `(x, y)`, attributed to the point interval it spans. */
    public lineTo(x: number, y: number): void {
        this._emit(path => path.lineTo(x, y), x, y);
    }

    /** Moves the current point to `(x, y)`, starting a fresh sub-path in every run. */
    public moveTo(x: number, y: number): void {
        this._path.moveTo(x, y);

        // A renderer that starts a new sub-path mid-trace must not continue any run's existing one.
        this._paths.forEach(path => path?.moveTo(x, y));

        this._x = x;
        this._y = y;
    }

    /** Adds a quadratic Bézier curve to `(x, y)`, attributed to the point interval it spans. */
    public quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
        this._emit(path => path.quadraticCurveTo(cpx, cpy, x, y), x, y);
    }

    /** Adds a rectangle; a polyline traced with one cannot be split into runs. */
    public rect(x: number, y: number, width: number, height: number): void {
        this._untraceable(path => path.rect(x, y, width, height));
    }

    /** Adds a rounded rectangle; a polyline traced with one cannot be split into runs. */
    public roundRect(x: number, y: number, width: number, height: number, radii?: BorderRadius): void {
        this._untraceable(path => path.roundRect(x, y, width, height, radii));
    }

    /** Appends another path's commands; a polyline traced with one cannot be split into runs. */
    public addPath(path: ContextPath): void {
        this._untraceable(target => target.addPath(path));
    }

}

/** A multi-point line shape supporting various curve interpolation algorithms. */
export class Polyline extends Shape2D<PolylineState> {

    private _runs: PolylineSegment[] = [];
    private _runPaths: (ContextPath | undefined)[] = [];

    /** The ordered points that make up the polyline. */
    public get points() {
        return this.getStateValue('points');
    }

    public set points(value) {
        this.setStateValue('points', value);
    }

    /** The curve interpolation algorithm, or custom render function, used to draw the polyline. */
    public get renderer() {
        return this.getStateValue('renderer');
    }

    public set renderer(value) {
        this.setStateValue('renderer', value);
    }

    /** Spans of the polyline stroked with their own dash pattern, applied in order so a later span wins where two overlap. */
    public get segments() {
        return this.getStateValue('segments');
    }

    public set segments(value) {
        this.setStateValue('segments', value);
    }

    constructor(options: Shape2DOptions<PolylineState>) {
        super('polyline', options);
    }

    private _trace(context: Context, path: ContextPath, renderer: PolylineRenderFunc): void {
        const points = this.points;

        this._runs = [];
        this._runPaths = [];

        // Clamped per trace, not once at author time: the draw-on transition shrinks `points` per frame.
        const runs = normalizePolylineRuns(points.length, this.segments);

        if (!runs.length) {
            renderer(context, path, points);
            return;
        }

        const tracer = new SegmentedPathTracer(path, points, runs, index => context.createPath(`${this.id}:${index}`));

        renderer(context, tracer, points);

        if (!tracer.valid) {
            return;
        }

        this._runs = runs;
        this._runPaths = tracer.paths;
    }

    protected get hitPaths(): ContextPath[] {
        const paths = this._runPaths.filter(path => !!path) as ContextPath[];

        return paths.length
            ? paths
            : super.hitPaths;
    }

    protected strokePath(context: Context, path: ContextPath): void {
        if (!this._runs.length) {
            return super.strokePath(context, path);
        }

        // The element's own dash is already on the context, so an inherited pattern is picked up too.
        const lineDash = context.lineDash;
        const lineDashOffset = context.lineDashOffset;

        this._runs.forEach((run, index) => {
            const runPath = this._runPaths[index];

            if (!runPath) {
                return;
            }

            context.layer(() => {
                context.lineDash = run.lineDash ?? lineDash;
                context.lineDashOffset = run.lineDashOffset ?? lineDashOffset;
                context.applyStroke(runPath);
            });
        });
    }

    /** @internal Local-space bounding box of the polyline. */
    public _getLocalBoundingBox(): Box {
        const [left, right] = numberExtent(this.points, point => point[0]);
        const [top, bottom] = numberExtent(this.points, point => point[1]);

        return new Box(
            top,
            left,
            bottom,
            right
        );
    }

    /** Renders the polyline to the provided {@link Context} using its resolved curve renderer. */
    public render(context: Context) {
        const renderer = resolvePolylineRenderer(this.renderer);

        return super.render(context, path => this._trace(context, path, renderer));
    }

}

/** Factory function that creates a new `Polyline` instance. */
export function createPolyline(...options: ConstructorParameters<typeof Polyline>) {
    return new Polyline(...options);
}

/** Type guard that checks whether a value is a `Polyline` instance. */
export function elementIsPolyline(value: unknown): value is Polyline {
    return value instanceof Polyline;
}
