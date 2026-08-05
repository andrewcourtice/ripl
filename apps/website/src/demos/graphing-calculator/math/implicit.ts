import {
    createEvaluationScope,
} from './compile';

import type {
    CompiledExpression,
    PlotSampleOptions,
    SampledBranch,
    Viewport2D,
} from '../types';

import type {
    Point,
} from '@ripl/web';

/** The vertex lattice a scalar field is evaluated over. */
interface ImplicitGrid {
    /** The number of cells across the plot. */
    cols: number;
    /** The number of cells down the plot. */
    rows: number;
    /** The number of vertices per row, which is `cols + 1`. */
    stride: number;
    /** The width of one cell, in data units. */
    dx: number;
    /** The height of one cell, in data units. */
    dy: number;
}

/** The unstitched output of the marching squares pass. */
interface ContourSegments {
    /** Flat pairs of edge ids, two entries per segment. */
    edges: number[];
    /** The interpolated crossing point on each visited edge, in data units, keyed by edge id. */
    points: Map<number, Point>;
}

/** The cell size, in CSS pixels, at which a contour reads as smooth without being unaffordable. */
export const DEFAULT_CELL_SIZE_PX = 8;

/** The evaluation ceiling used when {@link PlotSampleOptions.maxEvaluations} is not given. */
export const DEFAULT_MAX_FIELD_EVALUATIONS = 16000;

const EDGE_BOTTOM = 0;
const EDGE_RIGHT = 1;
const EDGE_TOP = 2;
const EDGE_LEFT = 3;

const CASE_EDGES: readonly (readonly number[])[] = [
    [],
    [EDGE_LEFT, EDGE_BOTTOM],
    [EDGE_BOTTOM, EDGE_RIGHT],
    [EDGE_LEFT, EDGE_RIGHT],
    [EDGE_RIGHT, EDGE_TOP],
    [],
    [EDGE_BOTTOM, EDGE_TOP],
    [EDGE_LEFT, EDGE_TOP],
    [EDGE_TOP, EDGE_LEFT],
    [EDGE_BOTTOM, EDGE_TOP],
    [],
    [EDGE_RIGHT, EDGE_TOP],
    [EDGE_LEFT, EDGE_RIGHT],
    [EDGE_BOTTOM, EDGE_RIGHT],
    [EDGE_LEFT, EDGE_BOTTOM],
    [],
];

const SADDLE_ISOLATING_BR_TL: readonly number[] = [EDGE_BOTTOM, EDGE_RIGHT, EDGE_TOP, EDGE_LEFT];
const SADDLE_ISOLATING_BL_TR: readonly number[] = [EDGE_LEFT, EDGE_BOTTOM, EDGE_RIGHT, EDGE_TOP];

function createGrid(viewport: Viewport2D, cellSize: number, maxEvaluations: number): ImplicitGrid {
    const cell = Math.max(1, cellSize);

    let cols = Math.max(1, Math.ceil(viewport.width / cell));
    let rows = Math.max(1, Math.ceil(viewport.height / cell));

    const vertices = (cols + 1) * (rows + 1);

    if (vertices > maxEvaluations) {
        const factor = Math.sqrt(vertices / maxEvaluations);

        cols = Math.max(1, Math.floor(cols / factor));
        rows = Math.max(1, Math.floor(rows / factor));
    }

    return {
        cols,
        rows,
        stride: cols + 1,
        dx: (viewport.xMax - viewport.xMin) / cols,
        dy: (viewport.yMax - viewport.yMin) / rows,
    };
}

function evaluateField(expression: CompiledExpression, options: PlotSampleOptions, grid: ImplicitGrid): Float64Array {
    const { viewport } = options;
    const { cols, rows, stride, dx, dy } = grid;
    const scope = createEvaluationScope(expression, options.params);
    const field = new Float64Array(stride * (rows + 1));

    function fillRow(row: number): void {
        const offset = row * stride;

        scope.set('y', viewport.yMin + row * dy);

        for (let col = 0; col <= cols; col++) {
            scope.set('x', viewport.xMin + col * dx);
            field[offset + col] = expression.evaluate(scope);
        }
    }

    for (let row = 0; row <= rows; row++) {
        fillRow(row);
    }

    return field;
}

function resolveSaddle(code: number, bl: number, br: number, tl: number, tr: number): readonly number[] {
    const denominator = bl + tr - br - tl;
    // The asymptotic decider is the bilinear interpolant's value at the saddle, for zero extra evaluations.
    const center = denominator === 0 ? 0 : (bl * tr - br * tl) / denominator;
    const positiveIsConnected = center > 0;
    const positiveIsDiagonal = code === 5;

    return positiveIsDiagonal === positiveIsConnected ? SADDLE_ISOLATING_BR_TL : SADDLE_ISOLATING_BL_TR;
}

function traceContour(field: Float64Array, grid: ImplicitGrid, viewport: Viewport2D): ContourSegments {
    const { cols, rows, stride, dx, dy } = grid;
    const vertexCount = stride * (rows + 1);
    const points = new Map<number, Point>();
    const edges: number[] = [];

    function interpolate(v0: number, v1: number): number {
        const delta = v0 - v1;

        if (delta === 0 || !Number.isFinite(delta)) {
            return 0.5;
        }

        return Math.min(Math.max(v0 / delta, 0), 1);
    }

    function horizontalEdge(col: number, row: number): number {
        const id = row * stride + col;

        if (!points.has(id)) {
            const t = interpolate(field[id], field[id + 1]);

            points.set(id, [viewport.xMin + (col + t) * dx, viewport.yMin + row * dy]);
        }

        return id;
    }

    function verticalEdge(col: number, row: number): number {
        const id = vertexCount + row * stride + col;

        if (!points.has(id)) {
            const t = interpolate(field[row * stride + col], field[(row + 1) * stride + col]);

            points.set(id, [viewport.xMin + col * dx, viewport.yMin + (row + t) * dy]);
        }

        return id;
    }

    function resolveEdge(edge: number, col: number, row: number): number {
        if (edge === EDGE_BOTTOM) {
            return horizontalEdge(col, row);
        }

        if (edge === EDGE_TOP) {
            return horizontalEdge(col, row + 1);
        }

        if (edge === EDGE_RIGHT) {
            return verticalEdge(col + 1, row);
        }

        return verticalEdge(col, row);
    }

    function appendCell(col: number, row: number): void {
        const bl = field[row * stride + col];
        const br = field[row * stride + col + 1];
        const tl = field[(row + 1) * stride + col];
        const tr = field[(row + 1) * stride + col + 1];

        // A NaN vertex invalidates every cell it touches, or log(x) + y = 0 emits garbage along x = 0.
        if (!Number.isFinite(bl) || !Number.isFinite(br) || !Number.isFinite(tl) || !Number.isFinite(tr)) {
            return;
        }

        const code = (bl > 0 ? 1 : 0) | (br > 0 ? 2 : 0) | (tr > 0 ? 4 : 0) | (tl > 0 ? 8 : 0);
        const pairs = code === 5 || code === 10 ? resolveSaddle(code, bl, br, tl, tr) : CASE_EDGES[code];

        for (let i = 0; i < pairs.length; i += 2) {
            edges.push(resolveEdge(pairs[i], col, row), resolveEdge(pairs[i + 1], col, row));
        }
    }

    function appendRow(row: number): void {
        for (let col = 0; col < cols; col++) {
            appendCell(col, row);
        }
    }

    for (let row = 0; row < rows; row++) {
        appendRow(row);
    }

    return {
        edges,
        points,
    };
}

function stitchRuns(contour: ContourSegments): Point[][] {
    const { edges, points } = contour;
    const count = edges.length / 2;
    const used = new Uint8Array(count);
    const adjacency = new Map<number, number[]>();
    const runs: Point[][] = [];

    function link(edge: number, segment: number): void {
        const linked = adjacency.get(edge);

        if (linked) {
            linked.push(segment);
            return;
        }

        adjacency.set(edge, [segment]);
    }

    function findLooseEnd(segment: number): number {
        const first = edges[segment * 2];
        const second = edges[segment * 2 + 1];

        if (adjacency.get(first)?.length === 1) {
            return first;
        }

        return adjacency.get(second)?.length === 1 ? second : -1;
    }

    function walk(start: number, from: number): Point[] {
        const run: Point[] = [];
        const origin = points.get(from);

        let segment = start;
        let edge = from;

        if (origin) {
            run.push(origin);
        }

        while (segment >= 0) {
            used[segment] = 1;

            const next = edges[segment * 2] === edge ? edges[segment * 2 + 1] : edges[segment * 2];
            const point = points.get(next);

            if (point) {
                run.push(point);
            }

            edge = next;
            segment = adjacency.get(next)?.find(candidate => !used[candidate]) ?? -1;
        }

        return run;
    }

    for (let segment = 0; segment < count; segment++) {
        link(edges[segment * 2], segment);
        link(edges[segment * 2 + 1], segment);
    }

    for (let segment = 0; segment < count; segment++) {
        const loose = used[segment] ? -1 : findLooseEnd(segment);

        if (loose >= 0) {
            runs.push(walk(segment, loose));
        }
    }

    for (let segment = 0; segment < count; segment++) {
        if (used[segment]) {
            continue;
        }

        const run = walk(segment, edges[segment * 2]);

        if (run.length > 1 && run[0] !== run[run.length - 1]) {
            run.push(run[0]);
        }

        runs.push(run);
    }

    return runs;
}

function projectRuns(runs: Point[][], viewport: Viewport2D): SampledBranch[] {
    const scaleX = viewport.width / (viewport.xMax - viewport.xMin);
    const scaleY = viewport.height / (viewport.yMax - viewport.yMin);

    return runs.filter(run => run.length > 1).map(run => ({
        points: run.map(([x, y]): Point => [(x - viewport.xMin) * scaleX, (viewport.yMax - y) * scaleY]),
    }));
}

/**
 * Traces an implicit expression's zero contour with marching squares.
 *
 * The scalar field is the difference the compiler already built by AST subtraction, so the two sides
 * of the equation are never recombined as text. Crossings are placed by linear interpolation along
 * each cell edge, ambiguous saddles are resolved with the asymptotic decider, and the resulting
 * segments are stitched into runs so a contour strokes as a handful of subpaths rather than
 * thousands of disconnected ones.
 *
 * @param expression - The compiled implicit expression.
 * @param options - The viewport, parameter values and evaluation budget.
 * @param cellSize - The target cell size in CSS pixels; raise it for a coarse pass during a gesture.
 * @returns One {@link SampledBranch} per traced run, in screen space, possibly empty.
 * @example
 * ```typescript
 * const coarse = sampleImplicit(compiled, options, 24);
 * const fine = sampleImplicit(compiled, options);
 * ```
 */
export function sampleImplicit(expression: CompiledExpression, options: PlotSampleOptions, cellSize = DEFAULT_CELL_SIZE_PX): SampledBranch[] {
    const { viewport } = options;

    if (expression.error || viewport.width <= 0 || viewport.height <= 0) {
        return [];
    }

    if (viewport.xMax <= viewport.xMin || viewport.yMax <= viewport.yMin) {
        return [];
    }

    const grid = createGrid(viewport, cellSize, options.maxEvaluations ?? DEFAULT_MAX_FIELD_EVALUATIONS);
    const field = evaluateField(expression, options, grid);
    const contour = traceContour(field, grid, viewport);

    return projectRuns(stitchRuns(contour), viewport);
}
